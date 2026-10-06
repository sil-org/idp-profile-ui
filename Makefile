start: deps mfaapi
	docker compose pull
	docker compose up -d proxy adminer

deps:
	docker compose run --rm node npm install

depsupdate:
	docker compose run --rm node npm update
	docker compose run --rm node npm ls --package-lock-only --json > installed-versions.json

dist: deps
	docker compose run --rm node npm run build

logs:
	docker compose logs
	docker compose exec idp cat /var/log/apache2/error.log

adminer:
	docker compose up -d adminer

mfaapi:
	docker compose up -d mfaapi

clean:
	docker compose run --rm node npm run clean
	docker compose kill
	docker compose rm -f

format:
	docker compose run --rm node npm run format

lint:
	docker compose run --rm node npm run lint

build:
	docker compose build

# End-to-end tests in the Playwright image, so screenshots match CI. The anonymous volume keeps the container's
# Linux node_modules separate from the host's.
.PHONY: e2e e2e-update
PLAYWRIGHT_IMAGE = mcr.microsoft.com/playwright:v1.63.0-noble
PLAYWRIGHT_RUN = docker run --rm --ipc=host -v "$(CURDIR)":/work -v /work/node_modules -w /work $(PLAYWRIGHT_IMAGE)

e2e:
	$(PLAYWRIGHT_RUN) sh -c "npm ci && npx playwright test"

e2e-update:
	$(PLAYWRIGHT_RUN) sh -c "npm ci && npx playwright test --grep @visual --update-snapshots"
