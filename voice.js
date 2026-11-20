import { RetellClient } from "https://esm.sh/retell-client-js-sdk";

const RETELL_PUBLIC_KEY = "public_key_7e599961f40a3fa942c9d";
const RETELL_AGENT_ID   = "agent_b56cecb7ced0f34e1a43ce1e92";

/* RetellClient talks to POST /v3/create-web-call with the public key —
   the old /v2 route (and RetellWebClient.startCall) is deprecated. */
const client = new RetellClient({ key: RETELL_PUBLIC_KEY });
let call = null;
let callActive = false;

/* ---------- UI refs ---------- */
const overlay    = document.getElementById('voiceOverlay');
const sheet      = overlay.querySelector('.voice-sheet');
const orb        = document.getElementById('voiceOrb');
const statusEl   = document.getElementById('voiceStatus');
const startBtn   = document.getElementById('voiceStart');
const startLabel = document.getElementById('voiceStartLabel');
const closeBtn   = document.getElementById('voiceClose');
const liveBadge  = document.getElementById('voiceLive');
const fallbackEl = document.getElementById('voiceFallback');
const fallbackMsg= document.getElementById('voiceFallbackMsg');
const hintEl     = document.getElementById('voiceHint');
let lastFocus = null;

function setStatus(t){ if(statusEl) statusEl.textContent = t; }
function setButton(label, variant){
  startLabel.textContent = label;
  startBtn.classList.toggle('btn-danger', variant === 'danger');
  startBtn.classList.toggle('btn-primary', variant !== 'danger');
  startBtn.disabled = false;
}
function showError(msg){
  if(!fallbackEl) return;
  fallbackMsg.textContent = msg;
  fallbackEl.classList.add('show');
}
function clearError(){ if(fallbackEl) fallbackEl.classList.remove('show'); }

function resetUI(){
  callActive = false;
  call = null;
  orb.classList.remove('live','connecting');
  if(liveBadge) liveBadge.style.display = 'none';
  setStatus('Ready to talk');
  setButton('Call the Agent', 'primary');
}

function openVoice(){
  lastFocus = document.activeElement;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden','false');
  document.body.classList.add('voice-open');
  sheet.focus({preventScroll:true});
  const menu = document.getElementById('mobileMenu');
  const menuBtn = document.getElementById('menuBtn');
  if(menu && menu.classList.contains('open')){
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded','false');
  }
  if(!callActive) setStatus('Ready to talk');
}

async function closeVoice(){
  if(callActive) await endCall();
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden','true');
  document.body.classList.remove('voice-open');
  if(lastFocus && lastFocus.focus) lastFocus.focus({preventScroll:true});
}

/* ---------- call control (SDK v3) ---------- */
function startCall(){
  if(callActive) return;
  clearError();
  callActive = true;
  startBtn.disabled = true;
  startLabel.textContent = 'Connecting…';
  setStatus('Connecting…');
  orb.classList.remove('live');
  orb.classList.add('connecting');

  call = client.createWebCall({
    agent_id: RETELL_AGENT_ID,
    hooks: {
      onStatus: (status) => {
        if(status === 'live'){
          orb.classList.remove('connecting');
          orb.classList.add('live');
          if(liveBadge) liveBadge.style.display = 'inline-flex';
          setStatus('Live — Emili is listening');
          setButton('End Call', 'danger');
        }
      },
      onEnd: () => {
        resetUI();
        setStatus('Call ended');
      },
      onError: (err) => {
        console.error('[Retell] call error:', err);
        showError((err && (err.message || err.error)) ? (err.message || err.error) : 'The call hit an error.');
        resetUI();
        setStatus('Could not connect');
      }
    }
  });

  /* if createWebCall throws synchronously, surface it */
  if(call && typeof call.then === 'function'){
    call.catch((err) => {
      console.error('[Retell] createWebCall rejected:', err);
      showError((err && err.message) ? err.message : 'The call could not start.');
      resetUI();
      setStatus('Could not connect');
    });
  }
}

async function endCall(){
  try{
    if(call && typeof call.end === 'function') await call.end();
  }catch(e){ console.warn('[Retell] end failed:', e); }
  resetUI();
  setStatus('Call ended');
}

startBtn.addEventListener('click', () => {
  if(callActive) endCall();
  else startCall();
});

/* ---------- openers / closers ---------- */
document.querySelectorAll('.js-talk').forEach(btn => {
  btn.addEventListener('click', (e) => { e.preventDefault(); openVoice(); });
});
closeBtn.addEventListener('click', closeVoice);
document.querySelectorAll('.js-close-voice').forEach(a => {
  a.addEventListener('click', () => closeVoice());
});
overlay.addEventListener('mousedown', (e) => { if(e.target === overlay) closeVoice(); });
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && overlay.classList.contains('open')) closeVoice();
});
