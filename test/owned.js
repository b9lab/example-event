var Owned = artifacts.require("./Owned.sol");

Extensions = require("../utils/extensions.js");
Extensions.init(web3, assert);

contract('Owned', function(accounts) {

    var owner, owner2, owned, block0;

    before("should have proper accounts", function() {
        assert.isAtLeast(accounts.length, 2, "should have at least 2 accounts");
        owner = accounts[0];
        owner2 = accounts[1];
        return Extensions.makeSureAreUnlocked([ owner ]);
    });
    
    beforeEach("should deployed a new Owned", function() {
        return Owned.new({ from: owner })
            .then(created => {
                owned = created;
                return web3.eth.getTransactionReceiptPromise(created.transactionHash);
            })
            .then(receipt => block0 = receipt.blockNumber);
    });

    it("should receive the changed owner", function() {
        return owned
            .setOwner(owner2, { from: owner })
            .then(txObject => {
                assert.equal(txObject.logs.length, 1, "should have received 1 event");
                assert.equal(
                    txObject.logs[0].args.previousOwner, accounts[0],
                    "should be the first account");
                assert.equal(
                    txObject.logs[0].args.newOwner, accounts[1],
                    "should be the second account");
                return owned.setOwner(owner, { from: owner2 });
            })
            .then(txObject => {
                assert.equal(txObject.logs.length, 1, "should have received 1 event");
                assert.equal(
                    txObject.logs[0].args.previousOwner, owner2,
                    "should be the second account");
                assert.equal(
                    txObject.logs[0].args.newOwner, owner,
                    "should be the first account");
                return Promise.all([
                        Extensions.getEventsPromise(owned.OnOwnerChanged(
                            { previousOwner: owner },
                            { fromBlock: block0, toBlock: txObject.receipt.blockNumber })),
                        Extensions.getEventsPromise(owned.OnOwnerChanged(
                            { previousOwner: owner2 },
                            { fromBlock: block0, toBlock: txObject.receipt.blockNumber }))
                    ]);
            })
            .then(events => {
                assert.equal(events[0].length, 1, "should have had only 1 from first account");
                assert.equal(events[1].length, 1, "should have had only 1 from second account");
                assert.equal(
                    events[0][0].args.previousOwner, owner,
                    "should be the first account");
                assert.equal(
                    events[0][0].args.newOwner, owner2,
                    "should be the second account");
                assert.equal(
                    events[1][0].args.previousOwner, owner2,
                    "should be the second account");
                assert.equal(
                    events[1][0].args.newOwner, owner,
                    "should be the first account");
                return owned.setOwner(owner2, { from: owner })
            })
            .then(txObject => Extensions.getEventsPromise(owned.OnOwnerChanged(
                    { previousOwner: owner },
                    { fromBlock: block0, toBlock: txObject.receipt.blockNumber }),
                2))
            .then(events => {
                assert.equal(events.length, 2, "should have received 2 events for this previous account");
                assert.equal(
                    events[0].args.previousOwner, owner,
                    "should be the first account");
                assert.equal(
                    events[0].args.newOwner, owner2,
                    "should be the second account");
                assert.equal(
                    events[1].args.previousOwner, owner,
                    "should be the first account");
                assert.equal(
                    events[1].args.newOwner, owner2,
                    "should be the second account");
                return Extensions.getEventsPromise(owned.OnOwnerChanged(
                        { newOwner: owner }, // newOwner is NOT indexed
                        { fromBlock: block0, toBlock: events[1].blockNumber }),
                    3);
            })
            .then(events => assert.equal(
                events.length, 3, "should have received all events as newOwner is not indexed"));

    });

});
