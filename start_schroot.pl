# Rough structure:
# 1. Create a user? We are su, so maybe we don't need this.
# 2. Create the schroot definition allowing this user to begin a schroot.
#    This user shouldn't have ssh access or any access whatsoever.
# 3. Begin the schroot.
# 4. Now the server can run this schroot as the specified user.
# 5. Load limits from file.
# 6. This script will then continue to run as observer.


# For threads.
use threads;
# For global variables.
use threads::shared;

# Some global variables:
my $desc_limit : shared;
my $max_idle_time : shared;
my $user_limit : shared;
my $mem_limit : shared;
my @observed_schroots : shared;
my $observed_schroots_num : shared;

$desc_limit = 30;
$max_idle_time = 61;
$user_limit = 5;
$mem_limit = 500000000000000000;
$observed_schroots_num = 0;

# Method for observing a single schroot.
sub observer {
   my($schroot) = @_;
   my $pid = get_pid($schroot);
   # If there is no schroot process, we assume the schroot is gone.
   if($pid == 0){
      print "$schroot: Unmounting schroot. Reason: Already killed.\n";
      @observed_schroots = grep($_ !~ m/$schroot/, @observed_schroots);
      $observed_schroots_num--;
      print $observed_schroots_num."\n";
      # Should we be doing the stuff below?
      if(get_idle($schroot)>$max_idle_time){
         system("touch /home/m2user/sessions/$schroot.kill");
         system("rm /home/m2user/sessions/$schroot");
         system("schroot -e -f -c $schroot");
      }
      return;
   }
   my $process_sane = true;
   my $reason;
   while($process_sane){
      # Fork bomb?
      $process_sane &= !(get_descendants($pid)>$desc_limit);
      $reason .= get_descendants($pid)>$desc_limit ? "ForkBomb":""; 
      # Eating away memory?
      $process_sane &= !(get_memory($pid)>$mem_limit);
      $reason .= get_memory($pid)>$mem_limit ? "Memory":"";
      # Sleeping?
      $process_sane &= !(get_idle($schroot)>$max_idle_time);
      $reason .= get_idle($schroot)>$max_idle_time ? "Idle":"";
      sleep 1;
   }
   print "$schroot: Unmounting schroot. Reason: $reason.\n";
   @observed_schroots = grep($_ !~ m/$schroot/, @observed_schroots);
   $observed_schroots_num--;
   system("touch /home/m2user/sessions/$schroot.kill");
   system("rm /home/m2user/sessions/$schroot");
   system("schroot -e -f -c $schroot");
}

# Get the PID of schroot:
sub get_pid {
   my($schroot) = @_;
   my $result = 0;
   open FH, "ps aux | grep schroot|" or die "Unable to determine PID.";
   while(<FH>){
      if($_ =~ m/.*-c $schroot -u/){
         my @split = split(' ',$_);
         #print "$schroot: PID is ".$split[1]."\n";
         $result = $split[1];
      }
   }
   close FH;
   return $result;
}

# Get the idle time of the schroot.
sub get_idle {
   my($schroot) = @_;
   my $result = 0;
   open FH, "ls -al /home/m2user/sessions | grep $schroot |" or die "Unable to find schroot file.";
   while(<FH>){
      if($_ !~ m/.*kill.*/){
         my @split = split(' ', $_);
         my($idle_min) = ($split[7] =~ m/.*:(.*)/);
         $result = $min>=$idle_min ? ($min-$idle_min):(60+$min-$idle_min);
      }
   }
   close FH;
   print "$schroot: Idle time: $result\n";
   return $result;
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
   close FH;
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
   close FH;
   print "$pid: is using ".$result."K total memory.\n"; 
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
   print "$pid: $numdesc descendants.\n";
   return $numdesc;
}

