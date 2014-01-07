$users = `getent group m2users`;
print $users,"\n";
@users = split(":",$users);
$n = @users;
print "\nRemoving ",$n," users.\n";
system("schroot -e -f --all-sessions");
system("rm /usr/local/etc/schroot/chroot.d/system*");
system("rm -rf /usr/local/etc/schroot/system*");
system("rm /usr/local/etc/schroot/chroot.d/user*");
$users = @users[@users-1];
@users = split(",",$users);
foreach my $u (@users){
   print $u,"\n";
   system("userdel $u");
   system("cgdelete memory,cpu:$u");
}

