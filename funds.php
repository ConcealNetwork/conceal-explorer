<?php
  if  ($_POST['uploadKey'] == "c394f380-c7df-479f-b312-0b4a6fc3a357")
  {
	unlink('funds.dat.old');
    rename('funds.dat', 'funds.dat.old') ;
    file_put_contents('funds.dat', $_POST['fundsData']);	  
    echo "true";
  } else {
    echo "false";
  } 
?>