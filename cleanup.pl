#!/usr/bin/perl

my $limit = 5;
my $max_fork = 10;
my $max_idle_min = 61;

#print "Cleaning. Time: ";
#print localtime(time)."\n";

# Identify and kill fork bombs
# 
# Find the schroots that are open and running.
my @open_schroots;
open FH, "ps aux | grep schroot |" or die "Schroots not found.";
while(<FH>){
	#print $_;
	if(($_ !~ m/.*grep.*/) && ($_ =~ m/.*user.*/)){
		my($user) = ($_ =~ m/.*-c (.*) -u.*/);
		# We only want unique users in our list.
		my $id = grep($_ =~ m/$user/, @open_schroots);
		if($id == 0){
			push @open_schroots, $user;
		}
		#print "User: ".$user."\n";
	}
}
close FH;
#print "Killing fork bombs.\n";
foreach my $s (@open_schroots){
        #print "User: ".$s."\n";
	open FH, "ps aux | grep $s |" or die "Failed to find PID.";
        my $pid = 0;
	# This variable counts the number of 'schroot -r' commands for this user.
        my $resets = 0;
	while(<FH>){
		#print $_;
                if($_ !~ m/.*grep.*/){
                        my @split = split(' ',$_);
                        $pid = $split[1];
			$resets++;
                }
        }
        close FH;
	#print "Got the pid.\n";
        
	# Count the number of descending processes from the schroot.
        open FH, "pstree $pid | wc -l |" or die "Could not count children.";
	my $numdesc = 0;
	while(<FH>){
		my @split = split(' ',$_);
		$numdesc = $split[0];
        }
        close FH;

	# Kill if there have been to many resets or forks.
	if($resets > 4){
		print "PID: $pid SchrootID: $s Resets: $resets\n";
		print "DDOS: Unmounting schroot $s.\n";
		system("touch /home/m2user/sessions/$s.kill");	
		system("rm /home/m2user/sessions/$s");
		system("schroot -e -f -c $s");
	}
	if($numdesc > $max_fork) {
		print "PID: $pid SchrootID: $s Descendants: $numdesc\n";
		print "Fork bomb: Unmounting schroot $s.\n";
		system("touch /home/m2user/sessions/$s.kill");	
		system("kill -9 $pid");
		system("rm /home/m2user/sessions/$s");
		system("schroot -e -f -c $s");
	}
}

open FH, "ps aux | grep /M2/bin/M2 |" or die "Failed to open pipe.";
my $i=0;
while(<FH>){
   my $current = $_;
   my @split = split(' ',$current);
   my $virt = $split[4];
   my $pid = $split[1];
   #print $i.": ".$virt." ".$current; $i++;
   if($virt > 500000){
      print "Using too much RAM.\n";
      system("kill -9 $pid");
   }
}
close FH;

# Clean out old schroots:

my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime(time);
my @schroots;
open FH, "ls -al /home/m2user/sessions |" or die "Failed to open pipe.";
while(<FH>){
	my $current = $_;
	if(($current =~ m/.* user.*/)&&($current !~ m/.*kill.*/)){
		#print "Keeping: ".$current;
		push @schroots, $current;
	}
	else {
		#print "Dropping: ".$current;
	}
}
close FH;
my $num_schroots = @schroots;

if($num_schroots>$limit){
	print "There are ".$num_schroots." schroots running.\n";
	my $tokill = $num_schroots-$limit;
	print "Killing $tokill schroots.\n";
}
while($num_schroots>$limit){
	foreach my $s (@schroots){
		my @split = split(' ',$s);
		my $schrootid = $split[8];
		#print "SchrootID: ".$schrootid."\n";
		my($lm_h,$lm_m) = ($split[7] =~ m/(.*):(.*)/);
		#print "Minutes: ".$lm_m."\n";
		my $idle_min = $min>=$lm_m ? ($min-$lm_m) : (60+$min-$lm_m);
		if($idle_min > $max_idle_min){
			print "Too many schroots: Unmounting schroot ".$schrootid."\n";
			system("rm /home/m2user/sessions/$schrootid");
			system("touch /home/m2user/sessions/$schrootid.kill");
			system("schroot -e -f -c $schrootid");
		} else {
			#print "This schroot stays alive.\n";
		}
	}

	($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime(time);
	@schroots=();
	open FH, "ls -al /home/m2user/sessions |" or die "Failed to open pipe.";
	while(<FH>){
		my $current = $_;
		if(($current =~ m/.* user.*/)&&($current !~ m/.*kill.*/)){
			#print "Keeping: ".$current;
			push @schroots, $current;
		}
		else {
			#print "Dropping: ".$current;
		}
	}
	close FH;
	$num_schroots = @schroots;
	$max_idle_min--;
}
system("chown m2user:m2user /home/m2user/sessions/*.kill");

