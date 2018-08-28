# Ethereum Contract
Ethereum contract for chainmap developed with **[Truffle Framework](https://truffleframework.com/)** and tested with **[Ganache](https://truffleframework.com/ganache)**.

Truffle and Ganache basicly help with
- Development envoirment for contract
- Contract test
- Personel blockchain with one click

## How To Install
- Install Truffle _(npm install truffle -g)_ and Ganache _([https://github.com/trufflesuite/ganache/releases](https://github.com/trufflesuite/ganache/releases))_
- change directory to ./ethereum-contract
- npm install
- start Ganache
- truffle test

After test it will deploy migrations to your personal blockchain and make test from test directory.

## Contracts

- **CMAP:** Base Chainmap contract for controlling other contracts and contract address storage contract
- **CmapOwner:** CmapOwner contract store owner addresses in map and let contracts to use **onlyOwner** modifier. With this modifier function can be used by only owner.
- **CmapToken:** ERC-20 token for Chainmap.

## Migrations
Cmap has two migrations now. 
1. First migration creates migrations contract for framework usage.
2. Creates Cmap base contract and token contract. 
    - set token contract address to base contract
    - set base contract owner of token contract
        ```javascript
        var Cmap = artifacts.require("Cmap");
        var CmapToken = artifacts.require("CmapToken");
        module.exports = function (deployer) {
	        var cmap;
	        deployer.deploy(Cmap).then(function(CmapInstance){ //deploy main
        		cmap=CmapInstance;
        		console.log("cmap deployed ",cmap.address)
        		return deployer.deploy(CmapToken) //deploy token
        	}).then(function(cmapToken){
        		console.log("cmapToken deployed ",cmapToken.address)
        		//set cmap to token
        		cmap.setTokenAddress(cmapToken.address);
        		//add contract as owner
        		cmapToken.addOwner(cmap.address)
        	})
        };
        ```

