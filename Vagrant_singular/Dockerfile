# sshd
#
# VERSION               0.0.2

FROM ubuntu:14.04
MAINTAINER InteractiveShell Team <trym2@googlegroups.com>

# For ssh server and up-to-date ubuntu.
RUN apt-get update && apt-get install -y openssh-server wget;\
   apt-get upgrade -y

RUN mkdir /build

# Prerequisites
#
# polymake
RUN apt-get install -y g++ libboost-dev libgmp-dev libgmpxx4ldbl libmpfr-dev libperl-dev libsvn-perl libterm-readline-gnu-perl libxml-libxml-perl libxml-libxslt-perl libxml-perl libxml-writer-perl libxml2-dev w3c-dtd-xhtml xsltproc clang bliss libbliss-dev make
# Singular
RUN apt-get update && apt-get install -y git build-essential autoconf autogen libtool libreadline6-dev libglpk-dev libgmp-dev libmpfr-dev libcdd-dev libntl-dev
# normaliz
RUN apt-get install -y zip


# Installing 4ti2
WORKDIR /build
ENV FOURTITWO_VERSION 1.6.6
RUN wget http://www.4ti2.de/version_$FOURTITWO_VERSION/4ti2-$FOURTITWO_VERSION.tar.gz;\
   tar xzf 4ti2-$FOURTITWO_VERSION.tar.gz
WORKDIR /build/4ti2-$FOURTITWO_VERSION
RUN ./configure;\
   make -j3;\
   make install


# Installing normaliz
WORKDIR /build
ENV NORMALIZ_VERSION 2.12.2
ENV NORMALIZ_VERSION_SHORT 2.12
RUN wget http://www.home.uni-osnabrueck.de/wbruns/normaliz/Normaliz${NORMALIZ_VERSION}/Normaliz${NORMALIZ_VERSION}.zip;\
   unzip Normaliz${NORMALIZ_VERSION}.zip
WORKDIR /build/Normaliz${NORMALIZ_VERSION_SHORT}/source
RUN make -j3;\
   cp /build/Normaliz${NORMALIZ_VERSION_SHORT}/source/normaliz /usr/local/bin



# Installing polymake
WORKDIR /build
ENV POLYMAKE_VERSION 2.14
RUN wget http://www.polymake.org/lib/exe/fetch.php/download/polymake-$POLYMAKE_VERSION.tar.bz2;\
   tar jxf polymake-$POLYMAKE_VERSION.tar.bz2
WORKDIR /build/polymake-$POLYMAKE_VERSION
RUN ./configure CC=clang CXX=clang++ --without-java --without-javaview;\
   make -j2;\
   make install



# Installing Singular
WORKDIR /build
ENV LD_LIBRARY_PATH $LIBRARY_PATH:/usr/local/lib
RUN git clone https://github.com/Singular/Sources.git singular_sources
WORKDIR /build/singular_sources
RUN ./autogen.sh;\
    ./configure CXXFLAGS=-fopenmp --enable-gfanlib --enable-polymake;\
    make -j7;\
    make install;\
    Singular -v


# Userland
WORKDIR /
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


WORKDIR /home/singularUser
# USER singularUser
EXPOSE 22
# CMD ["/usr/sbin/sshd", "-D"]
