var blockchainExplorer = "?hash={id}{lang}#blockchain_block";
var transactionExplorer = "?hash={id}{lang}#blockchain_transaction";
var paymentIdExplorer = "?hash={id}{lang}#blockchain_payment_id";

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

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

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
  // Only lang is used; require allowlisted code from langs map.
  if (paramName !== 'lang') return;
  if (typeof langs === 'undefined' || !langs || !Object.prototype.hasOwnProperty.call(langs, paramValue)) {
    return;
  }
  var url;
  try {
    url = new URL(window.location.href);
  } catch (e) {
    return;
  }
  url.searchParams.set('lang', paramValue);
  window.location.assign(url.pathname + url.search + url.hash);
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
    $("#donationAddress").text(donationAddress);
  }
});

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Hex ids used in explorer URLs (block/tx/payment hashes). */
function safeExplorerId(id) {
  var s = String(id == null ? '' : id);
  return /^[0-9a-fA-F]+$/.test(s) ? s : '';
}

/** Safe fragment for element ids (pool names, etc.). */
function safeDomIdPart(value) {
  return String(value == null ? '' : value).replace(/[^A-Za-z0-9_-]/g, '_');
}

/**
 * Allow only http(s) URLs with a simple hostname (no credentials).
 * Accepts bare host or host/path (e.g. fastpool.xyz/ccx).
 */
function safeExternalHttpUrl(hostOrUrl) {
  var s = String(hostOrUrl == null ? '' : hostOrUrl).trim();
  if (!s) return '';
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) {
    s = 'https://' + s;
  }
  try {
    var u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    if (u.username || u.password) return '';
    if (!u.hostname || !/^[a-zA-Z0-9.-]+$/.test(u.hostname)) return '';
    return u.protocol + '//' + u.host + u.pathname + u.search;
  } catch (e) {
    return '';
  }
}

function createTextCell(text, className) {
  var td = document.createElement('td');
  if (className) td.className = className;
  td.textContent = text == null ? '' : String(text);
  return td;
}

function createLink(href, text, attrs) {
  var a = document.createElement('a');
  setSafeHref(a, href);
  a.textContent = text == null ? '' : String(text);
  if (attrs) {
    for (var key in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, key)) continue;
      if (key === 'className') a.className = attrs[key];
      else if (key === 'href') setSafeHref(a, attrs[key]);
      else a.setAttribute(key, String(attrs[key]));
    }
  }
  return a;
}

function createLinkCell(href, text, className) {
  var td = document.createElement('td');
  if (className) td.className = className;
  td.appendChild(createLink(href, text));
  return td;
}

function setRowCells(row, cells) {
  while (row.firstChild) row.removeChild(row.firstChild);
  for (var i = 0; i < cells.length; i++) {
    row.appendChild(cells[i]);
  }
  return row;
}

function createDateTimeCell(timestamp) {
  var td = document.createElement('td');
  td.className = 'date-time';
  var dateTime = new Date(parseInt(timestamp, 10) * 1000).toISOString();
  td.appendChild(document.createTextNode(formatDate(timestamp) + ' ('));
  var time = document.createElement('time');
  time.className = 'timeago';
  time.setAttribute('datetime', dateTime);
  td.appendChild(time);
  td.appendChild(document.createTextNode(')'));
  return td;
}

function createBlockLink(hash) {
  var id = safeExplorerId(hash);
  return createLink(id ? getBlockchainUrl(id) : '#', hash == null ? '' : String(hash));
}

function createPaymentLink(hash) {
  var id = safeExplorerId(hash);
  return createLink(id ? getTransactionUrl(id) : '#', hash == null ? '' : String(hash));
}

function createBlockLinkCell(hash, className) {
  var td = document.createElement('td');
  if (className) td.className = className;
  td.appendChild(createBlockLink(hash));
  return td;
}

function createPaymentLinkCell(hash, className) {
  var td = document.createElement('td');
  if (className) td.className = className;
  td.appendChild(createPaymentLink(hash));
  return td;
}

function replaceElementChildren(el, nodeOrNodes) {
  while (el.firstChild) el.removeChild(el.firstChild);
  if (nodeOrNodes == null) return el;
  if (Array.isArray(nodeOrNodes)) {
    for (var i = 0; i < nodeOrNodes.length; i++) {
      el.appendChild(nodeOrNodes[i]);
    }
  } else if (typeof nodeOrNodes === 'string') {
    el.textContent = nodeOrNodes;
  } else {
    el.appendChild(nodeOrNodes);
  }
  return el;
}

function makeNavBlockLink(blockHash, direction) {
  var id = safeExplorerId(blockHash);
  var a = createLink(id ? getBlockchainUrl(id) : '#', '');
  var isNext = direction === 'next';
  a.setAttribute('title', isNext ? 'Previous block' : 'Next block');
  var icon = document.createElement('i');
  icon.className = 'fa fa-chevron-circle-' + (isNext ? 'right' : 'left');
  icon.setAttribute('aria-hidden', 'true');
  a.appendChild(icon);
  return a;
}

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

function getSafeLangCode() {
  var Language = GetURLParameter('lang');
  if (Language && typeof langs !== 'undefined' && langs &&
      Object.prototype.hasOwnProperty.call(langs, Language)) {
    return Language;
  }
  return '';
}

function getFinalUrl(URL) {
  var Language = getSafeLangCode();
  if (Language) {
    return URL.replace('{lang}', '&lang=' + encodeURIComponent(Language));
  }
  return URL.replace('{lang}', '');
}

/** Same-document explorer URL (always starts with /). Hex id only. */
function buildExplorerPathUrl(hashName, id) {
  var safe = safeExplorerId(id);
  if (!safe) return '#';
  var u;
  try {
    u = new URL(window.location.href);
  } catch (e) {
    return '#';
  }
  u.searchParams.set('hash', safe);
  var lang = getSafeLangCode();
  if (lang) u.searchParams.set('lang', lang);
  else u.searchParams.delete('lang');
  u.hash = hashName;
  return u.pathname + u.search + u.hash;
}

function getTransactionUrl(id) {
  return buildExplorerPathUrl('blockchain_transaction', id);
}

function getPaymentIdUrl(id) {
  return buildExplorerPathUrl('blockchain_payment_id', id);
}

/**
 * Allow only same-document relative hrefs (/ ? #) or validated http(s).
 * Blocks scheme tricks and protocol-relative "//…".
 */
function sanitizeHref(href) {
  if (typeof href !== 'string' || href.length === 0) return '#';
  if (href.indexOf('//') === 0) return '#';
  var c0 = href.charAt(0);
  if (c0 === '/' || c0 === '?' || c0 === '#') return href;
  return safeExternalHttpUrl(href) || '#';
}

function setSafeHref(el, href) {
  if (!el) return false;
  var safe = sanitizeHref(href);
  if (el.setAttribute) el.setAttribute('href', safe);
  else $(el).attr('href', safe);
  return true;
}

/**
 * Same-document navigation only (path / query / hash). Rejects absolute/scheme URLs.
 */
function navigateExplorer(url) {
  var safe = sanitizeHref(url);
  if (safe === '#' && url !== '#') return false;
  if (safe.charAt(0) !== '/' && safe.charAt(0) !== '?' && safe.charAt(0) !== '#') return false;
  window.location.assign(safe);
  return true;
}

function navigateByExplorerId(id, buildUrl) {
  var safe = safeExplorerId(id);
  if (!safe) return false;
  return navigateExplorer(buildUrl(safe));
}

$.fn.update = function (txt) {
  var el = this[0];
  if (!el) return this;
  if (el.textContent !== txt)
    el.textContent = txt;
  return this;
};

function updateTextClasses(className, text) {
  var els = document.getElementsByClassName(className);
  $(els).text(text);
}

function updateText(elementId, text) {
  var el = document.getElementById(elementId);
  if (!el) return null;
  if (text !== undefined) el.textContent = text;
  return el;
}

function updateTextLinkable(elementId, nodeOrText) {
  var el = document.getElementById(elementId);
  if (!el) return null;
  return replaceElementChildren(el, nodeOrText);
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
  var id = safeExplorerId(hash);
  var href = id ? getBlockchainUrl(id) : '#';
  return '<a href="' + escapeHtml(href) + '">' + escapeHtml(hash) + '</a>';
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
  var id = safeExplorerId(hash);
  var href = id ? getTransactionUrl(id) : '#';
  return '<a href="' + escapeHtml(href) + '">' + escapeHtml(hash) + '</a>';
}

function pulseLiveUpdate() {
  var stats_update = document.getElementById('stats_updated');
  if (!stats_update) return;
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
  return buildExplorerPathUrl('blockchain_block', id);
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

      result_text.empty();
      result_text.append(document.createTextNode('This proves that specified address holds at least '));
      var amountSpan = document.createElement('span');
      amountSpan.className = 'verificationNum';
      amountSpan.textContent = formatNumber(getReadableCoins(res.total, 2));
      result_text.append(amountSpan);
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