This is the home of all `@gglib/*` packages

Packages contain no build commands. Configuration files are automaticaly generated. All build commands are located in [../tools/glib](../tools/glib)

How to introduce a new package

1. create a folder in this directory
2. create a minimal `package.json` with name and version
3. run `yarn gulp glib:update` from root project
