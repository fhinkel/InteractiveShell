<?php
session_start();
$id = session_id();
header("Content-Type: text/event-stream");


$myFile = "sockets/results_".$id.".txt";
//echo $myFile;
//echo "\n";

if( file_exists($myFile)) {
	$fp = fopen( $myFile, 'r+');
	if (flock($fp, LOCK_EX)) { // do an exclusive lock
	 	$content = (file_get_contents($myFile));
    ftruncate($fp, 0); // truncate file
    flock($fp, LOCK_UN); // release the lock	
		$content = str_replace(array("\r\n"), "\ndata: ", $content);
//		$content = str_replace(array("\r", "\r\n", "\n"), "data: ..", $content);
  	echo "data: " . $content . "\n\n";
	}	else {
		echo "data: Cannot get exclusive look\n\n";
	}
} else {
  echo "";
}
?>

