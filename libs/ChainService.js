"use strict";
var queue = require('queue')


var Nebulas = require("nebulas");
var TX = require('./TX');


var ChainService = function () {

	this.api = null

	this.timeout = 1000;
	this.debug = true;

	this.globalState = {};
	this.globalAccount = null;


	this.txQueue = null;

	this.chainId = 1;

	/**
	 * 
	 * sets debug status
	 * @param {boolean} debug 
	 */
	this.setDebug = function (debug) {
		this.debug = debug || true;
		return this;
	}

	/**
	 * sends a console.log
	 * @param {string} text message
	 * @param {string} type type of message
	 */
	this.log = function (text, type) {
		if (this.debug) {
			console.log((type != undefined ? "[" + type + "] " : '') + text);
		}
	}

	/**
	 * unlocks account
	 * @param {string|object} json 
	 * @param {string} pass 
	 */
	this.unlock = function (json, pass) {
		var account = new Nebulas.Account();
		json = typeof (json) == "string" ? JSON.parse(json) : json;
		account = account.fromKey(json, pass, true);
		console.log('account unlocked')
		return account;
	}

	/**
	 * get state of addr 
	 * @param {string} addr 
	 */
	this.getState = function (addr) {
		var self = this;
		return Promise.retry((resolve, reject) => {
			self.neb.api.getAccountState(addr)
				.then((accstate) => {
					accstate.nonce = parseInt(accstate.nonce);
					resolve(accstate)
				})
				.catch((err) => {
					console.log(err);
					self.log(addr + " get state error", 'error');
					setTimeout(() => {
						reject(err)
					}, self.timeout);
				})
		})
	}

	/**
	 * get state of transaction and resolves when it is ok
	 * @param {string} tx 
	 */
	this.txStatus = function (tx) {

		var self = this;
		return Promise.retry((resolve, reject) => {
			self.neb.api.getTransactionReceipt({
				hash: tx
			}).then((receipt) => {
				if (receipt.status != 2) {
					resolve(receipt)
				} else {
					self.log(tx + " transaction not finished, waiting", 'info');
					setTimeout(() => {
						reject(null)
					}, self.timeout);
				}
			}).catch((err) => {
				self.log(addr + " transaction check gets error, refreshing", 'error');
				setTimeout(() => {
					reject(err)
				}, self.timeout);
			})
		})
	}



	/**
	 * generate new address and resolves when it finish
	 * @param {*} pass 
	 */
	this.createAddress = function (pass) {
		return new Promise((resolve) => {
			var account = Nebulas.Account.NewAccount();

			pass = pass || Math.random().toString(16).substr(3, 10);

			var json = account.toKey(pass);
			var wallet = {
				address: account.getAddressString(),
				json: JSON.stringify(json),
				pass: pass,
			};
			resolve(wallet)
		})
	}

	/**
	 * starts tx builder
	 * @param {null|Account} acc account data
	 * @param {number} nonce nonce value
	 */
	this.builder = function (acc, nonce) {
		return (new TX()).start(acc || this.globalAccount);
	}


	/**
	 * push tx to queue
	 * @param {object} txData txdata
	 * @param {closure} callback callback on send action
	 * @param {number} times try times
	 * @param {number} timer interval
	 */
	this.callPush = function (txData, callback, times, timer) {
		var self=this;
		if (this.chainId == -1) {
			console.error('No wallet information on config');
			return;
		}
		//create data
		let data = {
			chainID: this.chainId,
			value: 0,
			gasPrice: 1000000,
			gasLimit: 200000,
			nonce:0
		};
		//merge it
		Object.assign(data, txData);
		//push to que
		this.txQueue.push(() => {
			return self.neb.api.call(data).then(function (data) {
				//code
				data.result=JSON.parse(data.result)
				callback(null, data)
			}).catch((err) => {
				callback(err)
			});
		})
	}


	/**
	 * push tx to queue
	 * @param {object} txData txdata
	 * @param {closure} callback callback on send action
	 * @param {number} times try times
	 * @param {number} timer interval
	 */
	this.txPush = function (txData, callback, times, timer) {

		if (this.chainId == -1) {

			console.error('No wallet information on config');
			return;
		}
		//create data
		let data = {
			chainID: this.chainId,
			value: 0,
			gasPrice: 1000000,
			gasLimit: 200000,
		};
		//merge it
		Object.assign(data, txData);
		//set correct nonce
		if (data.nonce === 0) {
			//add 1 to nonce
			data.nonce = (+this.globalState.nonce) + 1;
			//set new nonce
			this.globalState.nonce = data.nonce + 0;
		}
		var tx = new Nebulas.Transaction(data);
		//sign it
		tx.signTransaction();
		//push to que
		this.txQueue.push(() => {
			return this.sendTx(tx, times, timer).then((status) => {
				callback(null, status)
			}).catch((err) => {
				callback(err)
			});
		})
	}

	/**
	 * sends tx to net and resolves when it is success
	 * @param {object} txData 
	 * @param {number} times repeat time if not undefined tries to send as times time
	 * @param {number} timer delay time for transaction try
	 */
	this.sendTx = function (tx, times, timer) {
		var self = this;
		return Promise.retry((resolve, reject) => {

			setTimeout(() => {
				//send tx to blockchain
				self.neb.api.sendRawTransaction({
					data: tx.toProtoString()
				}).then((result) => {
					resolve(result)
				}).catch((err) => {
					self.log("transaction send gets error, retrying" + err, 'error');
					setTimeout(() => {
						//refresh after timeout
						reject(err)
					}, self.timeout);
				})
			}, undefined == timer ? 0 : timer)

		}, times)

	}






	this.start = function () {
		var self = this;
		this.txQueue = queue({
			autostart: true,
		});

		// define promise rety
		Object.defineProperty(Promise, 'retry', {
			configurable: true,
			writable: true,
			value: function retry(executor, retries) {
				const promise = new Promise(executor)
				if (retries > 0 || retries == undefined) {
					return promise.catch(error => {
						if (null != error) {

							self.log("\n\n")
							self.log(JSON.stringify(error), "error");
							self.log("\n\n")
						}
						return Promise.retry(executor, undefined == retries ? undefined : --retries)
					})
				}

				return promise
			}
		})
		this.neb = new Nebulas.Neb();
		if (global.config.wallet != undefined) {
			this.chainId = global.config.wallet.net == 'test' ? 1001 : 1;
			this.neb.setRequest(new Nebulas.HttpRequest(this.chainId == 1001 ? "https://testnet.nebulas.io" : "https://mainnet.nebulas.io"));
			this.globalAccount = this.unlock(global.config.wallet.json, global.config.wallet.pass);
			this.getState(global.config.wallet.json.address).then((state) => {
				this.globalState = state;
				console.log('contract data loaded')
				this.txQueue.start(function (err) {
					if (err) {
						throw err
					}
					console.log('queue finished')
				})
			})
		} else {
			console.error('No wallet information on config');
			this.chainId = -1;
		}


	}

	this.start()


}

global.chainService = new ChainService();
module.exports = global.chainService;