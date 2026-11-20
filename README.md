# Axon Digital — site + voice agent

Static site. Open `index.html` (or run a local server) — no build step.

## Files
- `index.html` — the whole landing page (styles + UI script inline).
- `voice.js` — the "Talk to Emili" live call, using `retell-client-js-sdk` v3.
- `README.md` — this file.

## How the call works
`voice.js` imports `RetellClient` from `https://esm.sh/retell-client-js-sdk` and calls:

```js
const client = new RetellClient({ key: PUBLIC_KEY });
const call = client.createWebCall({ agent_id: AGENT_ID, hooks: { onStatus, onEnd, onError } });
await call.end();
```

The SDK handles the token request (`POST /v3/create-web-call`) and the audio transport itself.
`RetellWebClient` + `startCall({ accessToken })` is the deprecated v2 path — do not go back to it.

- Public key: `public_key_7e599961f40a3fa942c9d`
- Agent: `agent_b56cecb7ced0f34e1a43ce1e92`

## If "Call the Agent" fails
The page shows the exact error Retell returns in the amber box. Check, in order:

1. **Agent is published.** In the Retell dashboard the agent must be published / have a
   working version. An unpublished agent makes `create-web-call` fail.
2. **Web call channel enabled** for that agent (Retell → Agent → Channels / Phone → Web call).
3. **Public key allows this origin.** If the key has allowed domains set, add the host you're
   serving from (e.g. `localhost:55992`, or your real domain). A blocked origin shows up as a
   CORS / 401 error.
4. **Microphone permission** granted for the page, and the page served over `https` or
   `localhost` (mic needs a secure context).
5. If the key has reCAPTCHA enabled, `createWebCall` needs a fresh `recaptchaToken`.

## Editing the page
- Colours and type: the `:root` variables at the top of `index.html`.
- Copy: edit the text directly; every section is a `<section>` with an `id` used by the nav.
- Voice buttons: any element with `class="js-talk"` opens the demo modal; any element with
  `class="js-close-voice"` closes it. The modal's element ids are read by `voice.js`.
