Promise = require("bluebird");
const Incrementor = artifacts.require("./Incrementor.sol");
const sequentialPromise = require("../utils/sequentialPromise.js");
const getEventsPromise = require("../utils/getEventsPromise.js");
web3.eth.makeSureAreUnlocked = require("../utils/makeSureAreUnlocked.js");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");

if (typeof web3.eth.getBlockPromise !== "function") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

contract('Incrementor', function(accounts) {

    let owner, incrementor, block0;

    before("should have proper accounts", function() {
        assert.isAtLeast(accounts.length, 1, "should have at least 1 account");
        owner = accounts[0];
        return web3.eth.makeSureAreUnlocked([ owner ]);
    });

    beforeEach("should deploy an incrementor", function() {
        return Incrementor.new({ from: owner })
            .then(created => incrementor = created)
            .then(() => web3.eth.getTransactionReceiptPromise(incrementor.transactionHash))
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
                assert.strictEqual(
                    receipt.logs[0].data,
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "should be 0 from constructor raw");
                const event0 = incrementor.LogValue().formatter(receipt.logs[0]);
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

                assert.strictEqual(txObject.receipt.logs.length, 1, "should have received 1 event");
                assert.strictEqual(
                    txObject.receipt.logs[0].data,
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "should be the increased value raw");
            });
    });

    it("should receive 2 events across blocks", function() {
        return sequentialPromise([
                () => incrementor.increaseValue({ from: owner }),
                () => incrementor.increaseValue({ from: owner })
            ])
            .then(txObjects => getEventsPromise(incrementor.LogValue(
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

    it("should receive all events for the instance", function() {
        return sequentialPromise([
                () => incrementor.increaseValue.sendTransaction({ from: owner }),
                () => incrementor.increaseValue({ from: owner })
            ])
            .then(txObjects => web3.eth.getTransactionReceiptPromise(incrementor.transactionHash)
                .then(deployReceipt => getEventsPromise(incrementor.LogValue(
                    {},
                    {
                        fromBlock: deployReceipt.blockNumber,
                        toBlock: txObjects[1].receipt.blockNumber
                    }),
                3)))
            .then(events => {
                assert.strictEqual(events.length, 3, "should have received those 3 events");
                assert.strictEqual(
                    events[0].args.value.toNumber(), 0,
                    "should be the increased value");
                assert.strictEqual(
                    events[1].args.value.toNumber(), 1,
                    "should be the increased value");
                assert.strictEqual(
                    events[2].args.value.toNumber(), 2,
                    "should be the increased value");
            });
    });

    it("should receive past events of all instances", function() {
        return getEventsPromise(
            web3.eth.filter({
                    topics: [ web3.sha3("LogValue(uint256)") ],
                    fromBlock: block0,
                    toBlock: "latest"
                }),
            10)
            .then(events => {
                assert.strictEqual(
                    events.length, 10,
                    "should have received all 10 events of this contract type");
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
                assert.strictEqual(
                    events[7].args.value.toNumber(), 1,
                    "should be the increased value");
                assert.strictEqual(
                    events[8].args.value.toNumber(), 2,
                    "should be the increased value");
                assert.strictEqual(
                    events[9].args.value.toNumber(), 0,
                    "should be the constructor value");
            });
    });

});
