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

Enter app with a special "invitation" link, e.g., <https://profile.gtis.guru/#/profile/intro?invite=2b2d424e-8cb0-49c7-8c0b-7f6603INVITE>. If needed, this user's username is **b**

## Run the UI as a Docker container

See notes in Environment section regarding HTTPS and _traefik_ configuration.

- The Docker image can be built from the Dockerfile at the root of this repository, and is used in the Docker Compose environment.
- `VITE_API_BASE_URL` must be populated as an environment variable so the UI knows how to communicate to the API.

## Local development

When the `make` is run, the project will be in development mode and any updates made to the code will automatically be reloaded.

### Updating dependencies

Use `make depsupdate` if you want to update the npm dependencies. This command
does the npm update and updates our "installed-versions.json" file
with the versions of our root-level dependencies that are installed (to provide more
human-readable diffs after updating npm dependencies).

### Running production version of the app locally

1. Within `compose.yaml` change the `ui:` container's `command: npm run serve` to `command: npm run serve:prod`
2. Run `make dist`
3. Run `make`

# Build for deployment

## Step 1 – Environment variables

Copy `.env.dist` to `env.local` and update the relevant values, e.g., a UI deployment would only require the UI-related variables be present and populated.

## Step 2 – Customizations

The following files should be replaced before running the build.

- `./favicon.ico`
- `src/assets/logo.png`

## Step 3 – Build for deployment

`make dist` can be used in a docker environment, otherwise the following steps can be used in a node environment:

1. `npm install` will install dependencies
2. `npm run build` will produce the production-ready app in the project root's `dist` folder.
3. The contents of `dist` can then be deployed.
