<?php
require '../util.php';
$config = (require '../../config.php');

$blockHeader = fetch_rpc($config['api'], 'getlastblockheader', '""');

$difficulty = $blockHeader['result']['block_header']['difficulty'];
print_r($difficulty);
