VERSION=1.10-0

all:
	docker build -t mikestillman/test-macaulay2-$(VERSION) .

withssh: 
	rm -f id_rsa*
	ssh-keygen -b 1024 -f id_rsa -P ''
	docker build -t "ssh-macaulay2-$(VERSION) -f ../Dockerfile .

run:
	docker run -i -t -u m2user -w /home/m2user -v /Users/mike/:/home/m2user/files:ro \
        mikestillman/test-macaulay2-$(VERSION) M2

run-bash:
	docker run -i -t -u m2user -w /home/m2user -v /Users/mike/:/home/m2user/files:ro \
        mikestillman/test-macaulay2-$(VERSION) bash

login:
	docker login --username=mikestillman

push:
	docker push mikestillman/test-macaulay2-$(VERSION)

