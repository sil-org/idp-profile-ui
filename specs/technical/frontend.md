# Frontend

## Framework and language

Vue 3, JavaScript, Vuetify 3 component library, Material Design Icons

## Pages and routes

(See routes.js files in the source tree for the current route definitions.)

## File structure

| Path          | Description                                 |
|---------------|---------------------------------------------|
| public/       | Static files (_headers, robots.txt, etc.)   |
| src/          | Vue app source code                         |
| src/2sv/      | 2-step verification feature code            |
| src/assets/   | Static assets (images, icons, etc.)         |
| src/global/   | Global components, stores, and utilities    |
| src/help/     | Help button                                 |
| src/locales/  | i18n translation files                      |
| src/password/ | Password set and reset feature code         |
| src/plugins/  | Vue plugins                                 |
| src/profile/  | Profile home page feature code              |

## State management

| State type | Where managed | Notes |
|------------|---------------|-------|
|            |               |       |

## API communication

All calls go to the Profile Manager backend. Domain-specific plugins (`src/plugins`) handle:

- Formulating requests with the correct headers and payloads
- Parsing JSON responses
- Mapping HTTP error status codes to typed error objects displayed in the UI

## Authentication flow

1. User visits any protected route → redirected to the backend `/auth/login` path if no valid session cookie.
2. The backend handles the SAML SP flow with the IdP.
3. On success, the backend sets an HTTP-only cookie and redirects back to the frontend
4. Logout calls redirects to the backend `/auth/logout`; backend clears cookie
5. On 401 from any API call, frontend redirects to backend `/auth/login`

## Non-functional requirements

- **Accessibility:** ?
- **Performance:** ?
- **Browser support:** Recent (? number of) versions of Chrome, Firefox, Safari, Edge
- **Responsive breakpoints:** Desktop-first; minimum supported width ? px (internal tool, not used on mobile)

## Open questions

- [ ] For team standardization, the style library should be converted to Bootstrap.
