<?php

session_start();
error_reporting(E_ALL);
$id = session_id();
if(!isset($_SESSION['response'])){
	$_SESSION['response'] = $id;
}
echo "<h2>TCP/IP Connection</h2>\n";
$cmd = isset($_GET['msg']) ? $_GET['msg'] : '';
if($cmd == ''){
	sleep(1);
	$filename = "results_".$id.".txt";
	if(!file_exists($filename)){
		$response = array();
		$response['msg']       = $_SESSION['response'];
		$response['timestamp'] = 3;
		echo json_encode($response);
		flush();
		die();
	}
	$_SESSION['response'] = file_get_contents($filename);
	$response = array();
	$response['msg'] = $_SESSION['response'];
	$response['timestamp'] = 3;
	echo json_encode($response);
	flush();
	die();
}

$service_port = 10000;
$address = 'localhost';

/* Create a TCP/IP socket. */
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
socket_connect($socket, $address, $service_port);

// Sending id to socket server for connecting to correct M2 process.
socket_write($socket, $id."\n");

if(strpos($cmd."\n","exit\n")!==false){
	//echo "Exit requested.";
	$cmd = ">>RESET<<";
}

if( $cmd == ">>RESET<<"){
	//echo ">>RESET<<";
	$_SESSION['response'] = $id.">>RESET<<";
	unset($_SESSION['cmds']);
	socket_write($socket, $cmd."\n");
	socket_close($socket);
	return;
}

echo " Id: ".$id."\n";

socket_write($socket, ">>SENDCOMMANDS<<\n");

// Saving commands so far.
if(isset($_SESSION['cmds'])){
	if(!file_exists("results_".$id.".txt")){
		// If the results file does not exist, but there have been
		// commands, then the M2 pipe has
		// certainly been killed. In this case it could be necessary
		// to resend all commands given so far.
		//echo "Resending all commands.";
		socket_write($socket, $_SESSION['cmds']);
	}
	$_SESSION['cmds']=$_SESSION['cmds'].$cmd."\n";
} else {
	$_SESSION['cmds']=$cmd."\n";
}


socket_write($socket, $cmd."\n");
socket_close($socket);


?>
