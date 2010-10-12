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
// echo $cmd."<br>";
// Sending id to socket server for connecting to correct M2 process.
socket_write($socket, $id."\n", strlen($id."\n"));
//echo "wrote id<br>";

if(strpos($cmd."\n","exit\n")!==false){
	echo "Exit requested.<br>";
	$cmd = ">>RESET<<";
}

if( $cmd == ">>RESET<<"){
	echo ">>RESET<<";
	unset($_SESSION['cmds']);
	socket_write($socket, $cmd."\n");
	socket_close($socket);
	return;
}

//echo "<br> Id: ".$id."<br>\n";

// Saving commands so far.
if(isset($_SESSION['cmds'])){
	if(!file_exists("results_".$id.".txt")){
		// If the results file does not exist, but there have been
		// commands, then the M2 pipe has
		// certainly been killed. In this case it could be necessary
		// to resend all commands given so far.
		echo "Resending all commands.<br>";
		socket_write($socket, $_SESSION['cmds']);
	}
	$_SESSION['cmds']=$_SESSION['cmds'].$cmd."\n";
} else {
	$_SESSION['cmds']=$cmd."\n";
}

//echo "<br>";

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
	echo "<br>No output file.<br>";
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
	echo "<br>M2 not done yet.<br>";
}
// Reformat output for html use.
$output = str_replace("dontreplacenothing", "<br>\n", file_get_contents("results_".$id.".txt"));
echo $output."\n";
?>
