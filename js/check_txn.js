function pubKeyFromExtra(bin){
    var pub = false;
    while (bin.length > 0 && bin[0] == 0) {
        bin = bin.slice(1, bin.length);
    }    
    if (bin[0] == 1 && bin.length >= 65) {
        pub = bin.slice(1,65);
    }
    return pub;
}

function validHex(hex){
    var exp = new RegExp("[0-9a-fA-F]{" + hex.length + "}");
    return exp.test(hex);
}

function checkTxn(transactionResponse, privateKey, address, privateKeyType) {
    var txn = transactionResponse.tx;
    var txDetails = transactionResponse.txDetails;
    var addrHex = cnBase58.decode(address);
    var hash = txDetails.hash;
   
    var results = {
        error: false,
        total_owned: 0,
        owned: [],
        unowned: [],
    };
    var t = 4, s = 8, m = t + 64, e = m + 64; //offsets
    if (privateKey.length !== 64 || validHex(privateKey) !== true){
        results.error = "Invalid private key.";
    } else if (address.length != 98 || (addrHex.slice(-s) !== cn_fast_hash(addrHex.slice(0,-s)).slice(0,s))) {
        results.error = "Bad address";
    } else if (privateKeyType === 'view' && addrHex.slice(m,e) !== sec_key_to_pub(privateKey)) {
	results.error = "Secret View key does not match address.";
    } else if (hash.length !== 64 || !validHex(hash)){
        results.error = "Invalid TXN Hash";
    } else  {
        var pub = addrHex.slice(m,e);
        if (privateKeyType === "view") {
            pub =  pubKeyFromExtra(txn.extra);
        }

	if (!pub) {
            results.error = "Unrecognized tx_extra format!";
        } else {
            var der = cnUtil.generate_key_derivation(pub, privateKey);
            var spk = addrHex.slice(t,m);
            for (let i = 0; i < txn.vout.length; i++) {
                var pubkey = cnUtil.derive_public_key(der, i, spk);
                var amount = txn.vout[i].amount / 1000000;
                if (pubkey === txn.vout[i].target.data.key) {
                    results.total_owned += amount;
                    results.owned.push([i, pubkey, amount]);
                } else {
                    results.unowned.push([i, txn.vout[i].target.key, amount]);
                }
            }
            
        }
    }
    return results;
};

var getTxnRequest;
function getTxn(transactionHash, cb) {
    if (getTxnRequest) { getTxnRequest.abort(); }       
  
    getTxnRequest = $.ajax({
        url: api + "/json_rpc",
        method: "POST", 
        data: JSON.stringify({
            jsonrpc:"2.0",
            id: "blockexplorer",
            method:"f_transaction_json",
            params: {
                hash: transactionHash
            } 
        }),
        dataType: "json",
        error: function(resp) {
            alert(resp.error);
        },
        success: cb
    });
};

var transactionHash = $("#transaction_hash");
var privateKey = $("#private_key");
var publicAddress = $("#public_address");
var txnLink = $("#txn_link");
$("#check_transaction").click(function() {
    getTxn( transactionHash.val(), function(response) {
        if (response.error) {
            //TODO proper error display 
            alert(response.error.message);
        } else {
	    var privateKeyType = $("[name=keyType]:checked").val();
            var results = checkTxn(response.result, privateKey.val(), publicAddress.val(), privateKeyType);
            if (results.error) {
		$("#txn_link").attr('href', '');
		$("#txn_link").html('?');
                //TODO proper error display
                alert(results.error);
            } else {
		$("#txn_link").attr('href', '?hash=' + transactionHash.val()  + '#blockchain_transaction');
		$("#txn_link").html(transactionHash.val());
                $("#outputs_rows").html("");
                for (var o in results.owned) {
                    var owned = results.owned[o];
                    var row = "<tr><td>" + owned[2] + "</td><td>" + owned[1] + "</td></tr>";
                    $("#outputs_rows").append(row);
                }
            }
        }
    });
});
