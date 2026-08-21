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
