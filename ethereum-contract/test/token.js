
var CmapToken = artifacts.require("CmapToken");
contract('CmapToken', async (accounts) => {

	it("send token from poll", async () => {
		var token = await CmapToken.deployed();

		let firstToken = await token.balanceOf.call(accounts[1]);
		assert.equal(firstToken.toString(), "0", "first token must be zero");

		let transfer = await token.poolDeposit(accounts[1], 100 * 1e4);
		assert.equal(transfer.receipt.status, 1, "transfer is ok");

		let secondToken = await token.balanceOf.call(accounts[1]);
		assert.equal(secondToken.toString(), "1000000", "first token must be zero");

		let transfer2 = await token.poolDeposit(accounts[2], 50 * 1e4);
		assert.equal(transfer2.receipt.status, 1, "transfer is ok");

		let thirdToken = await token.balanceOf.call(accounts[2]);
		assert.equal(thirdToken.toString(), "500000", "first token must be zero");


	})
})