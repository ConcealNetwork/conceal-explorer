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

var poolsLoadingIndicator = null;
var poolsRefreshed = 0;

var poolsTable = document.getElementById('network-hash');
if (poolsTable) sorttable.makeSortable(poolsTable);

function poolFieldId(field, name) {
  return field + '-' + safeDomIdPart(name);
}

var calculateTotalFee = function (config) {
  let totalFee = config.config.fee;
  for (let property in config.config.donation) {
    if (config.config.donation.hasOwnProperty(property)) {
      totalFee += config.config.donation[property];
    }
  }
  return Math.round(totalFee * 1000) / 1000;
};

var renderPoolRow = function (data) {
  var name = data.info.name;
  var agostring = $.timeago(new Date(data.pool.lastBlockFound));
  var datestring = renderDate(new Date(data.pool.lastBlockFound));
  var poolHashrate = data.pool.soloHashrate ? (data.pool.hashrate + data.pool.soloHashrate) : data.pool.hashrate;

  var row = document.createElement('tr');

  var hostTd = document.createElement('td');
  hostTd.id = poolFieldId('host', name);
  var href = safeExternalHttpUrl(data.info.host);
  if (href) {
    var a = document.createElement('a');
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.setAttribute('href', href);
    a.textContent = name == null ? '' : String(name);
    hostTd.appendChild(a);
  } else {
    hostTd.textContent = name == null ? '' : String(name);
  }
  row.appendChild(hostTd);

  var heightTd = createTextCell(localizeNumber(data.network.height));
  heightTd.id = poolFieldId('height', name);
  heightTd.className = 'height';
  row.appendChild(heightTd);

  var hashrateTd = createTextCell(localizeNumber(poolHashrate) + ' H/s');
  hashrateTd.id = poolFieldId('hashrate', name);
  row.appendChild(hashrateTd);

  var minersTd = createTextCell(localizeNumber(data.pool.miners));
  minersTd.id = poolFieldId('miners', name);
  row.appendChild(minersTd);

  var feeTd = createTextCell(data.config.poolFee + '%');
  feeTd.id = poolFieldId('totalFee', name);
  row.appendChild(feeTd);

  var payoutTd = createTextCell(getReadableCoins(data.config.minPaymentThreshold, 2));
  payoutTd.id = poolFieldId('minPayout', name);
  row.appendChild(payoutTd);

  var lastTd = document.createElement('td');
  var lastFound = document.createElement('span');
  lastFound.id = poolFieldId('lastFound', name);
  lastFound.textContent = datestring;
  lastTd.appendChild(lastFound);
  lastTd.appendChild(document.createTextNode(' ('));
  var ago = document.createElement('span');
  ago.className = 'timeago';
  ago.id = poolFieldId('ago', name);
  ago.textContent = agostring;
  lastTd.appendChild(ago);
  lastTd.appendChild(document.createTextNode(')'));
  row.appendChild(lastTd);

  return row;
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
            var series = data.datasets[tooltipItem.datasetIndex].data;
            var total = 0;
            for (var i = 0; i < series.length; i++) total += series[i];
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

function initializePoolList() {
  poolsLoadingIndicator = $('#poolList').loadingIndicator({
    useImage: false,
    showOnInit: true
  }).data("loadingIndicator");

  $.getJSON(poolListUrl, function (data, textStatus, jqXHR) {
    data.forEach(function (element) {
      $('#pools_rows').append(renderPoolRow(element));

      totalHashrate += element.pool.hashrate;
      totalMiners += element.pool.miners;

      updateText('totalPoolsHashrate', getReadableHashRateString(totalHashrate) + '/sec');
      updateText('total_miners', localizeNumber(totalMiners));

      poolStats.push([element.info.name, element.pool.hashrate, colorHash.hex(element.info.name)]);
    });

    // hide the pools loading indicator
    poolsLoadingIndicator.hide();
    // refresh chart once
    lazyRefreshChart();
  });
}

setInterval(function () {
  totalHashrate = 0;
  totalMiners = 0;
  poolStats = [];

  $.getJSON(poolListUrl, function (data, textStatus, jqXHR) {
    data.forEach(function (element) {
      var poolName = element.info.name;
      var d = new Date(parseInt(element.pool.lastBlockFound));
      var datestring = renderDate(d);
      var agostring = $.timeago(d);

      totalHashrate += element.pool.hashrate;
      totalMiners += parseInt(element.pool.miners);

      updateText(poolFieldId('height', poolName), localizeNumber(element.network.height));
      updateText(poolFieldId('hashrate', poolName), localizeNumber(element.pool.hashrate) + ' H/s');
      updateText(poolFieldId('miners', poolName), localizeNumber(element.pool.miners));
      updateText(poolFieldId('lastFound', poolName), datestring);
      updateText(poolFieldId('ago', poolName), agostring);
      updateText('totalPoolsHashrate', getReadableHashRateString(totalHashrate) + '/sec');
      updateText('total_miners', localizeNumber(totalMiners));
      updateText('networkHashrate', getReadableHashRateString(lastStats.difficulty / blockTargetInterval) + '/sec');
      updateText('networkDifficulty', getReadableDifficultyString(lastStats.difficulty, 0).toString());

      poolStats.push([poolName, element.pool.hashrate, colorHash.hex(poolName)]);
    });

    // refresh chart once
    lazyRefreshChart();
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
    initializePoolList();
  },
  update: function () {
    updateText('networkHashrate', getReadableHashRateString(lastStats.difficulty / blockTargetInterval) + '/sec');
    updateText('networkDifficulty', getReadableDifficultyString(lastStats.difficulty, 0).toString());
    getBlocks();
    renderLastBlock();
  }
};
