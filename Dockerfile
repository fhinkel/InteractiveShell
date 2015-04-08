# sshd
#
# VERSION               0.0.2

FROM ubuntu:14.04
MAINTAINER Sven Dowideit <SvenDowideit@docker.com>

RUN apt-get update && apt-get install -y openssh-server wget
RUN apt-get upgrade -y

# Installing M2
RUN echo "deb http://www.math.uiuc.edu/Macaulay2/Repositories/Ubuntu trusty main" >> /etc/apt/sources.list
RUN wget http://www.math.uiuc.edu/Macaulay2/PublicKeys/Macaulay2-key
RUN apt-key add Macaulay2-key
RUN apt-get update && apt-get install -y macaulay2

# M2 userland
RUN useradd -m -d /home/m2user m2user
RUN mkdir /home/m2user/.ssh
COPY id_rsa.pub /home/m2user/.ssh/authorized_keys
RUN chown -R m2user:m2user /home/m2user/.ssh
RUN chmod 755 /home/m2user/.ssh
RUN chmod 644 /home/m2user/.ssh/authorized_keys

RUN mkdir /var/run/sshd
# RUN echo 'root:screencast' | chpasswd
RUN sed -i 's/PermitRootLogin without-password/PermitRootLogin no/' /etc/ssh/sshd_config

# SSH login fix. Otherwise user is kicked off after login
RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd

ENV NOTVISIBLE "in users profile"
RUN echo "export VISIBLE=now" >> /etc/profile



EXPOSE 22
CMD ["/usr/sbin/sshd", "-D"]
