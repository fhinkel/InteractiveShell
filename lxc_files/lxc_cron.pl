use Sys::Virt;
use XML::XPath;
use XML::XPath::XMLParser;

$cpus = 1;
$ram = 512;
$zfs_original = "zfs_jails\/gentoo_master\@singular";
$zfs_prefix = "zfs_jails\/linux_containers\/";
$new_containers_file = "\/home\/admin\/trySingular\/lib\/new_containers";
$old_containers_file = "\/home\/admin\/trySingular\/lib\/old_containers";
$dead_lxc_path = "\/home\/admin\/trySingular\/dead_lxcs\/";
$sample_xml_file = "\/home\/admin\/tryM2\/lxc_files\/sample_clone.xml";
$uri = "lxc://";
$virsh_controller = Sys::Virt->new(uri => $uri);


if(need_new_containers()){
   @new_containers = generate_3_new_containers();
}

if(exist_old_containers()){
    delete_old_containers();
}
# destroy_all();


#######################################
#
#  Helper functions
#
#######################################

sub delete_old_containers{
    open my $info, $old_containers_file or die "Could not open $old_containers_file: $!";
    while( my $rawContainer = <$info>)  {   
        print $rawContainer;    

    }
}

sub destroy_all{
   my @domains = $virsh_controller->list_all_domains();
   foreach my $domain (@domains){
      my $name = $domain->get_name();
      print length($name)," ",$name,"\n";
      if(length($name) == 20){
         remove_from_system($domain);
      }
   }
}

sub remove_from_system{
   my($container) = @_;
   my $name = $container->get_name();
   eval{ $container->destroy(); };
   eval{ $container->undefine(); };
   zfs_destroy_snapshot($name);
}

sub generate_3_new_containers{
   my $sample_xml = read_file($sample_xml_file);
   my %mac_addresses;
   for(my $i=0; $i<3; $i++){
      my $name = get_random_string(20);
      zfs_clone_snapshot($name);
      my $xml_config = insert_values($sample_xml, $name);
      my $container = $virsh_controller->define_domain($xml_config);
      $container->create();
      my $mac_address = get_mac_address($container);
      my $uuid = $container->get_uuid_string();
      $mac_addresses{$uuid} = $mac_address;
   }
   save_mac_addresses_to_file(%mac_addresses);
}

sub save_mac_addresses_to_file{
   my(%addresses) = @_;
   open (FILE, ">>".$new_containers_file);
   foreach my $key (keys %addresses){
      print FILE $key." *** ".$addresses{$key}."\n";
   }
   close (FILE);
}

# $vmm->get_domain_by_uuid($uuid)

sub insert_values{
   my($original, $name) = @_;
   $original =~ s/CLONE_NAME/$name/g;
   $original =~ s/CLONE_PATH/$zfs_prefix$name/g;
   $original =~ s/CLONE_SHIFT/100000/g;
   $original =~ s/CLONE_CPUS/$cpus/g;
   $original =~ s/CLONE_RAM/$ram/g;
   return $original;
}


sub read_file{
   my($filename) = @_;
   open(FILE, $filename) or die "Can't read file '$filename' [$!]\n";
   local $/;
   my $content = <FILE>;
   close (FILE);
   return $content;
}


sub need_new_containers{
   return !(-e $new_containers_file);
}

sub exist_old_containers{
   return !(-e $old_containers_file);
}

sub get_random_string{
   my($length) = @_;
   my @chars = ("A".."Z", "a".."z");
   my $string;
   $string .= $chars[rand @chars] for 1..$length;
   return $string;
}


sub get_mac_address{
   my($guest) = @_;
   my $xml_with_mac_address = $guest->get_xml_description ();
   # print $xml_with_mac_address,"\n";
   my $xp = XML::XPath->new (xml => $xml_with_mac_address);
   my $nodes = $xp->find ("//devices/interface[\@type='network']/mac/\@address");
   my @mac_addresses;
   foreach my $node ($nodes->get_nodelist) {
      push @mac_addresses, lc ($node->getData)
   }
   return $mac_addresses[0];
}


sub zfs_clone_snapshot{
   my($name) = @_;
   system "zfs clone ".$zfs_original." ".$zfs_prefix.$name;
}

sub zfs_destroy_snapshot{
   my($name) = @_;
   system "zfs destroy ".$zfs_prefix.$name;
}


#ZFS_PREFIX
#CLONE_NAME
#CLONE_PATH
#CLONE_RAM
#CLONE_SHIFT
#CLONE_CPUS
