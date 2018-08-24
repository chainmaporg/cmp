var host = "107.181.170.169";
var search_solr_host = 'http://' + host + ':8983/solr/chainmap';
var search_engine_host = 'http://' + host + ':3000';
var chainmap_env = "local";
var smartContract_address = "n1oS3WbLc15VWfeeNr78N7aKjY9Ve8eupCb";

var chainmapServerWallet = "n1GvvvstiCXUKBaeYniqRGeoAdMkMHoipvc";

var supportEmail = "support@chainmap.org"
var dataSiteKey = "6LdF3GkUAAAAAIIWKqWINCO3LbxKroenIIPDZF_D"
var secretKey = "6LdF3GkUAAAAAKMbqkzddlZZe5PLs8m4qMlt6jJV"
var baseUrl = "http://localhost/"

module.exports = {
    name: 'server',
    db: {
        host: 'localhost',
        user: 'root',
        password: 'z1965z',
        database: 'cmpdb'

    },
	wallet: {
		json: {"version":4,"id":"036bc2ad-a5f6-4c97-858a-f789a65e9e62","address":"n1GvvvstiCXUKBaeYniqRGeoAdMkMHoipvc","crypto":{"ciphertext":"f4ec07ed03ac7a31700006a3435ef77aded9e26cf9474717ed736b2f526f55a3","cipherparams":{"iv":"2ed05d457a5b2fe017d91e822ce16721"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"50d4c9e29696acd616774891da23035d4ac7e7464eb9b2e32e0832cd8c040a81","n":4096,"r":8,"p":1},"mac":"c415adcad092d54135a9975eafe844b1af170fc637e7dfb910836fc6649c48c3","machash":"sha3256"}},
		pass: 'MyDongFangHong_05',
		net: 'test'
	},
	balance: {
		testTimer: 20,//in second
		renewLimit: 86400 //renew every 86400 second (1 day)
	},
    chainmap_env:chainmap_env,
    smartContract_address:smartContract_address,
    chainmapServerWallet:chainmapServerWallet,
    search_solr_host:search_solr_host,
    search_engine_host:search_engine_host,
    supportEmail:supportEmail,
    dataSiteKey:dataSiteKey,
    secretKey:secretKey,
    baseUrl:baseUrl	
}






