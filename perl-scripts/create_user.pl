#!/usr/bin/perl
#create_user.pl

# There are several steps:
# 1. Create the user
# 2. Impose user restrictions
# 3. Create schroot config
# (4. Begin schroot? But this can be done by the server.)
#
# And later:
# 1. End the schroot
# 2. Delete the user

$user = $ARGV[0];

$memlimit  =$ARGV[1];
print $memlimit;
#print "We are starting a new user: ";
#print $user;

# Create the new user:
system "useradd -G m2users $user -d /home/m2user";
# -G: Add user to group
# -d: set home folder

# Restrictions:
# system "memory";
# system "no_of_processes";

################################
##  Schroot config
################################
open (CONFIG, ">>/etc/schroot/chroot.d/$user.conf");
print CONFIG "[$user]\n";
print CONFIG "description=Ubuntu precise pangolin clone chroot\n";
print CONFIG "directory=/fakeroots/clone\n";
print CONFIG "root-users=\n";
print CONFIG "type=directory\n";
print CONFIG "users=$user\n";
print CONFIG "script-config=clone/config\n";
close (CONFIG); 



################################
##  Cgroup stuff
################################

# Creating a cgroup for the user:
system "cgcreate -a $user -g memory:$user";
# Root should own these files so that the user cannot modify them:
system "chown -R root:root /sys/fs/cgroup/memory/$user/";
# Setting memory limit to 500M:
system "echo 500000000 > /sys/fs/cgroup/memory/$user/memory.limit_in_bytes";
