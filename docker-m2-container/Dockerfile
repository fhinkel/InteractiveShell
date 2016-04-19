# sshd
#
# VERSION               0.0.3

FROM ubuntu:14.04
MAINTAINER InteractiveShell Team <trym2@googlegroups.com>

# For ssh server and up-to-date ubuntu.
RUN apt-get update && apt-get install -yq openssh-server wget emacs
RUN apt-get upgrade -y

# Installing M2
RUN echo "deb http://www.math.uiuc.edu/Macaulay2/Repositories/Ubuntu trusty main" >> /etc/apt/sources.list
RUN wget http://www.math.uiuc.edu/Macaulay2/PublicKeys/Macaulay2-key
RUN apt-key add Macaulay2-key
RUN apt-get update && apt-get install -y macaulay2

# RUN apt-get install -y polymake    ## too long and big
RUN apt-get install -y graphviz

# M2 userland, part 1.    
RUN useradd -m -d /home/m2user m2user
RUN mkdir /custom
RUN chown -R m2user:m2user /custom
RUN chmod -R 775 /custom

# Bertini and PHCpack
ENV PHC_VERSION 24
RUN (cd /custom; wget http://www.math.uic.edu/~jan/x86_64phcv${PHC_VERSION}p.tar.gz)
RUN (cd /custom; tar zxf x86_64phcv23p.tar.gz; mv phc /usr/bin; rm x86_64phcv${PHC_VERSION}p.tar.gz)
# This is the only way extracting Bertini gives the right permissions.
RUN su m2user -c "/bin/bash;\
   cd /custom;\
   wget https://bertini.nd.edu/BertiniLinux64_v1.5.tar.gz;\ 
   tar xzf BertiniLinux64_v1.5.tar.gz;"
RUN ln -s /custom/BertiniLinux64_v1.5/bin/bertini /usr/bin/

##### M2 userland
RUN mkdir /home/m2user/.ssh
COPY ssh_config /etc/ssh/ssh_config
COPY sshd_config /etc/ssh/sshd_config
RUN chown root:root /etc/ssh/ssh_config
RUN chmod 644 /etc/ssh/ssh_config
RUN chown root:root /etc/ssh/sshd_config
RUN chmod 600 /etc/ssh/sshd_config
RUN chown -R m2user:m2user /home/m2user/.ssh
RUN chmod 700 /home/m2user/.ssh
RUN sed -i 's/m2user:!/m2user:*/' /etc/shadow

# copy open
COPY open /usr/bin/open
RUN ln -s /usr/bin/open /usr/bin/display

### Tweaks to ssh setup ###
    
RUN mkdir /var/run/sshd
RUN sed -i 's/PermitRootLogin without-password/PermitRootLogin no/' /etc/ssh/sshd_config

# SSH login fix. Otherwise user is kicked off after login
RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd

ENV NOTVISIBLE "in users profile"
RUN echo "export VISIBLE=now" >> /etc/profile

        
EXPOSE 22
# CMD ["/usr/sbin/sshd", "-D"]

# the following needs to be done on top of this, in order to be able to log in to this container!    
#COPY id_rsa.pub /home/m2user/.ssh/authorized_keys
#RUN chmod 644 /home/m2user/.ssh/authorized_keys
