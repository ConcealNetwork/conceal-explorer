<?php
require '../util.php';
$config = (require '../../config.php');

$info = fetch_bitstamp($config['bitstamp']);

$last = $info['last'];
$price = $last;

print_r($price);
