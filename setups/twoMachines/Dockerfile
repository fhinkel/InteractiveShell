FROM mikestillman/test-macaulay2-1.8.2-0
MAINTAINER InteractiveShell Team <trym2@googlegroups.com>

COPY docker_key.pub /home/m2user/.ssh/authorized_keys
RUN chmod 644 /home/m2user/.ssh/authorized_keys

# Fix for 4ti2 bug
RUN apt-get install -yq libglpk36
