var blockchainExplorer = "?hash={id}{lang}#blockchain_block";
var transactionExplorer = "?hash={id}{lang}#blockchain_transaction";

var style_cookie_name = "style";
var style_cookie_duration = 365;
var style_domain = window.location.hostname;

// reserve global var
var xhrCheckReserve;

var renderDate = function (d) {
  return d.getFullYear() + '-' +
    ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
    ('0' + d.getDate()).slice(-2) + ' ' +
    ('0' + d.getHours()).slice(-2) + ':' +
    ('0' + d.getMinutes()).slice(-2);
};

function GetURLParameter(sParam) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] == sParam) {
      return sParameterName[1];
    }
  }
};

function setParameter(paramName, paramValue) {
  var url = window.location.href;
  var hash = location.hash;
  url = url.replace(hash, '');
  if (url.indexOf(paramName + "=") >= 0) {
    var prefix = url.substring(0, url.indexOf(paramName));
    var suffix = url.substring(url.indexOf(paramName));
    suffix = suffix.substring(suffix.indexOf("=") + 1);
    suffix = (suffix.indexOf("&") >= 0) ? suffix.substring(suffix.indexOf("&")) : "";
    url = prefix + paramName + "=" + paramValue + suffix;
  } else {
    if (url.indexOf("?") < 0)
      url += "?" + paramName + "=" + paramValue;
    else
      url += "&" + paramName + "=" + paramValue;
  }
  window.location.href = url + hash;
}

function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this,
      args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

$(document).ready(function () {
  if (donationAddress !== undefined && donationAddress !== "") {
    $("#donations").show();
    $("#donationAddress").html(donationAddress);
  }
});

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

function getFinalUrl(URL) {
  var Language = GetURLParameter('lang');

  if (Language) {
    return URL.replace('{lang}', "&lang=" + Language);
  } else {
    return URL.replace('{lang}', "");
  }
}

function getTransactionUrl(id) {
  return getFinalUrl(transactionExplorer.replace('{symbol}', symbol.toLowerCase()).replace('{id}', id))
}

$.fn.update = function (txt) {
  var el = this[0];
  if (el.textContent !== txt)
    el.textContent = txt;
  return this;
};

function updateTextClasses(className, text) {
  var els = document.getElementsByClassName(className);
  if ($(els).html !== text) {
    $(els).html(text);
  }
}

function updateText(elementId, text) {
  var el = document.getElementById(elementId);
  if ($(el).html !== text) {
    $(el).html(text);
  }
  return el;
}

function updateTextLinkable(elementId, text) {
  var el = document.getElementById(elementId);
  if (el.innerHTML !== text) {
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

function getReadableHashRateString(hashrate) {
  var i = 0;
  var byteUnits = [' H', ' kH', ' MH', ' GH', ' TH', ' PH', ' EH', ' ZH', ' YH'];
  while (hashrate > 1000) {
    hashrate = hashrate / 1000;
    i++;
  }
  return localizeNumber(hashrate.toFixed(2)) + byteUnits[i];
}

function getReadableDifficultyString(difficulty, precision) {
  if (isNaN(parseFloat(difficulty)) || !isFinite(difficulty)) return 0;
  if (typeof precision === 'undefined') precision = 0;
  var units = ['', 'k', 'M', 'G', 'T', 'P'],
    number = Math.floor(Math.log(difficulty) / Math.log(1000));
  if (units[number] === undefined || units[number] === null) {
    return 0
  }
  return localizeNumber((difficulty / Math.pow(1000, Math.floor(number))).toFixed(precision)) + ' ' + units[number];
}

function formatBlockLink(hash) {
  return '<a href="' + getBlockchainUrl(hash) + '">' + hash + '</a>';
}

function getReadableCoins(coins, digits, withoutSymbol) {
  var amount = (coins / coinUnits).toFixed(digits);
  return (amount) + (withoutSymbol ? '' : (' ' + symbol));
}

function getReadableCoins2(coins, digits, withoutSymbol) {
  var amount = (parseInt(coins || 0) / coinUnits).toFixed(digits);
  return localizeNumber(amount) + (withoutSymbol ? '' : (' ' + symbol));
}

function formatDate(time) {
  if (!time) return '';
  return renderDate(new Date(parseInt(time) * 1000));
}

function formatPaymentLink(hash) {
  return '<a href="' + getTransactionUrl(hash) + '">' + hash + '</a>';
}

function pulseLiveUpdate() {
  var stats_update = document.getElementById('stats_updated');
  stats_update.style.transition = 'opacity 100ms ease-out';
  stats_update.style.opacity = 1;
  setTimeout(function () {
    stats_update.style.transition = 'opacity 7000ms linear';
    stats_update.style.opacity = 0;
  }, 500);
}

window.onhashchange = function () {
  routePage();
};


function fetchLiveStats() {
  $.ajax({
    url: api + '/getinfo',
    dataType: 'json',
    type: 'GET',
    cache: 'false'
  }).done(function (data) {
    pulseLiveUpdate();
    lastStats = data;
    if (currentPage) {
      currentPage.update();
    }
  }).always(function () {
    setTimeout(function () {
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

      if (currentPage) {
        currentPage.init();
        currentPage.update();
      }

      if (loadedCallback) {
        loadedCallback();
      }
    }
  });
}

function getBlockchainUrl(id) {
  return getFinalUrl(blockchainExplorer.replace('{id}', id));
}

$(function () {
  $.get(api + '/getinfo', function (data) {
    try {
      lastStats = JSON.parse(data);
    } catch (e) {
      lastStats = data;
    }
    routePage(fetchLiveStats);
  });
});

// Blockexplorer functions
urlParam = function (name) {
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
  if (results == null) {
    return null;
  } else {
    return results[1] || 0;
  }
}

$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});

function hex2a(hexx) {
  var hex = hexx.toString(); //force conversion
  var str = '';
  for (var i = 0; i < hex.length; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

if (typeof defaultLang == "undefined") {
  var defaultLang = 'en';
}

var langCode = defaultLang;
var langData = null;

const $_GET = {};
const args = location.search.substr(1).split(/&/);
for (var i = 0; i < args.length; ++i) {
  const tmp = args[i].split(/=/);
  if (tmp[0] != "") {
    $_GET[decodeURIComponent(tmp[0])] = decodeURIComponent(tmp.slice(1).join("").replace("+", " "));
    var langCode = $_GET['lang'];
  }
}

function getTranslation(key) {
  if (!langData || !langData[key]) return null;
  return langData[key];
}

var translate = function (data) {
  langData = data;

  $("[tkey]").each(function (index) {
    var strTr = data[$(this).attr('tkey')];
    $(this).html(strTr);
  });

  $("[tplaceholder]").each(function (index) {
    var strTr = data[$(this).attr('tplaceholder')];
    $(this).attr('placeholder', strTr);
  });

  $("[tvalue]").each(function (index) {
    var strTr = data[$(this).attr('tvalue')];
    $(this).attr('value', strTr);
  });

  $("[tdata-original-title]").each(function (index) {
    var strTr = data[$(this).attr('tdata-original-title')];
    $(this).attr('data-original-title', strTr);
  });

}

function loadTranslations() {
  if (langData) {
    translate(langData);
  } else if (langs && langs[langCode]) {
    $.getJSON('lang/' + langCode + '.json', function (data) {
      translate(data);
    });
    $.getScript('lang/timeago/jquery.timeago.' + langCode + '.js');
  } else {
    $.getJSON('lang/' + defaultLang + '.json', function (data) {
      translate(data);
    });
    $.getScript('lang/timeago/jquery.timeago.' + defaultLang + '.js');
  }
}

function renderLangSelector() {
  // Desktop
  var html = '';
  var numLangs = 0;
  if (langs) {
    html += '<select id="newLang" class="form-control form-control-sm select2">';
    for (var lang in langs) {
      var selected = lang == langCode ? ' selected="selected"' : '';
      html += '<option value="' + lang + '"' + selected + '>' + langs[lang] + '</option>';
      numLangs++;
    }
    html += '</select>';
  }
  if (html && numLangs > 1) {
    $('#langSelector').html(html);
    $('#newLang').each(function () {
      $(this).change(function () {
        var newLang = $(this).val();
        setParameter("lang", newLang);
      });
    });
  }

  // Mobile
  var html = '';
  var numLangs = 0;
  if (langs) {
    html += '<select id="mNewLang" class="form-control form-control-sm">';
    for (var lang in langs) {
      var selected = lang == langCode ? ' selected="selected"' : '';
      html += '<option value="' + lang + '"' + selected + '>' + langs[lang] + '</option>';
      numLangs++;
    }
    html += '</select>';
  }
  if (html && numLangs > 1) {
    $('#mLangSelector').html(html);
    $('#mNewLang').each(function () {
      $(this).change(function () {
        var newLang = $(this).val();
        setParameter("lang", newLang);
      });
    });
  }
}

function wrongParamAlert(message, cointainer) {
  $(cointainer).after(
    '<div id="paramsAlert" class="alert alert-solid alert-danger mg-b-0" role="alert" style="z-index: 999;">' +
    '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
    '<span aria-hidden="true">×</span>' +
    '</button>' + message +
    '</div>');

  setTimeout(() => {
    $("#paramsAlert").fadeOut(2000, function () {
      $("#paramsAlert").remove();
    });
  }, 3000);
}

function checkReserveRaw(message, address, signature, callback) {
  xhrCheckReserve = $.ajax({
    url: api + '/json_rpc',
    method: "POST",
    data: JSON.stringify({
      jsonrpc: "2.0",
      id: "test",
      method: "check_reserve_proof",
      params: {
        message: message,
        address: address,
        signature: signature
      }
    }),
    dataType: 'json',
    cache: 'false',
    success: function (data) {
      callback(data);
    }
  });
}

function checkReserve(cointainer, message, address, signature) {
  if (xhrCheckReserve) xhrCheckReserve.abort();
  var result = $(cointainer).find(".verified");
  var result_text = result.find("span");
  var result_icon = result.find("i");
  result_text.empty();

  checkReserveRaw(message, address, signature, function (data) {
    if (data.error) {
      wrongParamAlert(data.error.message, cointainer);
    } else {
      var res = data.result;

      cointainer.removeClass("panel-default");
      cointainer.removeClass("panel-success");
      cointainer.removeClass("panel-warning");
      result.removeClass("text-success");
      result.removeClass("text-warning");
      result_icon.removeClass("fa-check");
      result_icon.removeClass("fa-times");

      result_text.html("This proves that specified address holds at least <span class='verificationNum'>"
        + formatNumber(getReadableCoins(res.total, 2)) + "</span>, from which the following amount was spent: <span class='verificationNum'>"
        + formatNumber(getReadableCoins(res.spent, 2))) + "</span>";
      cointainer.addClass("panel-success");
      result.addClass("text-success");
      result.attr("id", "bpTextSuccess");
      result_icon.addClass("fa-check");

      // TO-DO: Find when the result is not ok.

      //} else {
      //  result_text.text("Signature is invalid!");
      //  cointainer.addClass("panel-warning");
      //  result.addClass("text-warning");
      //  result.attr("id", "bpTextWarning");
      //  result_icon.addClass("fa-times");
      //}
      cointainer.show();
    }
  });
}

function smooth(arr, windowSize) {
  var result = [];

  for (i = 0; i < arr.length; i += 1) {
    var leftOffeset = i - windowSize;
    var from = leftOffeset >= 0 ? leftOffeset : 0;
    var to = i + windowSize + 1;

    var count = 0
    var sum = 0
    for (j = from; j < to && j < arr.length; j += 1) {
      sum += arr[j];
      count += 1;
    }

    result[i] = sum / count;
  }

  return result;
}