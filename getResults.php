<?php
session_start();
$id = session_id();
header("Content-Type: text/event-stream");

//$offset = $_POST['offset'];
//echo "The offset is ". $offset . "\n";
$myFile = "sockets/results_".$id.".txt";
if( file_exists($myFile)) {
  $filesize = filesize($myFile);
  //echo "Filesize: ". $filesize . "\n";
  $content = (file_get_contents($myFile));
	$content = str_replace("\n", "\n\ndata: ", $content);
  echo "data: " . $content . "\n\n";
} else {
  echo "";
}
?>

