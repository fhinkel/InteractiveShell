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
// echo $cmd."";
// Sending id to socket server for connecting to correct M2 process.
socket_write($socket, $id."\n", strlen($id."\n"));
//echo "wrote id";
//$response = trim(socket_read($socket,1024, PHP_NORMAL_READ));
// If there is a thread sending commands to M2 for this id, the server
// will send this response and close the connection.
//if($response == ">>OCCUPIED<<"){
//	echo "Server is occupied for this id.\n";
//	socket_close($socket);
//	return;
//}

if(strpos($cmd."\n","exit\n")!==false){
	echo "Exit requested.";
	$cmd = ">>RESET<<";
}

if( $cmd == ">>RESET<<"){
	echo ">>RESET<<";
	unset($_SESSION['cmds']);
	socket_write($socket, $cmd."\n");
	socket_close($socket);
	return;
}

//echo " Id: ".$id."\n";
socket_write($socket, ">>SENDCOMMANDS<<\n");
// Saving commands so far.
if(isset($_SESSION['cmds'])){
	if(!file_exists("results_".$id.".txt")){
		// If the results file does not exist, but there have been
		// commands, then the M2 pipe has
		// certainly been killed. In this case it could be necessary
		// to resend all commands given so far.
		echo "Resending all commands.";
		socket_write($socket, $_SESSION['cmds']);
	}
	$_SESSION['cmds']=$_SESSION['cmds'].$cmd."\n";
} else {
	$_SESSION['cmds']=$cmd."\n";
}

//echo "";

socket_write($socket, $cmd."\n", strlen($cmd."\n"));
// Sending id second time for indicating end of input.
socket_write($socket, $id."\n", strlen($id."\n"));
socket_close($socket);
$c = 0;
while((!file_exists("results_".$id.".txt"))&&($c<5)){
	sleep(1);
	$c++;
}
if($c == 5){
	echo "No output file.";
	return;
}
	//echo "file exists";

// Checking if Macaulay is done. If everything went well, the
// last line of the output usually looks like "i** :", so
// we cut of the trailing spaces and check whether the last
// character is ":".
$output = strrev(trim(file_get_contents("results_".$id.".txt")));
//echo $output;
$c = 0;
while(($output[0] != ":")&&($c<5)){
	sleep(1);
	$output = strrev(trim(file_get_contents("results_".$id.".txt")));
	$c++;
}

if($c == 5){
	echo "M2 not done yet.";
}
// Reformat output for html use.
$output = file_get_contents("results_".$id.".txt");
echo $output;
?>
