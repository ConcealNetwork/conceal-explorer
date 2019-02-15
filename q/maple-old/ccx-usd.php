<?php

require '../util.php';
$config = (require '../../config.php');

$datay1 = json_decode(file_get_contents('prices.txt'), true);

$sats = end($datay1);

$info2 = fetch_bitstamp($config['bitstamp']);

$btc = number_format($info2['last'],2,".",",");

$ccxinusd = ($sats / 100000000) * $info2['last'];

$ccx_usd = number_format($ccxinusd, 4, ".", "");

$info3 = fetch_getinfo($config['api']);

$difficulty = number_format($info3['difficulty'] / 1000000,0,"",",");
$hashrate = number_format(round($info3['difficulty'] / $config['blockTargetInterval']) / 1000,2,".",",");

$blockHeader = fetch_rpc($config['api'], 'getlastblockheader', '""');
$deposits = number_format($blockHeader['result']['block_header'][deposits] / 1000000,6,".",",");
$rewardRaw = $blockHeader['result']['block_header']['reward'];
$reward = number_format($rewardRaw / 1000000, 2, ".", ",");
$hash = $blockHeader['result']['block_header']['hash'];

$lastBlock = fetch_supply($config['api'], $hash);
$supply = number_format($lastBlock['result']['block']['alreadyGeneratedCoins'] / 1000000,6,".",",");


print_r($ccx_usd." ".$sats." ".$btc." ".$difficulty." ".$hashrate." ".$reward." ".$deposits." ".$supply);

