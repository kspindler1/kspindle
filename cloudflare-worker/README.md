# Public Kloud Genie API (Cloudflare Workers)

The default setup uses Cloudflare Workers AI, so visitors can try Kloud Genie
without creating an AI-provider account or entering an API key. The Worker
includes an AI binding and a default chat model; Cloudflare account access and
Workers AI availability/usage limits still apply. The public service is
protected by Turnstile, 10 requests per minute per IP, and a shared maximum of
100 requests per UTC day.

Provider API keys, when an external provider is selected, and the Turnstile
secret stay in Cloudflare Worker secrets. They are never included in the page or
sent to visitors. The Worker does not log or persist prompts or responses.

## Default: shared Cloudflare Workers AI

The checked-in `wrangler.toml` enables the Workers AI binding and configures
`@cf/meta/llama-3.1-8b-instruct`. No `LLM_API_KEY` is needed for this provider.
You can change `LLM_MODEL` to another chat model available to your Cloudflare
account.

## Optional external providers

The Worker also supports Anthropic's Messages API and providers offering an
OpenAI-compatible Chat Completions endpoint.

For an OpenAI-compatible endpoint, change `[vars]` in `wrangler.toml`:

```toml
LLM_PROVIDER = "openai-compatible"
LLM_API_URL = "https://api.openai.com/v1/chat/completions"
LLM_MODEL = "your-provider-model-id"
```

Use the exact HTTPS endpoint and model ID supplied by the provider. For
Anthropic, set `LLM_PROVIDER = "anthropic"` and `LLM_MODEL` to the desired
model; the Worker uses Anthropic's Messages API. Add the selected provider key
as the `LLM_API_KEY` secret. Never put credentials in the endpoint URL or
checked-in files.

## Deploy and publish

1. Create a Cloudflare Turnstile widget restricted to `kspindler1.github.io`.
   Set its public site key in `wrangler.toml` as `TURNSTILE_SITE_KEY`.
2. Install Node.js 18 or later, then from this directory run:

   ```powershell
   npm install
   npx wrangler login
   ```

3. Add the Turnstile secret. For an external provider, also add its API key.
   Wrangler prompts for each value; do not put secret values in source files:

   ```powershell
   npx wrangler secret put TURNSTILE_SECRET_KEY
   npx wrangler secret put LLM_API_KEY
   ```

   Skip the `LLM_API_KEY` command when using the default Cloudflare Workers AI
   binding.

4. Deploy the Worker:

   ```powershell
   npm run deploy
   ```

5. Set `window.KLOUD_API_URL` in the repository-root `kloud-config.js` to the
   HTTPS `workers.dev` URL reported by Wrangler.
6. Publish `kloud-config.js`, `Kloud_Shark_Tank_Full_Experience.html`, and
   `sw.js` to the GitHub Pages repository.

The `TURNSTILE_HOSTNAME` and `ALLOWED_ORIGIN` values in `wrangler.toml` are
limited to the current GitHub Pages host. If the site moves, update both the
Worker configuration and the Turnstile widget's allowed host.

## Limits and privacy

- Each valid Turnstile-verified request consumes one global daily allowance,
  even if the selected model later returns an error.
- The 100-request cap resets at 00:00 UTC. A Durable Object transaction makes
  the shared counter atomic across Worker instances.
- The per-IP limit uses a secret-keyed HMAC digest; raw IPs, prompts, and
  responses are not written to Durable Object storage.
- The Worker supplies the authoritative agent roster and fixed system
  instructions. Browser requests cannot replace them. User messages and this
  roster are sent to the configured AI provider. The page warns users not to
  submit patient-identifiable, confidential, or regulated data.
- The public site does not connect to Apollo, Veeva, SharePoint, or Copilot
  Studio agents. This endpoint powers Kloud Genie's Q&A only.
