#!/usr/bin/perl
#create_user.pl

# 1. End the schroot
# 2. Delete the user

$user = $ARGV[0];
$schroot_name = $ARGV[1];
$schroot_type = $ARGV[2];
# print $user;

# Remove the user:
system "killall -u $user";
system "schroot -e -f -c $schroot_name";
system "rm /usr/local/etc/schroot/chroot.d/$schroot_type.conf";
system "userdel $user";
system "cgdelete cpu,memory:$user";
