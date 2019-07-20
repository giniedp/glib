deploy:
	gulp build && rsync -avz --copy-links --delete dist/ devil1@giniebox:~/apps/glib-page

.PONY: deploy
