use Sys::Virt;
use XML::XPath;
use XML::XPath::XMLParser;

$cpus = 1;
$number = 1;
$ram = 512;
$zfs_original = "zfs_jails/gentoo_master\@singular";
$zfs_prefix = "zfs_jails\/";
$uri = "lxc://";
$virsh_controller = Sys::Virt->new(uri => $uri);

generate_clones();



sub generate_clones{
   for(my $i=100; $i<=$number+100; $i++){
      zfs_clone_snapshot($i);
      generate_xml_file($i);
      my $xml_content = read_xml_file($i);
      my $new_clone = $virsh_controller->define_domain($xml_content);
      $new_clone->create();
      my $mac_address = get_mac_address_from_xml($new_clone);
      print $mac_address,"\n";
   }
}

sub get_mac_address_from_xml{
   my($guest) = @_;
   my $xml_with_mac_address = $guest->get_xml_description ();
   print $xml_with_mac_address,"\n";
   my $xp = XML::XPath->new (xml => $xml_with_mac_address);
   my $nodes = $xp->find ("//devices/interface[\@type='network']/mac/\@address");
   my @mac_addresses;
   foreach my $node ($nodes->get_nodelist) {
      push @mac_addresses, lc ($node->getData)
   }
   return $mac_addresses[0];
}

sub read_xml_file{
   my($i) = @_;
   open(FILE, "clone$i.xml") or die "Can't read file 'clone$i.xml' [$!]\n";
   local $/;
   my $document = <FILE>;
   close (FILE);
   return $document;
}

sub dumpToConfig{
   my($i) = @_;

}

sub zfs_clone_snapshot{
   my($i) = @_;
   system "zfs clone ".$zfs_original." ".$zfs_prefix."clone".$i;
}

sub generate_xml_file{
   my($i) = @_;
   my $filename = "clone".$i.".xml";
   copy_original_xml_file("sample_clone.xml", $filename);
   insert_value_in_xml_file("CLONE_NAME", "clone$i", $filename);
   insert_value_in_xml_file("CLONE_PATH", $prefix."clone".$i, $filename);
   insert_value_in_xml_file("CLONE_SHIFT", "100000", $filename);
   insert_value_in_xml_file("CLONE_CPUS", "1", $filename);
   insert_value_in_xml_file("CLONE_RAM", "512", $filename);
}

sub copy_original_xml_file{
   my($original_xml, $copy_name) = @_;
   system "cp $original_xml $copy_name";
}

sub insert_value_in_xml_file{
   my($value, $replacement, $file) = @_;
   system "sed -i \'s\/$value\/$replacement\/g\' $file";
}

#ZFS_PREFIX
#CLONE_NAME
#CLONE_PATH
#CLONE_RAM
#CLONE_SHIFT
#CLONE_CPUS
