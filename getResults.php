<?php
session_start();
$id = session_id();

$offset = $_POST['offset'];
//echo "The offset is ". $offset . "\n";
$myFile = "sockets/results_".$id.".txt";
if( file_exists($myFile)) {
	$filesize = filesize($myFile);
	//echo "Filesize: ". $filesize . "\n";
	$output = (file_get_contents($myFile, NULL, NULL, $offset));
	echo $output;
} else {
	echo "";
}
?>
