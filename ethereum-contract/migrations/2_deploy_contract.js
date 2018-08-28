
var Cmap = artifacts.require("Cmap");
var CmapToken = artifacts.require("CmapToken");

module.exports = function (deployer) {
	var cmap;
	deployer.deploy(Cmap).then(function(CmapInstance){
		cmap=CmapInstance;
		console.log("cmap deployed ",cmap.address)
		return deployer.deploy(CmapToken)
	}).then(function(cmapToken){

		console.log("cmapToken deployed ",cmapToken.address)
		//set cmap to token
		cmap.setTokenAddress(cmapToken.address);
		//add contract as owner
		cmapToken.addOwner(cmap.address)
	})
};