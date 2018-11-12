<?php
require '../util.php';
$config = (require '../../config.php');

$info = fetch_maple($config['maple']);

$sell = $info['ticker']['sell'];
$price = $sell * 100000000;

print_r($price);
