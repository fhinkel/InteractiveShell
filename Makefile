all: check

.PHONY: start start_schroot_server start_local_server check beautify help

start_singular:
	forever start -l /home/webm2.logs/forever.log -o /home/webm2.logs/out.log -e /home/webm2.logs/err.log --append lib/SingularServer.js

start_singular_local:
	export PATH=$(@D)/:$(PATH); node lib/SingularLocalServer.js

kill:
	kill `ps ax | grep Server | grep -v monitor | grep node | awk '{print $$1}'`

total_cleanup:
	perl perl-scripts/total_cleanup.pl

check:
	mocha tests/mocha.js --reporter spec

pretty:
	js-beautify -w 80 lib/mathServer.js -o m2server-module.pretty.js
	js-beautify -w 80 public/m2-node.js -o public/m2-node.pretty.js

help:
	@echo "Possible make targets:"
	@echo "  check           run mocha tests"
	@echo "  pretty          make *.pretty.js files from *.js files"
	@echo "  start_singular  start Singular server with secure containers forever"
	@echo "  start_singular_local     start local Singular server forever"
	@echo "  kill            kill MathProgramServer (with secure containers or local), but not forever script"
