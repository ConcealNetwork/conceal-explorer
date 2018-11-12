var blockchainExplorer 	= "?hash={id}#blockchain_block";
var transactionExplorer = "?hash={id}#blockchain_transaction";
var paymentIdExplorer 	= "?hash={id}#blockchain_payment_id";

var style_cookie_name = "style";
var style_cookie_duration = 365;
var style_domain = window.location.hostname;


var renderDate = function(d) {
    return d.getFullYear() + '-' +
        ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
        ('0' + d.getDate()).slice(-2) + ' ' +
        ('0' + d.getHours()).slice(-2) + ':' +
        ('0' + d.getMinutes()).slice(-2);
};


$(document).ready(function() {
    if (donationAddress !== undefined && donationAddress !== "") {
        $("#donations").show();
        $("#donationAddress").html(donationAddress);
    }
});

function getTransactionUrl(id) {
    return transactionExplorer.replace('{symbol}', symbol.toLowerCase()).replace('{id}', id);
}

$.fn.update = function(txt){
    var el = this[0];
    if (el.textContent !== txt)
        el.textContent = txt;
    return this;
};

function updateTextClasses(className, text){
    var els = document.getElementsByClassName(className);
    for (var i = 0; i < els.length; i++){
        var el = els[i];
        if (el.textContent !== text)
            el.textContent = text;
    }
}

function updateText(elementId, text){
    var el = document.getElementById(elementId);
    if (el.textContent !== text){
        el.textContent = text;
    }
    return el;
}

function updateTextLinkable(elementId, text){
    var el = document.getElementById(elementId);
    if (el.innerHTML !== text){
        el.innerHTML = text;
    }
    return el;
}

var currentPage;
var lastStats;
var numberFormatter = new Intl.NumberFormat('en-US'); // US formatting, force commas.

function localizeNumber(number) {
    return numberFormatter.format(number);
}

function getReadableHashRateString(hashrate){
    var i = 0;
    var byteUnits = [' H', ' kH', ' MH', ' GH', ' TH', ' PH', ' EH', ' ZH', ' YH' ];
    while (hashrate > 1000){
        hashrate = hashrate / 1000;
        i++;
    }
    return localizeNumber(hashrate.toFixed(2)) + byteUnits[i];
}

function getReadableDifficultyString(difficulty, precision){
    if (isNaN(parseFloat(difficulty)) || !isFinite(difficulty)) return 0;
    if (typeof precision === 'undefined') precision = 0;
    var units = ['', 'k', 'M', 'G', 'T', 'P'],
        number = Math.floor(Math.log(difficulty) / Math.log(1000));
    if (units[number] === undefined || units[number] === null) {
        return 0
    }
    return localizeNumber((difficulty / Math.pow(1000, Math.floor(number))).toFixed(precision)) + ' ' +  units[number];
}

function formatBlockLink(hash){
    return '<a href="' + getBlockchainUrl(hash) + '">' + hash + '</a>';
}

function getReadableCoins(coins, digits, withoutSymbol){
    var amount = (parseInt(coins || 0) / coinUnits).toFixed(digits || coinUnits.toString().length - 1);
    return localizeNumber(amount) + (withoutSymbol ? '' : (' ' + symbol));
}

function formatDate(time){
    if (!time) return '';
    return renderDate(new Date(parseInt(time) * 1000));
}

function formatPaymentLink(hash){
    return '<a href="' + getTransactionUrl(hash) + '">' + hash + '</a>';
}

function pulseLiveUpdate(){
    var stats_update = document.getElementById('stats_updated');
    stats_update.style.transition = 'opacity 100ms ease-out';
    stats_update.style.opacity = 1;
    setTimeout(function(){
        stats_update.style.transition = 'opacity 7000ms linear';
        stats_update.style.opacity = 0;
    }, 500);
}

window.onhashchange = function(){
    routePage();
};


function fetchLiveStats() {
    $.ajax({
        url: api + '/getinfo',
        dataType: 'json',
        type: 'GET',
        cache: 'false'
    }).done(function(data){
        pulseLiveUpdate();
        lastStats = data;
        currentPage.update();
    }).always(function () {
        setTimeout(function() {
            fetchLiveStats();
        }, refreshDelay);
    });
}

function floatToString(float) {
    return float.toFixed(6).replace(/[0\.]+$/, '');
}


var xhrPageLoading;
function routePage(loadedCallback) {

    if (currentPage) currentPage.destroy();
    $('#page').html('');
    $('#loading').show();

    if (xhrPageLoading)
        xhrPageLoading.abort();

    $('.hot_link').parent().removeClass('active');
    var $link = $('a.hot_link[href="' + (window.location.hash || '#') + '"]');

    $link.parent().addClass('active');
    var page = $link.data('page');

    xhrPageLoading = $.ajax({
        url: 'pages/' + page,
        cache: false,
        success: function (data) {
            $('#loading').hide();
            $('#page').show().html(data);
            currentPage.init();
            currentPage.update();
            if (loadedCallback) loadedCallback();
        }
    });
}

function getBlockchainUrl(id) {
    return blockchainExplorer.replace('{id}', id);
}

$(function(){
    $.get(api + '/getinfo', function(data){
        try {
            lastStats = JSON.parse(data);
        } catch(e) {
            lastStats = data;
        }
        routePage(fetchLiveStats);
    });
});

// Blockexplorer functions
urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
        return null;
    }
    else{
        return results[1] || 0;
    }
}

$(function() {
    $('[data-toggle="tooltip"]').tooltip();
});

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}
