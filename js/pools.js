var poolList = [];

var customHash = function (str) {
  // custom hash function makes the potential color space tighter for the
  // hasher, generating more distinct colors. Since so many pools have close
  // names, their hashes were generating similar colors
  return ColorHash.BKDRHash(str) / 13;
};

var colorHash = new ColorHash({ hash: customHash, lightness: [0.55, 0.66, 0.77] });

var poolStats = [];
var difficulties = [];
var poolsChart = null;
var totalHashrate = 0;
var totalMiners = 0;
var lastReward = 0;
var avgDiff = 0;

var poolsRefreshed = 0;

var poolsTable = document.getElementById('network-hash');
sorttable.makeSortable(poolsTable);

var calculateTotalFee = function (config) {
  let totalFee = config.config.fee;
  for (let property in config.config.donation) {
    if (config.config.donation.hasOwnProperty(property)) {
      totalFee += config.config.donation[property];
    }
  }
  return Math.round(totalFee * 1000) / 1000;
};

var renderPoolRow = function (host, name, data, d) {

  var agostring = $.timeago(d);
  var datestring = renderDate(d);

  var pools_row = [];

  pools_row.push('<tr>');
  pools_row.push('<td id=host-' + name + '><a target=blank href=http://' + host + '>' + name + '</a></td>');
  pools_row.push('<td class="height" id=height-' + name + '>' + localizeNumber(data.network.height) + '</td>');
  pools_row.push('<td id=hashrate-' + name + '>' + localizeNumber(data.pool.hashrate) + ' H/s</td>');
  pools_row.push('<td id=miners-' + name + '>' + localizeNumber(data.pool.miners) + '</td>');
  pools_row.push('<td id=totalFee-' + name + '>' + calculateTotalFee(data) + '%</td>');
  pools_row.push('<td id=minPayout-' + name + '>' + getReadableCoins(data.config.minPaymentThreshold, 2) + '</td>');
  pools_row.push('<td><span id=lastFound-' + name + '>' + datestring + '</span> (<span class="timeago" id="ago-' + name + '">' + agostring + '</span>)</td>');
  pools_row.push('</tr>');

  return pools_row.join('');
};

var translateAPI2 = function (data) {
  return {
    'network': {
      'height': '',
    },
    'pool': {
      'hashrate': data.pool_statistics.hashRate,
      'miners': data.pool_statistics.miners,
    },
    'config': {
      'minPaymentThreshold': ''
    }
  };
};

var displayChart = function displayChart() {
  var ctx = document.getElementById('poolsChart');

  // due to network hash being derived via difficulty, and pool rate being
  // actually gathered, these numbers can be a bit wishy-washy when hashrate
  // flucuates in the moment. Occasionally pool rates will be greater than
  // the total hashrate, and the graph doesn't appreciate negative numbers.
  var poolsRate = poolStats.reduce(function (v, p) { return v + p[1]; }, 0);
  var networkRate = Math.floor(lastStats.difficulty / blockTargetInterval);
  var unknownRate = Math.max(0, networkRate - poolsRate);

  var sortedPools = poolStats.concat([['Unknown', unknownRate, "#666666"]]).sort(function (poolA, poolB) {
    if (poolA[1] > poolB[1]) {
      return -1;
    } else if (poolA[1] < poolB[1]) {
      return 1;
    }

    return 0;
  });

  var chartData = {
    labels: sortedPools.map(function (p) { return p[0]; }),
    datasets: [{
      data: sortedPools.map(function (p) { return p[1]; }),
      backgroundColor: sortedPools.map(function (p) { return p[2]; }),
      borderWidth: 1,
      segmentShowStroke: false
    }]
  };

  if (poolsChart === null) {
    var options = {
      animation: {
        duration: 0
      },
      title: {
        display: true,
        text: langData['poolsChartTitle'] || 'Network Hashrate Visualization',
        fontSize: 18,
        fontColor: '#FFA500'
      },
      legend: {
        position: 'bottom',
        labels: {
          fontColor: '#c8c8c8'
        },
      },
      layout: {
        padding: {
          left: 0,
          right: 0
        },
      },
      tooltips: {
        enabled: true,
        mode: 'single',
        callbacks: {
          title: function (tooltipItem, data) { return data.labels[tooltipItem[0].index]; },
          label: function (tooltipItem, data) {
            var amount = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
            var total = eval(data.datasets[tooltipItem.datasetIndex].data.join('+'));
            return localizeNumber(amount) + ' / ' + localizeNumber(total) + ' H/s  (' + parseFloat(amount * 100 / total).toFixed(2) + '%)';
          }
        }
      }
    };

    poolsChart = new Chart(ctx, {
      type: 'doughnut',
      data: chartData,
      options: options
    });
  } else {
    poolsChart.data = chartData;
    poolsChart.update({ duration: 0 });
  }
}

var lazyRefreshChart = debounce(displayChart, 50, true);

$.getJSON(poolListUrl, function (data, textStatus, jqXHR) {
  poolList = data;

  poolList.forEach(function (element) {
    var url = element[1];
    var host = element[0];
    var version = element[3];

    if (version == "1") {
      $.getJSON(url + '/stats', function (data, textStatus, jqXHR) {

        var d = new Date(parseInt(data.pool.lastBlockFound));
        var index = host.indexOf('/');
        var poolName;

        if (index < 0) {
          poolName = host;
        } else {
          poolName = host.substr(0, index);
        }

        $('#pools_rows').append(renderPoolRow(host, poolName, data, d));

        totalHashrate += parseInt(data.pool.hashrate);
        totalMiners += parseInt(data.pool.miners);

        updateText('totalPoolsHashrate', getReadableHashRateString(totalHashrate) + '/sec');
        updateText('total_miners', localizeNumber(totalMiners));

        poolStats.push([poolName, parseInt(data.pool.hashrate), colorHash.hex(poolName)]);

      }).always(function () {
        lazyRefreshChart();
      });
    } else if (version == "2") {
      var index = host.indexOf("/");
      var poolName;

      if (index < 0) {
        poolName = host;
      } else {
        poolName = host.substr(0, index);
      }

      $.getJSON(url + '/pool/stats', function (data, textStatus, jqXHR) {
        var d = new Date(data.pool_statistics.lastBlockFoundTime * 1000);

        var tdata = translateAPI2(data);

        $('#pools_rows').append(renderPoolRow(host, poolName, tdata, d));

        totalHashrate += parseInt(data.pool_statistics.hashRate);
        totalMiners += parseInt(data.pool_statistics.miners);

        updateText('totalPoolsHashrate', getReadableHashRateString(totalHashrate) + '/sec');
        updateText('total_miners', localizeNumber(totalMiners));

        poolStats.push([poolName, data.pool_statistics.hashRate, colorHash.hex(poolName)]);

        $.getJSON(url + '/network/stats', function (data, textStatus, jqXHR) {
          properHeight = data.height + 1;
          updateText('height-' + poolName, localizeNumber(properHeight));
        });

        $.getJSON(url + '/config', function (data, textStatus, jqXHR) {
          updateText('totalFee-' + poolName, "PPLNS: " + data.pplns_fee + "%,\nPPS: " + data.pps_fee + "%,\nSolo: " + data.solo_fee + "%");
          updateText('minPayout-' + poolName, "Wallet: " + getReadableCoins(data.min_wallet_payout, 2) + ",\nExchange: " + getReadableCoins(data.min_exchange_payout, 2));
        });
      }).always(function () {
        lazyRefreshChart();
      });
    }
  });
});


setInterval(function () {

  totalHashrate = 0;
  totalMiners = 0;
  poolStats = [];

  poolList.forEach(function (element) {
    var url = element[1];
    var host = element[0];
    var version = element[3];

    if (version == "1") {
      var index = host.indexOf("/");
      var poolName;
      if (index < 0) {
        poolName = host;
      } else {
        poolName = host.substr(0, index);
      }

      $.getJSON(url + '/stats', (data, textStatus, jqXHR) => {
        var d = new Date(parseInt(data.pool.lastBlockFound));
        var datestring = renderDate(d);
        var agostring = $.timeago(d);

        totalHashrate += parseInt(data.pool.hashrate);
        totalMiners += parseInt(data.pool.miners);

        updateText('height-' + poolName, localizeNumber(data.network.height));
        updateText('hashrate-' + poolName, localizeNumber(data.pool.hashrate) + ' H/s');
        updateText('miners-' + poolName, localizeNumber(data.pool.miners));
        updateText('lastFound-' + poolName, datestring);
        updateText('ago-' + poolName, agostring);
        updateText('totalPoolsHashrate', getReadableHashRateString(totalHashrate) + '/sec');
        updateText('total_miners', localizeNumber(totalMiners));
        updateText('networkHashrate', getReadableHashRateString(lastStats.difficulty / blockTargetInterval) + '/sec');
        updateText('networkDifficulty', getReadableDifficultyString(lastStats.difficulty, 0).toString());

        poolStats.push([poolName, parseInt(data.pool.hashrate), colorHash.hex(poolName)]);
      }).always(function () {
        lazyRefreshChart();
      });
    } else {
      var index = host.indexOf("/");
      var poolName;
      if (index < 0) {
        poolName = host;
      } else {
        poolName = host.substr(0, index);
      }

      $.getJSON(url + '/pool/stats', (data, textStatus, jqXHR) => {
        var d = new Date(data.pool_statistics.lastBlockFoundTime * 1000);
        var datestring = renderDate(d);
        var agostring = $.timeago(d);

        updateText('hashrate-' + poolName, localizeNumber(data.pool_statistics.hashRate) + ' H/s');
        updateText('miners-' + poolName, localizeNumber(data.pool_statistics.miners));
        // updateText('totalFee'+poolName, calculateTotalFee(data)+'%');

        totalHashrate += parseInt(data.pool_statistics.hashRate);
        totalMiners += parseInt(data.pool_statistics.miners);
        updateText('totalPoolsHashrate', getReadableHashRateString(totalHashrate) + '/sec');
        updateText('total_miners', localizeNumber(totalMiners));

        poolStats.push([poolName, data.pool_statistics.hashRate, colorHash.hex(poolName)]);
      }).always(function () {
        lazyRefreshChart();
      });

      $.getJSON(url + '/network/stats', (data, textStatus, jqXHR) => {
        updateText('height-' + poolName, localizeNumber(data.height));
      });
    }
  });

}, 120000);


var xhrGetBlocks;
function getBlocks() {
  if (xhrGetBlocks) xhrGetBlocks.abort();
  xhrGetBlocks = $.ajax({
    url: api + '/json_rpc',
    method: 'POST',
    data: JSON.stringify({
      jsonrpc: '2.0',
      id: 'test',
      method: 'f_blocks_list_json',
      params: {
        height: lastStats.height - 1
      }
    }),
    dataType: 'json',
    cache: 'false',
    success: function (data) {
      if (data.result) {
        $.when(
          renderBlocks(data.result.blocks)
        ).then(function () {
          setTimeout(function () {
            calcAvgHashRate();
          }, 100)
        });
      }
    }
  })
}

function renderBlocks(blocksResults) {
  for (var i = 0; i < blocksResults.length; i++) {
    var block = blocksResults[i];
    difficulties.push(parseInt(block.difficulty));
  }
}

function calcAvgHashRate() {
  var sum = difficulties.reduce(add, 0);
  function add(a, b) {
    return a + b;
  }
  avgDiff = Math.round(sum / difficulties.length);
  var avgHashRate = avgDiff / blockTargetInterval;

  updateText('avgDifficulty', getReadableDifficultyString(avgDiff, 0).toString());
  updateText('avgHashrate', getReadableHashRateString(avgDiff / blockTargetInterval));
  //updateText('blockSolveTime', getReadableTime(lastStats.difficulty / avgHashRate));
}

function renderLastBlock() {
  $.ajax({
    url: api + '/json_rpc',
    method: "POST",
    data: JSON.stringify({
      jsonrpc: "2.0",
      id: "test",
      method: "getlastblockheader",
      params: {

      }
    }),
    dataType: 'json',
    cache: 'false',
    success: function (data) {
      last_block_hash = data.result.block_header.hash;
      $.ajax({
        url: api + '/json_rpc',
        method: "POST",
        data: JSON.stringify({
          jsonrpc: "2.0",
          id: "test",
          method: "f_block_json",
          params: {
            hash: last_block_hash
          }
        }),
        dataType: 'json',
        cache: 'false',
        success: function (data) {
          var block = data.result.block;
          lastReward = parseInt(block.baseReward);
        }
      });
    }
  });
}


/* Hash Profitability Calculator */

$('#calcHashRate').keyup(calcEstimateProfit).change(calcEstimateProfit);
$('#calcHashUnits > li > a').click(function (e) {
  e.preventDefault();
  $('#calcHashUnit').text($(this).text()).data('mul', $(this).data('mul'));
  calcEstimateProfit();
});


function calcEstimateProfit() {
  try {
    var rateUnit = Math.pow(1024, parseInt($('#calcHashUnit').data('mul')));
    var hashRate = parseFloat($('#calcHashRate').val()) * rateUnit;
    var profit = (hashRate * 86400 / avgDiff /*lastStats.difficulty*/) * lastReward;
    if (profit) {
      updateText('calcHashAmount', getReadableCoins(profit, 2, true));
      return;
    }
  }
  catch (e) { }
  updateText('calcHashAmount', '');
}

currentPage = {
  destroy: function () { },
  init: function () {
    getBlocks();
    renderLastBlock();
    loadTranslations();
  },
  update: function () {
    updateText('networkHashrate', getReadableHashRateString(lastStats.difficulty / blockTargetInterval) + '/sec');
    updateText('networkDifficulty', getReadableDifficultyString(lastStats.difficulty, 0).toString());
    getBlocks();
    renderLastBlock();
  }
};
