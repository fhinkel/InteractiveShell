<?php


$s = stripslashes($_REQUEST['s']);

//echo $_REQUEST["fname"];
//echo "<br>";

echo ("You said " . $s . ".");

if($s=='hello'){
	echo "Bye bye";
	
} else {
	echo "It's impolite not to say hello.";
}


?>
