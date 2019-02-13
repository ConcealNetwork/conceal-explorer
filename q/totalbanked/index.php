<?php
require '../util.php';
$config = (require '../../config.php');

$info = fetch_getinfo($config['api']);
$depositsRaw = $info['full_deposit_amount'];

$supply = number_format($depositsRaw / $config['coinUnits'], 0, ".", "");

print_r($supply);