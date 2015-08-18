# sshd
#
# VERSION               0.0.2

FROM ubuntu:14.04
MAINTAINER InteractiveShell Team <trym2@googlegroups.com>

# For ssh server and up-to-date ubuntu.
RUN apt-get update && apt-get install -y openssh-server wget 
RUN apt-get upgrade -y

# Installing Singular
RUN wget ftp://jim.mathematik.uni-kl.de/repo/extra/gpg;\
   apt-key add gpg;\
   echo "deb ftp://jim.mathematik.uni-kl.de/repo/ubuntu14 trusty main" >> /etc/apt/sources.list;\
   apt-get update;\
   apt-get install -y singular

# Singular userland
RUN useradd -m -d /home/singularUser singularUser
RUN mkdir /home/singularUser/.ssh
COPY id_rsa.pub /home/singularUser/.ssh/authorized_keys
RUN chown -R singularUser:singularUser /home/singularUser/.ssh
RUN chmod 755 /home/singularUser/.ssh
RUN chmod 644 /home/singularUser/.ssh/authorized_keys



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
