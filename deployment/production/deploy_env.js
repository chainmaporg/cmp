//Env related changes
var chainmap_env = "server";
var chainUrl = "https://mainnet.nebulas.io";
var smartContract_address = "n1k1hgNMHgSpWBHgHt3oW5n5N2TZ7PjQmEm";
var ChainId = 1; //1:mainNet 100:local; 1001:testnet
var chainmapServerWallet = "n1WzaxzW3yFVtJdj2udk53UDF5KopMV4E9x";

var host = "107.181.170.169"
var search_solr_host = 'http://' + host + ':8983/solr/chainmap'
var search_engine_host = 'http://' + host + ':3000'

exports.chainmap_env=chainmap_env
exports.chainUrl=chainUrl
exports.smartContract_address=smartContract_address
exports.ChainId=ChainId
exports.chainmapServerWallet=chainmapServerWallet
exports.search_solr_host=search_solr_host
exports.search_engine_host=search_engine_host

