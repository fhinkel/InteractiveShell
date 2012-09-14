use threads;

# Some global variables:
$desc_limit = 30;
$max_idle_time = 61;
$user_limit = 5;

@observed_schroots = ();
$observed_schroots_num = 0;

sub observer {
   my($schroot) = @_;
   my $pid = 0;
   my $process_sane = true;
   while($process_sane){
      # Fork bomb?
      $process_sane &= get_descendants($pid)>$desc_limit ? false:true;
      $process_sane &= get_memory($pid)>$mem_limit ? false:true;
      $process_sane &= get_idle($schroot)>$max_idle_time ? false:true;
   }
   print "Unmounting schroot ".$schroot."\n";
   @observed_schroots = grep($_ !~ m/$schroot/, @observed_schroots);
   $observed_schroots_num--;
   sleep 1;
}

# Get the idle time of the schroot.
sub get_idle {
   my($schroot) = @_;
   open FH, "ls -al /home/m2user/sessions | grep $schroot |" or die "Unable to find schroot file.";
   while(<FH>){
      if($_ !~ m/.*kill.*/){
         my @split = split(' ', $_);
         my($idle_min) = ($split[7] =~ m/.*:(.*)/);
         my $result = $min>=$idle_min ? ($min-$idle_min):(60+$min-$idle_min);
         return $result;
      }
   }
   close FH;
   return 0;
}

# Get the memory of the process and all children of it.
sub get_memory {
   my($pid) = @_;
   return 0;
}

# Get the number of descendants of a process.
sub get_descendants {
   my($pid) = @_;
   open FH, "pstree $pid | wc -l |" or die "Error counting descendants.";
   my $numdesc = 0;
   while(<FH>){
      my @split = split(' ',$_);
      $numdesc = $split[0];
   }
   close FH;
   return $numdesc;
}

while(true){
   # Refresh the time:
   ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime(time);
   
   # Find out if new schroots have been started:
   my @new_schroots = ();
   open FH, "ls /home/m2user/sessions | grep user |" or die "Failed to get sessions."; 
   while(<FH>){
      if($_ !~ m/.*kill.*/){
         print $_."\n";
         my $id = grep($_ =~ m/$_/, @observed_schroots);
         if($id == 0){
            push @new_schroots, $_;
         }
      }
   }
   close FH;

   # Enter new schroots into the observed schroots:
   foreach my $s (@new_schroots){
      thread->create('observe',$s);
      $observed_schroots_num++;
      push @observed_schroots, $s;
   }

   # If there are to many users:
   if(@observed_schroots_num>$user_limit){
      print "Limit reached. Lowering time.\n";
      $max_idle_time--;
   } else {
      $max_idle_time = 61;
   }
   sleep 1;
}
