.PHONY: run build test

IMAGE ?= mergeproof-hack-apertus
PORT ?= 8789
LLM_NAME ?= swiss-ai/Apertus-v1.5-8B
LLM_BASE_URL ?=
LLM_API_KEY ?=

build:
	docker build -t $(IMAGE) .

test:
	cd src/mergeproof && npm test

run: build
	docker run --rm -p $(PORT):8789 \
		-e LLM_NAME="$(LLM_NAME)" \
		-e LLM_BASE_URL="$(LLM_BASE_URL)" \
		-e LLM_API_KEY="$(LLM_API_KEY)" \
		$(IMAGE)
