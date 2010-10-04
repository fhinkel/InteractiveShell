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
	$msgsock = socket_accept($sock);
	$id = trim(socket_read($msgsock,2048, PHP_NORMAL_READ));
	//echo $id."\n";
	//echo "id end\n";
	if(!isset($pipe[$id])){
		$pipe[$id] = popen("M2 > results_".$id.".txt 2>&1",'w');
	}
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
	foreach($connections as $key => $t){
		if($t <= $current_time){
			$remove[$key] = 0;
		}
		echo $key." ".$t."\n";
	}
	echo "-------------\n";
	foreach($remove as $key => $t){
		echo "Closing: ".$key."\n";
		pclose($pipe[$key]);
		unset($connections[$key]);
		unset($pipe[$key]);
		unlink("results_".$key.".txt");
	}
	echo count($remove)."\n";
	socket_close($msgsock);
	
} while (true);

socket_close($sock);
?>