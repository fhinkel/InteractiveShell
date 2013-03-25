all: check

.PHONY: start start_schroot_server start_local_server check beautify help

start:
	forever start -l /home/webm2.logs/forever.log -o /home/webm2.logs/out.log -e /home/webm2.logs/err.log --append m2server-schroot.js

start_local:
	export PATH=$(@D)/:$(PATH); node m2server.js

kill:
	kill `ps ax | grep m2server | grep -v monitor | grep node | awk '{print $$1}'`

total_cleanup:
	perl perl-scripts/total_cleanup.pl

check:
	mocha tests/mocha.js --reporter spec

pretty:
	js-beautify -w 80 m2server-module.js -o m2server-module.pretty.js
	js-beautify -w 80 public/m2-node.js -o public/m2-node.pretty.js

help:
	@echo "Possible make targets:"
	@echo "  check         run mocha tests"
	@echo "  pretty        make *.pretty.js files from *.js files"
	@echo "  start         start schroot server with forever script"
	@echo "  start_local   start local server"
	@echo "  kill          kill m2server (schroot or local), but not forever script"

