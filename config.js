var api = 'https://explorer.conceal.network/daemon';
var donationAddress = "";
var blockTargetInterval = 120;
var coinUnits = 1000000;
var symbol = 'CCX';
var refreshDelay = 60;
// pools stats by MainCoins
var networkStat = {
 "ccx": [
	["walpool.com/ccx", "https://api.walpool.com/rpc/ccx/"],
	["pool.conceal.network", "https://pool.conceal.network/api"],
	["ccx.scecf.org", "https://ccx.scecf.org:21001"],
	["ccx.bluerockpools.net", "https://ccx.bluerockpools.net:8119"],
	["conceal.herominers.com", "https://conceal.herominers.com/api"],	
	["conceal.modpool.org", "https://conceal.modpool.org:9119"],
	["ccx.thorshammer.cc", "https://ccx.thorshammer.cc/api"],

]
};
var networkStat2 = {
    "ccx": [
		["ccx.go-mine.it", "https://ccx.go-mine.it/api"],		
 ]
};




