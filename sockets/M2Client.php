<?php

session_start();

error_reporting(E_ALL);

echo "<h2>TCP/IP Connection</h2>\n";

$service_port = 10000;
$address = 'localhost';

/* Create a TCP/IP socket. */
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
socket_connect($socket, $address, $service_port);
$id = session_id();

$cmd = $_POST['cmd'];
echo $cmd;

// To save the commands so far one can use a line like
// $_SESSION['cmds']=$_SESSION['cmds'].$cmd." ";

echo "<br> Id: ".$id."<br><br>\n";

// Sending id to socket server for connecting to correct M2 process.
socket_write($socket, $id."\n", strlen($id."\n"));
echo "wrote id\n";

socket_write($socket, $cmd."\n", strlen($cmd."\n"));
// Sending id second time for indicating end of input.
socket_write($socket, $id."\n", strlen($id."\n"));
socket_close($socket);
while(!file_exists("results_".$id.".txt")){sleep(1);}
//echo "file exists";

// Checking if Macaulay is done. If everything went well, the
// last line of the output usually looks like "i** :", so
// we cut of the trailing spaces and check whether the last
// character is ":".
$output = strrev(trim(file_get_contents("results_".$id.".txt")));
//echo $output;
while($output[0] != ":"){
	sleep(1);
	$output = strrev(trim(file_get_contents("results_".$id.".txt")));
}

// Reformat output for html use.
$output = str_replace("\n", "<br>\n", file_get_contents("results_".$id.".txt"));
echo $output."<br>\n";
?>