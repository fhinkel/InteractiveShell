all: check

.PHONY: start start_schroot_server start_local_server check beautify help

start_singular:
	forever start -l /home/webm2.logs/SingularForever.log -o /home/webm2.logs/SingularOut.log -e /home/webm2.logs/SingularErr.log --append lib/SingularServer.js

start_singular_local:
	export PATH=$(@D)/:$(PATH); node lib/SingularLocalServer.js

start_m2:
	forever start -l /home/webm2.logs/M2forever.log -o /home/webm2.logs/M2out.log -e /home/webm2.logs/M2err.log --append lib/Macaulay2Server.js

start_m2_local:
	export PATH=$(@D)/:$(PATH); node lib/Macaulay2LocalServer.js
kill:
	kill `ps ax | grep Server | grep -v monitor | grep node | awk '{print $$1}'`

check:
	mocha tests/mocha.js --reporter spec

help:
	@echo "Possible make targets:"
	@echo "  check                  run mocha tests"
	@echo "  start_singular         start Singular server with secure containers forever"
	@echo "  start_singular_local   start local Singular server forever"
	@echo "  start_m2               start Macaulay2 server with secure containers forever"
	@echo "  start_m2_local         start local Macaulay2 server forever"
	@echo "  kill                   kill MathProgramServer (with secure containers or local), but not forever script"
