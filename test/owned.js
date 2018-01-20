Promise = require("bluebird");
const Owned = artifacts.require("./Owned.sol");
web3.eth.makeSureAreUnlocked = require("../utils/makeSureAreUnlocked.js");

if (typeof web3.eth.getBlockPromise !== "function") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

contract('Owned', function(accounts) {

    let owner, owner2, owned, block0;

    before("should have proper accounts", function() {
        assert.isAtLeast(accounts.length, 2, "should have at least 2 accounts");
        owner = accounts[0];
        owner2 = accounts[1];
        return web3.eth.makeSureAreUnlocked([ owner ]);
    });
    
    beforeEach("should deployed a new Owned", function() {
        return Owned.new({ from: owner })
            .then(created => owned = created)
            .then(() => web3.eth.getTransactionReceiptPromise(owned.transactionHash))
            .then(receipt => block0 = receipt.blockNumber);
    });

    it("should receive the changed owner in transaction receipt", function() {
        return owned.setOwner(owner2, { from: owner })
            .then(txObject => {
                assert.strictEqual(txObject.logs.length, 1, "should have received 1 event");
                assert.strictEqual(
                    txObject.logs[0].args.previousOwner, owner,
                    "should be the first account");
                assert.strictEqual(
                    txObject.logs[0].args.newOwner, owner2,
                    "should be the second account");
                
                assert.strictEqual(txObject.receipt.logs.length, 1, "should have received 1 event");
                assert.strictEqual(txObject.receipt.logs[0].topics.length, 2, "should have 2 topics");
                assert.strictEqual(
                    txObject.receipt.logs[0].topics[0],
                    web3.sha3("OnOwnerChanged(address,address)"),
                    "should have event as first topic");
                assert.strictEqual(
                    txObject.receipt.logs[0].topics[1],
                    owner.replace("0x", "0x000000000000000000000000"),
                    "should have old owner as second topic");
                assert.strictEqual(
                    txObject.receipt.logs[0].data,
                    owner2.replace("0x", "0x000000000000000000000000"),
                    "should have new owner as blob");
            });

    });

});
