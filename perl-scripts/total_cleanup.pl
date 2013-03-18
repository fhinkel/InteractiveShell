$users = `getent group m2users`;
print $users,"\n";
@users = split(":",$users);
$users = @users[@users-1];
@users = split(",",$users);
foreach my $u (@users){
   print $u,"\n";
   system("perl remove_user.pl $user");
}

