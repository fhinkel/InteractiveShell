#!/usr/local/bin/php -q
<?php
error_reporting(E_ALL);

/* Allow the script to hang around waiting for connections. */
set_time_limit(0);

/* Turn on implicit output flushing so we see what we're getting
 * as it comes in. */
ob_implicit_flush();

$address = 'localhost';
$port = 10000;

$sock = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
socket_bind($sock, $address, $port); 
socket_listen($sock, 5);

do {
	echo "waiting\n";
	// This will wait for a new incoming connection. The
	// loop is not executed without new connection. This means
	// that no M2pipe is killed without a new connection even if
	// the timeout is hit. To avoid this behaviour one can set
	// socket_set_nonblock() before loop.
	$msgsock = socket_accept($sock);
	$id = trim(socket_read($msgsock,2048, PHP_NORMAL_READ));
	//echo $id."\n";
	//echo "id end\n";
	// Checking if there is a process for this id:
	if(!isset($pipe[$id])){
	
	    // If there is no pipe we might have to get the earlier
		// commands from the client. One can send a response to
		// client for indicating this. Since they can be saved
		// in the session object this should be easy.
		$pipe[$id] = popen("M2 > results_".$id.".txt 2>&1",'w');
	}
	// Setting time limit:
	$connections[$id] = time() + 10;
	while($buf = socket_read($msgsock, 2048, PHP_NORMAL_READ)){
		if( trim($buf) == $id ){
			//echo "input end\n";
			break;
		}
		fputs($pipe[$id], $buf);
		//echo $buf;
	}
	$current_time = time();
	$remove = array();
	// Checking which pipes to close:
	foreach($connections as $key => $t){
		if($t <= $current_time){
			$remove[$key] = 0;
		}
		echo $key." ".$t."\n";
	}
	echo "-------------\n";
	// Closing pipes:
	foreach($remove as $key => $t){
		echo "Closing: ".$key."\n";
		// closing pipes.
		pclose($pipe[$key]);
		unset($connections[$key]);
		unset($pipe[$key]);
		// remove output files.
		unlink("results_".$key.".txt");
	}
	echo count($remove)."\n";
	socket_close($msgsock);
	
} while (true);

socket_close($sock);
?>