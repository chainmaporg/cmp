var Cmap = artifacts.require("Cmap");
var CmapToken = artifacts.require("CmapToken");

contract('Cmap', function (accounts) {
	it("can add owner to cmap", function () {
		return Cmap.deployed().then(function (instance) {
			return instance.addOwner.call(accounts[1]);
		}).then(function (result) {
			assert.equal(result, true, "result is true");
		});
	});

	it(accounts[1] + " add and remove owner", async function () {
		var cmap = await Cmap.deployed();

		let addOwner = await cmap.addOwner(accounts[1]);
		assert.equal(addOwner.receipt.status, 1, "owner defined");

		let isOwner = await cmap.isOwner.call(accounts[1]);
		assert.equal(isOwner, true, "owner tested");

		let removeOwner = await cmap.removeOwner(accounts[1]);
		assert.equal(removeOwner.receipt.status, 1, "owner deleted");

		let isOwner2 = await cmap.isOwner.call(accounts[1]);
		assert.equal(isOwner2, false, "owner tested");
	});

	it("send token from poll", async () => {

		var cmap = await Cmap.deployed();

		let firstToken = await cmap.balanceOf.call(accounts[1]);

		assert.equal(firstToken.toString(), "0", "first token must be zero");


		let transfer = await cmap.tokenDeposit(accounts[1], 100 * 1e4);
		assert.equal(transfer.receipt.status, 1, "transfer is ok");

		let secondToken = await cmap.balanceOf.call(accounts[1]);
		assert.equal(secondToken.toString(), "1000000", "first token must be zero");

		let transfer2 = await cmap.tokenDeposit(accounts[2], 50 * 1e4);
		assert.equal(transfer2.receipt.status, 1, "transfer is ok");

		let thirdToken = await cmap.balanceOf.call(accounts[2]);
		assert.equal(thirdToken.toString(), "500000", "first token must be zero");


	})

});