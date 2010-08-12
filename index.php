<html>
<head>
<title>My First PHP Page</title>
</head>
<body>
<?php
echo "Hello World!";
?>
<?php
$M2command = $_POST["command"];
if (!isset($_POST['submit'])) { // if page is not submitted to itself echo the form
  echo "not submitted yet<br>";

?>
<form action="<?php echo $PHP_SELF;?>" method="post">

	Enter M2 command: <br> 
	<input type="text" name="command" /><br />
<input type="submit" value="submit" name="submit" />
</form>
<?
} else {
  echo "<br>hello, you entered ".$M2command. ".<br>";
  $my_s = "M2 -e '". $M2command. "; exit 0'";
  echo `$my_s`;
}?>

</body>
</html>
