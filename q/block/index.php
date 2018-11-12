<?php
require '../util.php';
$config = (require '../../config.php');

if (isset($_GET['height'])) {
    $height = $_GET['height'];
} else {
    $height = 1;
}


$info = fetch_block($config['api'], $height);

print_r($info);
