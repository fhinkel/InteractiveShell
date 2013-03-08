#!/usr/bin/perl
#create_user.pl


$user = $ARGV[0];
$memory = system("ps -u $user -o vsz | awk '{s+=\$1} END {print s}'");
print $memory,"\n";
# print $user;

# TODO:
# Check number of processes
# Check memory usage

# return 0 if it is good

