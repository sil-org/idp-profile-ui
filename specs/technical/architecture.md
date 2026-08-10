# Architecture

## System context

```
[Profile Manager User]
      |
      | HTTPS (browser)
      v
[Profile Manager Frontend]  --HTTPS-->  [Profile Manager Backend] 
       (Vue SPA)                            (API server)  
```

Profile Manager is a two-tier split-stack app. The frontend is a Vue SPA; the backend is a PHP API server. Clients access the API for IdP profile management. Profile Manager's core purpose is to allow IdP users to manage their password, recovery methods, and 2-step verification options. It may be expanded in the future to allow helpdesk personnel and/or admin users to manage the IdP itself. In that eventuality, the app name would likely be changed to reflect the broader scope.

This repository and spec are focused on the frontend only. The backend and infrastructure are in separate repositories and are not described here.

## Tech stack

| Layer              | Choice             |
|--------------------|--------------------|
| Frontend framework | Vue                |
| Frontend language  | JavaScript         |
| Backend framework  | Yii2               |
| Backend language   | PHP                |
| Primary datastore  | MariaDB            |
| Auth mechanism     | SAML               |
| Hosting            | Cloudflare Workers |
| CI/CD              | GitHub Actions     |

## Component overview

| directory    | description                                                           |
|--------------|-----------------------------------------------------------------------|
| src/         | Vue app — compiled to a static bundle, deployed to Cloudflare Workers |

## Cross-cutting concerns

### Authentication and authorization

Profile Manager authentication is through a SAML IdP. Authorization is controlled by the backend, with only two levels of access: reset and login. The reset level is a restricted access level that allows a user to change their password. Once changed, they must gain full login access by logging in with the new password.

Authorization within Profile Manager is role-based. Roles are described in [Data Models](data-models.md).

### Error handling strategy

Backend returns JSON error responses shaped as shown by the following example:

```json
{"name":"Unauthorized","message":"Your request was made with invalid credentials.","code":0,"status":401}
```

### Configuration and secrets

See the .env.dist file.

## Risks and open questions

- [ ] Vue 3 is not the team's strong suit. Would it be worth converting to Svelte?
