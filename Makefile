deploy:
	yarn build && rsync -avz --copy-links --delete apps/web/dist/ devil1@giniebox:~/apps/glib-page

.PONY: deploy
