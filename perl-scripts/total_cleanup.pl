$users = `getent group m2users`;
print $users,"\n";
system("schroot -e -f --all-sessions");
system("rm /usr/local/etc/schroot/chroot.d/user*");
@users = split(":",$users);
$n = @users;
print "\nRemoving ",$n," users.\n";
$users = @users[@users-1];
@users = split(",",$users);
foreach my $u (@users){
   print $u,"\n";
   system("userdel $u");
   system("cgdelete memory,cpu:$u");
}

