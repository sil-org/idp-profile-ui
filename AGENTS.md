# AGENTS.md

## Project overview

Vue 3 + Vuetify SPA for IdP profile management (password, recovery methods, and 2-step verification). Built with Vite and deployed as static UI assets.

## Setup commands

```bash
# requirements: Node 22.x, npm (package-lock present)
npm install
npm run serve         # Vite dev server on :8000
```

Docker/local-stack workflow from README:

```bash
make                  # brings up full local stack via docker compose
```

## Commands

```bash
npm run lint          # lint check
npm run fix           # lint fix
npm run format:check  # prettier format check
npm run format        # prettier format fix
```

```bash
# end-to-end tests (Playwright, Chromium, fake API; no docker stack needed)
npx playwright install chromium        # once
npm run test:e2e                       # full suite (functional only on macOS/Windows)
npx playwright test e2e/auth.spec.js   # single file
npm run test:e2e:ui                    # interactive runner

# screenshot tests only run on Linux, so use Docker locally:
make e2e                               # functional + screenshots, same image as CI
make e2e-update                        # regenerate screenshot baselines after an intended UI change
```

CI (`.github/workflows/test.yml`) runs:

```bash
npm ci
npm run format:check
npm run lint
npm run build
npx playwright test   # separate job in mcr.microsoft.com/playwright, includes screenshots
```

## Code style conventions

- **Framework patterns:** Vue SFCs with a mix of Composition API (`<script setup>`) and Options API; some files use both (`src/profile/Index.vue`).
- **State management:** No Pinia/Vuex/Redux. State is shared via Vue `reactive`/`ref` modules (`src/global/mfa.js`, `src/global/recoveryMethods.js`, `src/plugins/user.js`, `src/eventBus.js`).
- **Routing/auth:** `vue-router` with guards in `src/plugins/router.js`; unauthorized API responses trigger login redirects.
- **Imports:** `@` alias points to `src` (configured in `vite.config.mjs`)
- **Components:** PascalCase `.vue` files; feature-first folders (`src/profile`, `src/password`, `src/2sv`), shared UI in `src/global`.
- **Formatting:** Prettier (`.prettierrc`) enforces 2 spaces, single quotes, no semicolons, print width 120.
- **Linting:** Flat ESLint + `eslint-plugin-vue` recommended + Prettier rule; formatting-conflicting Vue rules are disabled.
- **i18n:** Use `$t(...)` translation keys (see `src/locales` and `src/plugins/i18n.js`).
- **Styles:** Mostly component-scoped `<style scoped>` with some intentional global styles (e.g., `src/App.vue`).

## Directory structure

```text
src/
  main.js                 # app bootstrap, plugin registration, Sentry init
  plugins/                # api, router, i18n, vuetify, auth/user helpers
  global/                 # shared components + shared reactive stores/utils
  profile/                # profile home/progress/cards/wizard flow
  password/               # password create/reset/recovery flow
  2sv/                    # TOTP/security key/backup code flow
  help/                   # HelpButton
  locales/                # translation JSON files
  assets/                 # static images
e2e/                      # Playwright tests, fake API (mocks/) and screenshot baselines
api/                      # local API override files for docker stack
development/              # local IdP/dev infra config files
dynamorestart/            # Bash + AWS CLI utility scripts to seed DynamoDB
serverless-mfa-api/       # Dockerfile wrapper for MFA API service
specs/technical/          # architecture/front-end/back-end/infrastructure notes
```

## Testing guidelines

- Playwright tests live in `e2e/<feature>/` (mirroring `src/<feature>/`); config is `playwright.config.js`.
- Tests run against a production build (`vite build --mode e2e`, served by `vite preview`). `.env.e2e` points the API at
  `/api` on the same origin, where `e2e/mocks/api.js` (`MockApi`) answers every endpoint from in-memory state. Data
  builders are in `e2e/mocks/data.js`. Use `api.use(state)`, `api.state`, `api.fail(method, path, error)` and
  `api.callsTo(method, path)` in tests.
- `e2e/fixtures.js` starts the clock at `NOW` (never freeze it: `@click.once` stops working), uses the UTC time zone and en-US, serves fonts/icons from node_modules,
  stubs reCAPTCHA and answers all other external requests with empty responses. Tests must not depend on the network.
- Find elements the way users do: `getByRole`, `getByLabel`, `getByText`, and the `action(page, name)` helper for
  anything clickable (Vuetify renders some buttons as links). Do not select Vuetify classes (`.v-btn` etc.) so the
  suite survives a UI framework change. Give icon-only controls an `aria-label` rather than selecting icon classes.
- Screenshot tests are tagged `@visual` and only run on Linux (CI or `make e2e`). Baselines live in
  `e2e/__screenshots__/`; update them with `make e2e-update` and review the PNG diffs in the PR.
- The WebAuthn flow uses Chromium's virtual authenticator (see `e2e/2sv/security-key.spec.js`).
- When bumping `@playwright/test`, also update the image tag in `.github/workflows/test.yml` and the `Makefile`.

## PR/commit conventions (discoverable)

- PRs use `.github/pull_request_template.md` sections (`Added/Changed/Fixed/...`) and ask for a backlog link.
- Template checklist explicitly mentions running:
  - `make format`
  - `make depsupdate`
- CODEOWNERS: `@sil-org/js-devs`
- No explicit commit message or branch naming convention was found in repo config.

## Do not do

- Do **not** edit generated files manually (`components.d.ts` is generated by `unplugin-vue-components`).
- Do **not** hand-edit lockfiles; use package manager commands (`npm install` / `npm update` / `make depsupdate`).
- Do **not** commit secrets or local env files (`.env.local` is local-only).
- Do **not** change non-UI service code (`dynamorestart/`, `serverless-mfa-api/`, `api/`) unless the task explicitly targets local stack/backend integration.
- Be careful with `npm run build`: it appends `UI_VERSION` into `.env`.

## Ambiguities/inconsistencies to be aware of

- Mixed component scripting styles (Options API, Composition API, and mixed-in-one-file patterns).
- `specs/technical/*.md` contains some placeholder/open-question content; treat those files as directional, not authoritative implementation rules.
