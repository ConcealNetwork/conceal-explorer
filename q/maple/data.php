<?php

$arr = json_decode(file_get_contents('prices.txt'), true);
$temp = array_reverse($arr);
array_pop($temp);

require '../util.php';
$config = (require '../../config.php');
$info = fetch_exchange("https://app.stex.com/api2/ticker");

for ($x = 1; $x <= count($info); $x++) {
    $market = $info[$x];
    if ($market['market_name'] == "CCX_BTC") {
        $price = $info[$x];
    }
} 

$sats = $price['ask'] * 100000000;
print($sats);
array_unshift($temp, $sats);
$arr = array_reverse($temp);
file_put_contents('prices.txt',  json_encode($arr));

