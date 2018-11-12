var api = 'https://explorer.conceal.network/daemon';
var donationAddress = "";
var blockTargetInterval = 120;
var coinUnits = 1000000;
var symbol = 'CCX';
var refreshDelay = 60;
// pools stats by MainCoins
var networkStat = {
 "ccx": [
	["pool.conceal.network", "https://pool.conceal.network/api"],
	["ccx.scecf.org", "https://ccx.scecf.org:21001"],
	["ccx.bluerockpools.net", "https://ccx.bluerockpools.net:8119"],
	["ccx.heigh-ho.funkypenguin.co.nz", "https://api.ccx.heigh-ho.funkypenguin.co.nz"],
	["ccx.thepiratemine.nl", "https://ccx.thepiratemine.nl:2890"],
	["conceal.herominers.com", "https://conceal.herominers.com/api"],	
]
};
var networkStat2 = {
    "ccx": [
		["ccx.go-mine.it", "https://ccx.go-mine.it/api"],		
 ]
};




