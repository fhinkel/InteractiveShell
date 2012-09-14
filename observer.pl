use threads;

# Some global variables:
$desc_limit = 30;
$max_idle_time = 61;
$user_limit = 4;
$mem_limit = 500000000000000000;

@observed_schroots = ();
$observed_schroots_num = 0;

sub observer {
   my($schroot) = @_;
   my $pid = get_pid($schroot);
   if($pid == 0){
      return;
   }
   my $process_sane = true;
   my $reason;
   while($process_sane){
      # Fork bomb?
      $process_sane &= get_descendants($pid)>$desc_limit ? false:true;
      $reason .= get_descendants($pid)>$desc_limit ? "ForkBomb":""; 
      # Eating away memory?
      $process_sane &= get_memory($pid)>$mem_limit ? false:true;
      $reason &= get_memory($pid)>$mem_limit ? "Memory":"";
      # Sleeping?
      $process_sane &= get_idle($schroot)>$max_idle_time ? false:true;
      $reason &= get_idle($schroot)>$max_idle_time ? "Idle":"";
   }
   print "$schroot: Unmounting schroot. Reason: $reason.\n";
   @observed_schroots = grep($_ !~ m/$schroot/, @observed_schroots);
   $observed_schroots_num--;
   system("rm /home/m2user/sessions/$schroot.kill");
   system("rm /home/m2user/sessions/$schroot");
   system("schroot -e -c $schroot");
   sleep 1;
}

# Get the PID of schroot:
sub get_pid {
   my($schroot) = @_;
   open FH, "ps aux | grep schroot|" or die "Unable to determine PID.";
   while(<FH>){
      if($_ =~ m/.*-c $schroot -u/){
         my @split = split(' ',$_);
         #print "$schroot: PID is ".$split[1]."\n";
         return $split[1];
      }
   }
   return 0;
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
         #print "$schroot: Idle time: $result\n";
         return $result;
      }
   }
   close FH;
   return 0;
}

# Get memory usage for PID.
sub get_memory_pid {
   my($pid) = @_;
   open FH, "ps aux | grep $pid |" or die "Failed to open pipe.";
   my $result=0;
   while(<FH>){
      my $current = $_;
      my @split = split(' ',$current);
      if($split[1] == $pid){
         $result += $split[4];
      }
   }
   #print "$pid is using ".$result."K memory.\n";
   return $result;
}

# Get the memory of the process and all children of it.
sub get_memory {
   my($pid) = @_;
   open FH, "pstree -pc $pid|" or die "Unable to get pids of descendants";
   my $result = 0;
   while(<FH>){
      my @pids = $_ =~m/\(([^()]*)\)/g;
      foreach my $p (@pids){
         $result += get_memory_pid($p);
      }
   }
   #print "$pid: is using ".$result."K memory.\n"; 
   return $result;
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
   #print "$pid: $numdesc descendants.\n";
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
         # print $_."\n";
         my $id = grep($_ =~ m/$_/, @observed_schroots);
         if($id == 0){
            my @split = split(' ',$_);
            push @new_schroots, $split[0];
         }
      }
   }
   close FH;

   # Enter new schroots into the observed schroots:
   foreach my $s (@new_schroots){
      threads->create('observer',$s);
      #sleep 10;
      print "$s: Starting observation.\n";
      $observed_schroots_num++;
      push @observed_schroots, $s;
   }
   #print "There are $observed_schroots_num active schroots.\n";
   
   # If there are to many users:
   if(@observed_schroots_num>$user_limit){
      $max_idle_time--;
      print "Limit reached. Lowering time. Time limit is now ".$max_idle.time.".\n";
   } else {
      $max_idle_time = 61;
   }
   sleep 1;
}
