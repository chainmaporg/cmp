//Env related changes
var chainmap_env = "local";

var chainUrl = "https://testnet.nebulas.io";
var smartContract_address = "n1eP44t9cXuZz2CLbCF6qdHdZVkCvBMN5sE"
var ChainId = 1001; //1:mainNet 100:local; 1001:testnet
var chainmapServerWallet = "n1GvvvstiCXUKBaeYniqRGeoAdMkMHoipvc"


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

