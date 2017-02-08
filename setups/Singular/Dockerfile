# sshd
#
# VERSION               0.0.2

FROM ubuntu:16.04
MAINTAINER InteractiveShell Team <trym2@googlegroups.com>

# For ssh server and up-to-date ubuntu.
RUN apt-get update && apt-get install -y openssh-server wget;\
   apt-get upgrade -y

RUN mkdir /build

# Prerequisites
#
# polymake
RUN apt-get install -y g++ libboost-dev libgmp-dev libgmpxx4ldbl libmpfr-dev libperl-dev libsvn-perl libterm-readline-gnu-perl libxml-libxml-perl libxml-libxslt-perl libxml-perl libxml-writer-perl libxml2-dev xsltproc clang bliss libbliss-dev make
# Singular
RUN apt-get update && apt-get install -y git build-essential autoconf autogen libtool libreadline6-dev libglpk-dev libgmp-dev libmpfr-dev libcdd-dev libntl-dev
# normaliz
RUN apt-get install -y zip


# Installing 4ti2
WORKDIR /build
ENV FOURTITWO_VERSION 1.6.7
RUN wget http://www.4ti2.de/version_$FOURTITWO_VERSION/4ti2-$FOURTITWO_VERSION.tar.gz;\
   tar xzf 4ti2-$FOURTITWO_VERSION.tar.gz
WORKDIR /build/4ti2-$FOURTITWO_VERSION
RUN ./configure;\
   make -j3;\
   make install


# Installing normaliz
WORKDIR /build
ENV NORMALIZ_VERSION 3.2.0
RUN wget https://www.normaliz.uni-osnabrueck.de/wp-content/uploads/2017/01/normaliz-${NORMALIZ_VERSION}source.zip;\
   unzip normaliz-${NORMALIZ_VERSION}source.zip
WORKDIR /build/normaliz-${NORMALIZ_VERSION}/
RUN ./configure;\ 
   make -j3;\
   make install



# Installing polymake
WORKDIR /build
ENV POLYMAKE_VERSION 3.0
ENV POLYMAKE_REVISION r2
RUN wget http://www.polymake.org/lib/exe/fetch.php/download/polymake-${POLYMAKE_VERSION}${POLYMAKE_REVISION}.tar.bz2;\
   tar jxf polymake-${POLYMAKE_VERSION}${POLYMAKE_REVISION}.tar.bz2
WORKDIR /build/polymake-$POLYMAKE_VERSION
RUN ./configure CC=clang CXX=clang++ --without-java --without-javaview --without-atint;\
   make -j2;\
   make install



# Installing Singular
WORKDIR /build
ENV LD_LIBRARY_PATH $LIBRARY_PATH:/usr/local/lib
RUN git clone https://github.com/Singular/Sources.git singular_sources
WORKDIR /build/singular_sources
RUN ./autogen.sh;\
#    ./configure CXXFLAGS=-fopenmp --enable-gfanlib --enable-polymake;\
    ./configure CXXFLAGS=-fopenmp --enable-gfanlib;\
    make -j7;\
    make install
#    Singular -v

RUN echo "interactive-shell!xE:echo:!echo \">>SPECIAL_EVENT_START>>\"%H\"<<SPECIAL_EVENT_END<<\"" >> /usr/local/share/singular/LIB/help.cnf
COPY surf.lib /usr/local/share/singular/LIB/surf.lib
RUN apt-get install -y surf-alggeo



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
