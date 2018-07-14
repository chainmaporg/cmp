var UserBalaceService = function () {

	this.interval = null;

	this.findMissingBalances = function () {
		//find no determined balances
		global.connection.query('SELECT u.user_id, u.payment_address,b.balance FROM user u ' +
			'left join user_balance b on u.user_id = b.user_id where LEFT(u.payment_address,2)="n1"and balance is null', function (err, result, fields) {
				if (result.length > 0) {
					//if thereis a null balance
					var wallets = [];
					var userIds = [];
					for (let i in result) {
						wallets.push(result[i].payment_address);
						userIds[result[i].payment_address] = result[i].user_id
					}
					//make list of wallets and ass
					chainService.builder().
						from('n1JVPC9AASsVQQVUEJQARZZzaaAfCSu9yLb').
						to(config.smartContract_address).
						contractCall('balancesOf', wallets).call((err, data) => {
							var inserts = [];
							var now = Math.floor((new Date()).getTime() / 1000)
							//generate list for sql
							for (let wallet in data.result) {
								inserts.push([userIds[wallet], data.result[wallet], now])
							}
							//create connection
							global.connection.query("INSERT INTO user_balance (user_id, balance,timestamp) VALUES ?", [inserts], function (err, result) {
								if (err) {
									console.log(err);
								}
							});
						})
				}

			})
	}

	this.findOldBalances = function () {
		var limit = 86400;
		global.connection.query('select * from (select b.user_id,max(timestamp) as timestamp,u.payment_address from ' +
			'user_balance b left join user u on u.user_id = b.user_id  group by user_id) b where  timestamp < unix_timestamp() - ' + limit, function (err, result) {
				if (result.length > 0) {
					//if thereis a null balance
					var wallets = [];
					var userIds = [];
					for (let i in result) {
						wallets.push(result[i].payment_address);
						userIds[result[i].payment_address] = result[i].user_id
					}
					//make list of wallets and ass
					chainService.builder().
						from('n1JVPC9AASsVQQVUEJQARZZzaaAfCSu9yLb').
						to(config.smartContract_address).
						contractCall('balancesOf', wallets).call((err, data) => {
							var inserts = [];
							var now = Math.floor((new Date()).getTime() / 1000)
							//generate list for sql
							for (let wallet in data.result) {
								inserts.push([userIds[wallet], data.result[wallet], now])
							}
							//create connection
							global.connection.query("INSERT INTO user_balance (user_id, balance,timestamp) VALUES ?", [inserts], function (err, result) {
								if (err) {
									console.log(err);
								}
							});
						})
				}
			})
	}

	this.run = function () {
		console.log('Balance getter working on ' + (new Date()).toString());
		this.findMissingBalances();
		this.findOldBalances();
	}

	this.set = function (timer) {
		clearInterval(this.interval);
		this.interval = setInterval(() => {
			this.run();
		}, 1000 * 60 * timer)
		this.run();
	}

	this.start = function () {
		this.set(1);
	}

	this.user = function (userId, limit) {
		limit = limit || 100;
		return new Promise((resolve, reject) => {
			global.connection.query('SELECT * from user_balance where user_id = ? order by timestamp desc limit ?', [userId,limit], function (err, result) {
				if (err) {
					return reject(err);
				}
				if(result.length==0){
					return reject(new Error('No record finded for userid'))
				}
				var list = [];
				for(let i in result){
					list.push({date:new Date(result[i].timestamp*1000),balance:result[i].balance})
				}
				resolve({
					balance:result[0].balance,
					history:list
				});
			})
		})

	}

	this.start();
}

global.userBalanceService = new UserBalaceService();
module.exports = global.userBalanceService;