<?php

require '../util.php';
$config = (require '../../config.php');

set_error_handler(
    create_function(
        '$severity, $message, $file, $line',
        'throw new ErrorException($message, $severity, $severity, $file, $line);'
    )
);

try {
    $response = file_get_contents('https://maplechange.com/api/v2/tickers/ccxbtc.json');
    $info = json_decode($response, true);
    $price = $info['ticker']['sell'];
    print_r($price);

}
catch (Exception $e) {
    print($e->getMessage());
}



