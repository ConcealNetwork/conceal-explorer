var api = 'https://explorer.conceal.network/daemon';
var donationAddress = "";
var blockTargetInterval = 120;
var coinUnits = 1000000;
var symbol = 'CCX';
var refreshDelay = 5000;
// pools stats by MainCoins
var networkStat = {
	"ccx": [
        ["ccx.aiwakuang.cn", "https://ccx.aiwakuang.cn:8111"],
        ["pool.conceal.network", "https://pool.conceal.network/api"],
        ["ccx.scecf.org", "https://ccx.scecf.org:21001"],
        ["ccx-us.bluerockpools.net", "https://ccx-us.bluerockpools.net:8119"],
        ["conceal.herominers.com", "https://conceal.herominers.com/api"],
        ["conceal.modpool.org", "https://conceal.modpool.org:9119"],
        ["ccx.thorshammer.cc", "https://ccx.thorshammer.cc/api"],
        ["conceal.my-mining-pool.de", "https://apiconceal.my-mining-pool.de"],
        ["conceal.miningpros.online", "http://mine.miningpros.online:8117"],
        ["conceal.blockfoundry.org", "https://conceal.blockfoundry.org/api"]
	]
};
var networkStat2 = {
    "ccx": [
        ["ccx.go-mine.it", "https://ccx.go-mine.it/api"],
        ["ccx.romining.farm", "https://ccx.romining.farm/api"],
        ["webccx.semipool.com", "https://webccx.semipool.com/api"],
        ["conceal.luckypool.io", "https://conceal.luckypool.io/api"]
 ]
};




