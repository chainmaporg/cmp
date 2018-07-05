const TX = function () {
	this.txData = {
		chainID: 1,
		from: "n1QZMXSZtW7BUerroSms4axNfyBGyFGkrh5",
		to: "n1SAeQRVn33bamxN4ehWUT7JGdxipwn8b17",
		value: 0,
		nonce: 0,
		gasPrice: 1000000,
		gasLimit: 2000000
	}

	/**
	 * starts tx
	 * @param {string|Nebulas.Account} account from account
	 * @param {number} nonce nonce
	 */
	this.start = function (account, nonce) {
		if(global.config.wallet != undefined){
			this.txData.chainID = global.config.wallet.net != 'test' ? 1 : 1001;
		}
		if (account != undefined) {
			this.from(account, nonce);
		}
		return this;
	}

	/**
	 * set from addre	
	 * @param {string} addr 
	 * @param {number} nonce 
	 */
	this.from = function (addr, nonce) {
		this.txData.from = addr;
		if (nonce) {
			this.txData.nonce = nonce;
		}
		return this;
	}

	/**
	 * set to address
	 * @param {string} addr 
	 */
	this.to = function (addr) {
		this.txData.to = addr;
		return this;
	}

	/**
	 * set transaction value
	 * @param {number} value transaction value
	 * @param {boolean} asNas if true convert to wei
	 */
	this.value = function (value, asNas) {
		if (asNas === true) {
			value = value * 1e18;
		}
		this.txData.value = value;
		return this;
	}

	/**
	 * sets gas
	 * @param {number} price gasPrice for tx
	 * @param {number} limit gaLisimit for tx
	 */
	this.gas = function (price, limit) {
		if (price) {
			this.txData.gasPrice = price;
		}
		if (limit) {
			this.txData.gasLimit = limit;
		}
		return this;
	}

	/**
	 * set nonce
	 * @param {number} nonce nonce for request
	 */
	this.nonce = function (nonce) {
		this.txData.nonce = nonce;

		return this;
	}

	/**
	 * create contract function call
	 * first arg is func name and others are params
	 */
	this.contractCall = function () {
		var args = Array.prototype.slice.call(arguments);
		var func = args.shift();
		this.txData.contract = {
			function: func,
			args: JSON.stringify(args)
		}
		return this;
	}

	/**
	 * returns tx data
	 */
	this.data = function () {
		return this.txData;
	}


	/**
	 * sends tx to chainService
	 * @param {closure} callback callback
	 * @param {number} times repeat times before success
	 * @param {number} timer interval between tries
	 */
	this.send = function (callback, times, timer) {
		//push it to queue
		return global.chainService.txPush(this.data(),callback, times, timer)
	}


}
TX.type = 'main';
module.exports = TX;