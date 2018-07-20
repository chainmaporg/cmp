/**
 * User balance service
 */
var UserBalaceService = function () {

	/**
	 * {timer} timer object
	 */
	this.interval = null;

	/**
	 * our balance table store balance for every wallet
	 * this functions finds new user wallets whichs are have not a record in user_balance table
	 * adress must be start with n1
	 * @return {UserBalaceService} return service for chaining
	 */
	this.findMissingBalances = function () {
		//find no determined balances
		global.connection.query('SELECT u.user_id, u.payment_address,b.balance FROM user u ' +
			'left join user_balance b on u.user_id = b.user_id where LEFT(u.payment_address,2)="n1"and balance is null', function (err, result, fields) {
				if (err) {
					return console.log(err);
				}

				if (result.length > 0) {
					//if thereis a null balance
					var wallets = [];
					var userIds = [];
					//make list of balances and users
					for (let i in result) {
						wallets.push(result[i].payment_address);
						userIds[result[i].payment_address] = result[i].user_id
					}
					//make list of wallets and ass
					chainService.builder().
						from(global.config.chainmapServerWallet).
						to(config.smartContract_address).
						contractCall('balancesOf', wallets).call((err, data) => {
							var inserts = [];
							var now = Math.floor((new Date()).getTime() / 1000)
							//generate list for sql
							for (let wallet in data.result) {
								inserts.push([userIds[wallet], data.result[wallet], now])
							}
							//add new wallets to database user_balance table
							global.connection.query("INSERT INTO user_balance (user_id, balance,timestamp) VALUES ?", [inserts], function (err, result) {
								if (err) {
									console.log(err);
								}
							});
						})
				}

			})
		return this;
	}

	/**
	 * user_balance table stores user balances with history and add a new record on new balance test
	 * this function find records whichs are older than renewLimit and test them for any balance change. it stores test values
	 * @return {UserBalaceService} return service for chaining
	 */
	this.findOldBalances = function () {
		var limit = global.config.balance.renewLimit || 86400;
		global.connection.query('select * from (select b.user_id,max(timestamp) as timestamp,u.payment_address from ' +
			'user_balance b left join user u on u.user_id = b.user_id  group by user_id) b where  timestamp < unix_timestamp() - ' + limit, function (err, result) {
				if (err) {
					return console.log(err);
				}

				if (result.length > 0) {
					//if thereis a old balance
					var wallets = [];
					var userIds = [];
					//get wallets and userids
					for (let i in result) {
						wallets.push(result[i].payment_address);
						userIds[result[i].payment_address] = result[i].user_id
					}
					//make list of wallets and ask with balances of function
					chainService.builder().
						from(global.config.chainmapServerWallet).
						to(config.smartContract_address).
						contractCall('balancesOf', wallets).call((err, data) => {
							var inserts = [];
							var now = Math.floor((new Date()).getTime() / 1000)
							//generate list for sql
							for (let wallet in data.result) {
								inserts.push([userIds[wallet], data.result[wallet], now])
							}
							//insert new balances to database
							global.connection.query("INSERT INTO user_balance (user_id, balance,timestamp) VALUES ?", [inserts], function (err, result) {
								if (err) {
									console.log(err);
								}
							});
						})
				}
			});
		return this;
	}

	/**
	 * run balance actions in paralel and log date to console.
	 * @return {UserBalaceService} return service for chaining
	 */
	this.run = function () {
		console.log('Balance getter working on ' + (new Date()).toString());
		this.findMissingBalances();
		this.findOldBalances();
		return this;
	}

	/**
	 * set balance check interval with timer.
	 * if want to change timer simply call again. it clears timer and reset it
	 * @param {number} timer interval in second
	 * @return {UserBalaceService} return service for chaining
	 */
	this.set = function (timer) {
		timer = timer || global.config.balance.testTimer || 20;
		clearInterval(this.interval);
		this.interval = setInterval(() => {
			//call run every timer second
			this.run();
		}, 1000 * 60 * timer);
		//run now once
		this.run();
		return this;
	}

	/**
	 * start service
	 * starts and set first timer from config
	 * @return {UserBalaceService} return service for chaining
	 */
	this.start = function () {
		this.set(global.config.balance.testTimer || 20);
		return this;
	}

	/**
	 * get user balance from database with history of it
	 * @param {number} userId user database id not wallet
	 * @param {number} limit history size for getting
	 * @return {Promise} thenable object
	 */
	this.user = function (userId, limit) {
		limit = limit || 100;
		return new Promise((resolve, reject) => {
			global.connection.query('SELECT * from user_balance where user_id = ? order by timestamp desc limit ?', [userId, limit], function (err, result) {
				if (err) {
					return reject(err);
				}
				if (result.length == 0) {
					//if no record reject with error
					return reject(new Error('No record finded for userid'))
				}
				var list = [];
				for (let i in result) {
					list.push({ date: new Date(result[i].timestamp * 1000), balance: result[i].balance })
				}
				//resolve it
				resolve({
					balance: result[0].balance,
					history: list
				});
			})
		})

	}

}

//generate service on global scope
global.userBalanceService = new UserBalaceService();
//start service with defaults
global.userBalanceService.start();
//export it
module.exports = global.userBalanceService;