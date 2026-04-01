.PHONY: docker-run git-add git-commit git-push-main git-release

docker-run:
	docker run -d --name dmmp_web_v2 --restart unless-stopped -p 80:80 ghcr.io/mutesasiratimo/dmmp_web_v2:latest

git-add:
	git add .

git-commit:
	@if [ -z "$(m)" ]; then echo "Usage: make git-commit m='your commit message'"; exit 1; fi
	git commit -m "$(m)"

git-push-main:
	git push origin main

git-release: git-add git-commit git-push-main
