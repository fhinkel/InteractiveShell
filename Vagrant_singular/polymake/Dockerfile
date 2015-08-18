# sshd
#
# VERSION               0.0.2

FROM ubuntu:14.04
MAINTAINER InteractiveShell Team <trym2@googlegroups.com>

# For ssh server and up-to-date ubuntu.
RUN apt-get update && apt-get install -y openssh-server wget g++ libboost-dev libgmp-dev libgmpxx4ldbl libmpfr-dev libperl-dev libsvn-perl libterm-readline-gnu-perl libxml-libxml-perl libxml-libxslt-perl libxml-perl libxml-writer-perl libxml2-dev w3c-dtd-xhtml xsltproc clang bliss libbliss-dev;\
   apt-get upgrade -y

RUN apt-get install -y make

RUN wget http://www.polymake.org/lib/exe/fetch.php/download/polymake-2.14.tar.bz2;\
   tar jxf polymake-2.14.tar.bz2;\
   cd polymake-2.14;\
   ./configure CC=clang CXX=clang++ --without-java --without-javaview;\
   make -j2;\
   make install


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

# Installing Singular
# RUN wget ftp://jim.mathematik.uni-kl.de/repo/extra/gpg;\
#    apt-key add gpg;\
#    echo "deb ftp://jim.mathematik.uni-kl.de/repo/ubuntu14 trusty main" >> /etc/apt/sources.list;\
#    apt-get update;\
#    apt-get install -y singular

# Singular userland
# RUN useradd -m -d /home/singularUser singularUser
# RUN mkdir /home/singularUser/.ssh
# COPY id_rsa.pub /home/singularUser/.ssh/authorized_keys
# RUN chown -R singularUser:singularUser /home/singularUser/.ssh
# RUN chmod 755 /home/singularUser/.ssh
# RUN chmod 644 /home/singularUser/.ssh/authorized_keys



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
