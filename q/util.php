<?php

function build_post_context(string $postdata) {
        return stream_context_create(array(
                'http' =>
                        array(
                                'method' => 'POST',
                                'header' => "Content-Type: application/json\r\n".
                                            "Content-Length: ".strlen($postdata)."\r\n",
                                'content' => $postdata
                        )
                )
        );
};

function build_rpc_body(string $method, string $params) {
        return '{"jsonrpc":"2.0","id":"blockexplorer","method":"'.$method.'","params":'.$params.'}';
};

function fetch_rpc(string $api, string $method, string $params) {
        $url = $api . '/json_rpc';
        $rendered_rpc = build_rpc_body($method, $params);
        $context = build_post_context($rendered_rpc);
        $response = file_get_contents($url, false, $context);
        return json_decode($response, true);
};

function fetch_supply(string $api, string $hash) {
        $url = $api . '/json_rpc';
        $rendered_rpc = '{"jsonrpc":"2.0","method":"f_block_json","params":{"hash":"'.$hash.'"}}';
        $context = build_post_context($rendered_rpc);
        $response = file_get_contents($url, false, $context);
        return json_decode($response, true);
};

function fetch_getinfo(string $api) {
        $_url = $api . '/getinfo';
        $response = file_get_contents($_url);
        return json_decode($response, true);
};

function fetch_block(string $api, string $block) {
        $url = $api . '/json_rpc';
        $rendered_rpc = '{"jsonrpc":"2.0","method":"getblockheaderbyheight","params":{"height":'.$block.'}}';
        $context = build_post_context($rendered_rpc);
        $response = file_get_contents($url, false, $context);
        return $response;
};

function fetch_exchange(string $maple) {
        $_url = $maple;
        $response = file_get_contents($_url);
        return json_decode($response, true);
};

function fetch_bitstamp(string $bitstamp) {
        $_url = $bitstamp;
        $response = file_get_contents($_url);
        return json_decode($response, true);
};

function fetch_coingecko(string $coingecko) {
        $_url = $coingecko;
        $response = file_get_contents($_url);
        return json_decode($response, true);
};