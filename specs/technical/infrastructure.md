# Infrastructure

## Environments

| Environment | Purpose             | Notes |
| ----------- | ------------------- | ----- |
| Local       | Development         |       |
| Staging     | Pre-release testing |       |
| Production  | Live                |       |

## Hosting

| Component | Platform           | Notes |
| --------- | ------------------ | ----- |
| App       | Cloudflare Workers |       |
| Database  | N/A                |       |
| TLS       | Cloudflare         |       |
| DNS       | Cloudflare         |       |

## CI/CD pipeline

| Event | Pipeline                            |
| ----- | ----------------------------------- |
| Push  | prettier check, eslint, build check |

**Tooling:** GitHub Actions

Deployment: upload built artifacts to Cloudflare Workers

## Secrets management

All secrets are stored in GitHub Actions secrets.

| Parameter            | Description          |
| -------------------- | -------------------- |
| CLOUDFLARE_API_TOKEN | Cloudflare API token |

Local development uses a `.env.local` file (not committed).

## Observability

| Signal           | Tool       | Notes |
| ---------------- | ---------- | ----- |
| Application logs | Cloudflare |       |
| Errors           | Sentry     |       |
| Uptime           | Nodeping   |       |

## Backup and recovery

N/A

## Infrastructure as code

N/A

## Open questions

- [ ]
