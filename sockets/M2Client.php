<?php
session_start();
error_reporting(E_ALL);

//echo "<h2>TCP/IP Connection</h2>\n";

$service_port = 10000;
$address = 'localhost';

/* Create a TCP/IP socket. */
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
socket_connect($socket, $address, $service_port);
$id = session_id();

$cmd = $_POST['cmd'];
// Sending id to socket server for connecting to correct M2 process.
socket_write($socket, $id."\n");

// The reg ex should check for exit on it's own line or after a semicolon
// nicely quit M2 if the user requests an exit
if(strpos($cmd."\n","exit\n")!==false){
	echo "Exit requested.";
	$cmd = ">>RESET<<";
}

socket_write($socket, $cmd."\n");
socket_close($socket);

echo "0";
?>
