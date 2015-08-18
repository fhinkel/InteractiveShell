# sshd
#
# VERSION               0.0.2

FROM ubuntu:14.04
MAINTAINER InteractiveShell Team <trym2@googlegroups.com>

# For ssh server and up-to-date ubuntu.
RUN apt-get update && apt-get install -y openssh-server wget git build-essential autoconf autogen libtool libreadline6-dev libglpk-dev libgmp-dev libmpfr-dev libcdd-dev libntl-dev
RUN apt-get upgrade -y

# Installing Singular
RUN git clone https://github.com/Singular/Sources.git;\
    cd Sources;\
    ./autogen.sh;\
    ./configure --enable-gfanlib --enable-polymake;\
    make -j7;\
    make install;\
    Singular -v

RUN mkdir /var/run/sshd
# RUN echo 'root:screencast' | chpasswd
RUN sed -i 's/PermitRootLogin without-password/PermitRootLogin no/' /etc/ssh/sshd_config

# SSH login fix. Otherwise user is kicked off after login
RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd

ENV NOTVISIBLE "in users profile"
RUN echo "export VISIBLE=now" >> /etc/profile

# copy open
# COPY open /usr/bin/open
# RUN ln -s /usr/bin/open /usr/bin/display


EXPOSE 22
# CMD ["/usr/sbin/sshd", "-D"]
