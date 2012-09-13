#!/usr/bin/perl

my $limit = 0;
my $max_idle_min = 30;

print "Cleaning. Time: ";
print localtime(time)."\n";


my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime(time);

my @schroots;
open FH, "ls -al /home/m2user/sessions |" or die "Failed to open pipe.";
while(<FH>){
	my $current = $_;
	if($current =~ m/.* user.*/){
		#print "Keeping: ".$current;
		push @schroots, $current;
	}
	else {
		#print "Dropping: ".$current;
	}
}
close FH;

my $num_schroots = @schroots;
print "There are ".$num_schroots." schroots running.\n";
if($num_schroots>$limit){
	foreach my $s (@schroots){
		my @split = split(' ',$s);
		my $schrootid = $split[8];
		my($lm_h,$lm_m) = ($split[7] =~ m/(.*):(.*)/);
		#print "Minutes: ".$lm_m."\n";
		my $idle_min = $min>=$lm_m ? ($min-$lm_m) : (60+$min-$lm_m);
		if($idle_min > $max_idle_time){
			print "Unmounting schroot ".$schrootid."\n";
			system("rm /home/m2user/sessions/$schrootid");
			# system("schroot -e -f -c $schrootid");
		}
	}
}

open FH, "ps aux | grep /M2/bin/M2 |" or die "Failed to open pipe.";
my $i=0;
while(<FH>){
   my $current = $_;
   my @split = split(' ',$current);
   my $virt = $split[4];
   my $pid = $split[1];
   print $i.": ".$virt." ".$current; $i++;
   if($virt > 500000){
      print "Using too much RAM.\n";
      #system("kill -9 $pid");
   }
}

