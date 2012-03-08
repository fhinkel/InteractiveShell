<?php

//session_start();
//$id = session_id();


//header("Content-Type: text/event-stream");



$fifoPath = 'testpipe';

if(!file_exists($fifoPath)) {
   echo "data: I am not blocked!\n\n";
}
else {
	//echo "data: File is there\n\n";
    //block and read from the pipe
    $f = fopen($fifoPath,"r");
	//$content = fgets($f);
	//echo "data: " . $content . "\n\n";
	$content = fread($f,100);
	$content = str_replace("\n", "\n\ndata: ", $content);
	echo $content;
}


//$offset = $_GET['offset'];
//echo "data: The offset is ". $offset . "\n\n";
//$myFile = "sockets/results_".$id.".txt";
//if( file_exists($myFile)) {
	//$filesize = filesize($myFile);
	//echo "Filesize: ". $filesize . "\n";
	//$output = (file_get_contents($myFile, NULL, NULL, $offset));
 echo "\n\n";
?>
