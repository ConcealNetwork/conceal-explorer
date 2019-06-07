<?php
  define("REASON", "reason");
  define("SUCCESS", "success");
  
  if (hash('ripemd160', $_POST['uploadKey']) == "01855f7552595d8ab056318471ac5e0a0421a906")
  {
	
	if (!unlink('funds.dat.old')) {
      echo json_encode(array(SUCCESS => false, REASON => 'Failed to delete the old funds.dat!'));
    } else {
      if (!rename('funds.dat', 'funds.dat.old')) {
        echo json_encode(array(SUCCESS => false, REASON => 'Failed to rename the funds.dat!'));
      } else {
        if (file_put_contents('funds.dat', $_POST['fundsData']) === false) {
          echo json_encode(array(SUCCESS => false, REASON => 'Failed to write the new funds.dat!'));
        } else {
          echo json_encode(array(SUCCESS => true));
        }
      }
    }
  } else {
    echo json_encode(array(SUCCESS => false, REASON => 'The upload key is wrong or not specified!'));
  } 
?>