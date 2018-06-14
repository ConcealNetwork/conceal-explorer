# Conceal Explorer
Block explorer for Conceal Cryptocurrency.

#### Installation

1) It takes data from daemon "conceald". It should be accessible from the Internet. Run the daemon with open port as follows:
```bash
./conceald --rpc-bind-ip=0.0.0.0 --rpc-bind-port=24888
```
2) Just upload to your website and change 'api' variable in config.js to point to your daemon. You will also need to go through the API pages and update the links to point to your daemon IP as well. The API pages are located in the "q/" directory, the index.php file must point to your daemon IP. You must change all 4 of them "hashrate" "reward" "supply" "height"
