#!/usr/bin/perl

## Mike
## Greg
## Franziska Hinkelmann
## August 2010


use CGI qw( :standard );

print header, start_html( -title=>'TryM2');
print start_multipart_form(-name=>'form1', -method =>"POST", -onSubmit=>"return validate()");

print "Enter M2 command";
print textfield(-name=>'command', -size=>'10', -maxlength=>2, -default=>'version');

print "<center>", submit('button_name','Submit'),"</center><br><br>";

print end_form;

$command = param('command');

if ($button_name eq "Submit") {
  print `ruby runner.rb $command`;
}


