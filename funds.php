<?php
  if  ($_POST['uploadKey'] == "c394f380-c7df-479f-b312-0b4a6fc3a357")
  {
	  if (!unlink('funds.dat.old')) {
      echo json_encode(array('success' => false, 'reason' => 'Failed to delete the old funds.dat!'));
    } else {
      if (!rename('funds.dat', 'funds.dat.old')) {
        echo json_encode(array('success' => false, 'reason' => 'Failed to rename the funds.dat!'));
      } else {
        if (file_put_contents('funds.dat', $_POST['fundsData']) === false) {
          echo json_encode(array('success' => false, 'reason' => 'Failed to write the new funds.dat!'));
        } else {
          echo json_encode(array('success' => true));
        }
      }
    }
  } else {
    echo json_encode(array('success' => false, 'reason' => 'The upload key is wrong or not specified!'));
  } 
?>