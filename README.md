[![Crowdin](https://d322cqt584bo4o.cloudfront.net/idp-profile-ui/localized.svg)](https://crowdin.com/project/idp-profile-ui)

# idp-profile-ui

Identity management UI for a given IdP that will help users establish good passwords, recovery options and 2-Step Verification.

# Getting started

Install [Docker](https://docs.docker.com/install) and [Make](https://www.gnu.org/software/make)

Project is managed with [vitejs](https://vitejs.dev/).

## Environment

This app is set up to use HTTPS for WebAuthn testing. In order to facilitate this, _traefik_ must be configured. Some values are located in the `.env.local` and some are located in the `compose.yaml` under the `proxy` service. See [traefik docs](https://github.com/sil-org/traefik-https-proxy) for more information.

1. Copy `.env.dist` to `.env.local`
2. Edit `.env.local`:
   - replace 'example.org' with a domain you have DNS edit permissions
   - add a token to CLOUDFLARE_DNS_API_TOKEN
   - add your email to LETS_ENCRYPT_EMAIL

## i18n

i18n support is built-in however the translation files must be generated and dropped into the `src/locales` folder with the appropriate name, e.g., `en.json`, `fr.json`, `ko.json` before the app is built.

## Run the full app locally

1. Run `make` from the project root.
2. The app will be running on the domain configured for traefik, e.g., <https://profile.gtis.guru>.

### Authentication

An IdP infrastructure will be running locally and is required for authentication into the app's protected pages.

#### Existing user

- Username: **a**
- Password: **a**

#### New user (has no password yet)

Enter app with a special "invitation" link, e.g., <https://profile.gtis.guru/#/profile/intro?invite=2b2d424e-8cb0-49c7-8c0b-7f6603INVITE> or <https://profile.gtis.guru/profile/#/profile/intro?invite=2b2d424e-8cb0-49c7-8c0b-7f6603INVITE> if using /profile as the VITE_BASE_PATH. If needed, this user's username is **b**

### Running from a subdirectory

To test the app at a path such as <https://profile.gtis.guru/profile/> (see `VITE_BASE_PATH` in
[Build for deployment](#build-for-deployment)):

1. Add `VITE_BASE_PATH=/profile/` to `.env.local`.
2. Add the path to the UI URLs in `compose.yaml` (don't commit these changes):
   - `api`: `UI_URL: 'https://profile.gtis.guru/profile/#'`. The API only returns to URLs that start with `UI_URL`, so
     without this, login and logout land on the root.
   - `broker`: `PASSWORD_PROFILE_URL: 'https://profile.gtis.guru/profile/'`
   - `idp`: `PASSWORD_CHANGE_URL`, `PASSWORD_FORGOT_URL` and `PROFILE_URL`, e.g.,
     `PROFILE_URL: 'https://profile.gtis.guru/profile/#'`
3. Run `make`, then open <https://profile.gtis.guru/profile/>.

## Run the UI as a Docker container

See notes in Environment section regarding HTTPS and _traefik_ configuration.

- The Docker image can be built from the Dockerfile at the root of this repository, and is used in the Docker Compose environment.
- `VITE_API_BASE_URL` must be populated as an environment variable so the UI knows how to communicate to the API.

## Local development

When `make` is run, the project will be in development mode and any updates made to the code will automatically be reloaded.

### Updating dependencies

Use `make depsupdate` if you want to update the npm dependencies. This command
does the npm update and updates our "installed-versions.json" file
with the versions of our root-level dependencies that are installed (to provide more
human-readable diffs after updating npm dependencies).

### Running production version of the app locally

1. Within `compose.yaml` change the `ui:` container's `command: npm run serve` to `command: npm run serve:prod`
2. Run `make dist`
3. Run `make`

## End-to-end tests

The [Playwright](https://playwright.dev) tests in `e2e/` run Chromium against a production build of the UI with a fake
API (`e2e/mocks`), so they don't need the full local stack or a network connection.

Run them in the same Playwright Docker image that CI uses:

```bash
make e2e
```

Or run them with Node directly, after `npm install`:

```bash
npx playwright install chromium        # once, downloads the browser
npm run test:e2e                       # whole suite
npx playwright test e2e/auth.spec.js   # a single file
npm run test:e2e:ui                    # interactive runner
```

# Build for deployment

## Step 1 – Environment variables

Copy `.env.dist` to `.env.local` and update the relevant values, e.g., a UI deployment would only require the UI-related variables be present and populated.

By default the app is built to be served from the root of its domain (e.g., `https://profile.example.org/`). To serve it
from a subdirectory instead, set `VITE_BASE_PATH`, e.g., `VITE_BASE_PATH=/profile/` for `https://login.example.org/profile/`.
The API's `UI_URL` and the IdP's links to the UI (`PROFILE_URL` and the password URLs) must then include that path too.

## Step 2 – Customizations

The following files should be replaced before running the build.

- `./favicon.ico`
- `src/assets/logo.png`

## Step 3 – Build for deployment

`make dist` can be used in a docker environment, otherwise the following steps can be used in a node environment:

1. `npm install` will install dependencies
2. `npm run build` will produce the production-ready app in the project root's `dist` folder.
3. The contents of `dist` can then be deployed.

If `VITE_BASE_PATH` is set, the build still writes to the top of `dist`, so the deployment has to serve those files under
that path. With Cloudflare Workers static assets, for example, copy them into a matching folder of the assets directory
(`<assets>/profile/index.html`, `<assets>/profile/assets/...`), but keep `_headers` at the top (`<assets>/_headers`):
Cloudflare only reads it there.
