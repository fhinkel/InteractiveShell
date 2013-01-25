#!/usr/bin/perl
#create_user.pl

# 1. End the schroot
# 2. Delete the user

$user = $ARGV[0];
# print $user;

# Remove the user:
system "killall -u $user";
system "schroot -e -c $user";
system "rm /etc/schroot/chroot.d/$user.conf";
system "userdel $user";

