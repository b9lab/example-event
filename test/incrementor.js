var Incrementor = artifacts.require("./Incrementor.sol");

Extensions = require("../utils/extensions.js");
Extensions.init(web3, assert);


contract('Incrementor', function(accounts) {

    var owner, incrementor, block0;

    before("should have proper accounts", function() {
        assert.isAtLeast(accounts.length, 1, "should have at least 1 account");
        owner = accounts[0];
        return Extensions.makeSureAreUnlocked([ owner ]);
    });

    beforeEach("should deploy an incrementor", function() {
        return Incrementor.new({ from: owner })
            .then(created => {
                incrementor = created;
                return web3.eth.getTransactionReceiptPromise(created.transactionHash);
            })
            .then(receipt => {
                if (typeof block0 === "undefined") {
                    block0 = receipt.blockNumber;
                }
            });
    });

    it("should receive constructor event", function() {
        return web3.eth.getTransactionReceiptPromise(incrementor.transactionHash)
            .then(receipt => {
                assert.strictEqual(receipt.logs.length, 1, "should have received 1 event");
                assert.strictEqual(
                    receipt.logs[0].topics[0],
                    web3.sha3("LogValue(uint256)"),
                    "should be the hash of the event");
                var event0 = incrementor.LogValue().formatter(receipt.logs[0]);
                assert.strictEqual(
                    event0.args.value.toNumber(), 0,
                    "should be 0 from constructor");
            });
    });

    it("should receive next event", function() {
        return incrementor.increaseValue({ from: owner })
            .then(txObject => {
                assert.strictEqual(txObject.logs.length, 1, "should have received 1 event");
                assert.strictEqual(
                    txObject.logs[0].args.value.toNumber(), 1,
                    "should be the increased value");
            });
    });

    it("should receive 2 events across blocks", function() {
        return Promise.all([
                incrementor.increaseValue({ from: owner }),
                incrementor.increaseValue({ from: owner })
            ])
            .then(txObjects => Extensions.getEventsPromise(incrementor.LogValue(
                    {},
                    {
                        fromBlock: txObjects[0].receipt.blockNumber,
                        toBlock: txObjects[1].receipt.blockNumber
                    }),
                2
            ))
            .then(events => {
                assert.strictEqual(events.length, 2, "should have received those 2 events");
                assert.strictEqual(
                    events[0].args.value.toNumber(), 1,
                    "should be the increased value");
                assert.strictEqual(
                    events[1].args.value.toNumber(), 2,
                    "should be the increased value");
            });

    });

    it("should receive past events of all instances", function() {
        return Extensions.getEventsPromise(web3.eth.filter(
                    {
                        topics: [ web3.sha3("LogValue(uint256)") ],
                        fromBlock: block0,
                        toBlock: "latest"
                    }),
                7)
            .then(events => {
                assert.strictEqual(
                    events.length, 7,
                    "should have received all 7 events of this contract type");
                events = events.map(element => incrementor.LogValue().formatter(element));
                assert.strictEqual(
                    events[0].args.value.toNumber(), 0,
                    "should be the constructor value");
                assert.strictEqual(
                    events[1].args.value.toNumber(), 0,
                    "should be the constructor value");
                assert.strictEqual(
                    events[2].args.value.toNumber(), 1,
                    "should be the increased value");
                assert.strictEqual(
                    events[3].args.value.toNumber(), 0,
                    "should be the constructor value");
                assert.strictEqual(
                    events[4].args.value.toNumber(), 1,
                    "should be the increased value");
                assert.strictEqual(
                    events[5].args.value.toNumber(), 2,
                    "should be the increased value");
                assert.strictEqual(
                    events[6].args.value.toNumber(), 0,
                    "should be the constructor value");
            });
    });

});
