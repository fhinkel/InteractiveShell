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
$schroot_type = $ARGV[1];

$memlimit  =$ARGV[2];
$cpulimit  =$ARGV[3];
#print $memlimit;
#print "We are starting a new user: ";
#print $user;

$ex = `id $user`;
if($ex ne ""){
	print "Users exists.\n";
	system "rm /usr/local/var/lib/schroot/mount/$user/home/m2user/*";
	exit;
}
print "Creating new user.\n";

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
open (CONFIG, ">/usr/local/etc/schroot/chroot.d/$schroot_type.conf");
print CONFIG "[$schroot_type]\n";
print CONFIG "description=Ubuntu precise pangolin clone chroot\n";
print CONFIG "directory=/fakeroot/clone\n";
print CONFIG "root-users=\n";
print CONFIG "type=directory\n";
print CONFIG "users=$user\n";
print CONFIG "profile=clone\n";
close (CONFIG); 



################################
##  Cgroup stuff
################################

# Creating a cgroup for the user:
system "cgcreate -a root -g cpu,memory:$user";
# Root should own these files so that the user cannot modify them:
# system "chown -R root:root /sys/fs/cgroup/memory/$user/";
# Setting memory limit to 500M:
$memsw = $memlimit * 1.1;
system "echo $memlimit > /sys/fs/cgroup/memory/$user/memory.limit_in_bytes";
system "echo $memsw > /sys/fs/cgroup/memory/$user/memory.memsw.limit_in_bytes";
system "echo $cpulimit > /sys/fs/cgroup/cpu/$user/cpu.shares";
