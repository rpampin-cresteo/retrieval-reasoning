.PHONY: bootstrap env-build dev start search-cli chat-cli check

bootstrap:
	@npm run bootstrap

env-build:
	@npm run env:build

dev:
	@npm run dev

start:
	@npm run start

search-cli:
	@npm run search:cli -- $(ARGS)

chat-cli:
	@npm run chat:cli -- $(ARGS)

check:
	@npm run check
