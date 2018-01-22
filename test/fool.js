Promise = require("bluebird");
const Fool = artifacts.require("./Fool.sol");
const Sink = artifacts.require("./Sink.sol");
web3.eth.makeSureAreUnlocked = require("../utils/makeSureAreUnlocked.js");

if (typeof web3.eth.getBlockPromise !== "function") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

contract('Fool', function(accounts) {

    let owner, owner2, fool, sink;

    before("should have proper accounts", function() {
        assert.isAtLeast(accounts.length, 2, "should have at least 2 accounts");
        owner = accounts[0];
        owner2 = accounts[1];
        return web3.eth.makeSureAreUnlocked([ owner ]);
    });
    
    beforeEach("should deployed a new Fool and a new Sink", function() {
        return Fool.new({ from: owner })
            .then(created => fool = created)
            .then(() => Sink.new({ from: owner }))
            .then(created => sink = created);
    });

    it("should receive a single event when sending from fool to owner2", function() {
        return fool.sinkIt(owner2, { from: owner, value: 2 })
            .then(txObject => {
                assert.strictEqual(txObject.logs.length, 1);
                assert.strictEqual(txObject.logs[0].args.fool, owner);
                assert.strictEqual(txObject.logs[0].args.sink, owner2);
                assert.strictEqual(txObject.logs[0].args.amount.toNumber(), 2);
                
                assert.strictEqual(txObject.receipt.logs.length, 1);
                assert.strictEqual(txObject.receipt.logs[0].topics.length, 3, "should have 3 topics");
                assert.strictEqual(
                    txObject.receipt.logs[0].topics[0],
                    web3.sha3("LogFooled(address,address,uint256)"));
                assert.strictEqual(
                    txObject.receipt.logs[0].topics[1],
                    owner.replace("0x", "0x000000000000000000000000"));
                assert.strictEqual(
                    txObject.receipt.logs[0].topics[2],
                    owner2.replace("0x", "0x000000000000000000000000"));
                assert.strictEqual(
                    txObject.receipt.logs[0].data,
                    "0x0000000000000000000000000000000000000000000000000000000000000002");
            });
    });

    it("should receive a single event when sending to sink", function() {
        return sink.sendTransaction({ from: owner, value: 2, gas: 3000000 })
            .then(txObject => {
                assert.strictEqual(txObject.logs.length, 1);
                assert.strictEqual(txObject.logs[0].args.fool, owner);
                assert.strictEqual(txObject.logs[0].args.amount.toNumber(), 2);
                
                assert.strictEqual(txObject.receipt.logs.length, 1);
                assert.strictEqual(txObject.receipt.logs[0].topics.length, 2, "should have 2 topics");
                assert.strictEqual(
                    txObject.receipt.logs[0].topics[0],
                    web3.sha3("LogSunk(address,uint256)"));
                assert.strictEqual(
                    txObject.receipt.logs[0].topics[1],
                    owner.replace("0x", "0x000000000000000000000000"));
                assert.strictEqual(
                    txObject.receipt.logs[0].data,
                    "0x0000000000000000000000000000000000000000000000000000000000000002");
            });
    });

    it("should receive two events when sending from fool to sink", function() {
        return fool.sinkIt(sink.address, { from: owner, value: 2 })
            .then(txObject => {
                // Only 1 formatted event
                assert.strictEqual(txObject.logs.length, 1);
                assert.strictEqual(txObject.logs[0].event, "LogFooled");
                assert.strictEqual(txObject.logs[0].address, fool.address);
                assert.strictEqual(txObject.logs[0].args.fool, owner);
                assert.strictEqual(txObject.logs[0].args.sink, sink.address);
                assert.strictEqual(txObject.logs[0].args.amount.toNumber(), 2);
                
                // Notice how this one has 2 unformatted events
                assert.strictEqual(txObject.receipt.logs.length, 2);

                // First one is from Fool
                assert.strictEqual(txObject.receipt.logs[0].address, fool.address);
                assert.strictEqual(txObject.receipt.logs[0].topics.length, 3);
                assert.strictEqual(
                    txObject.receipt.logs[0].topics[0],
                    web3.sha3("LogFooled(address,address,uint256)"));
                assert.strictEqual(
                    txObject.receipt.logs[0].topics[1],
                    owner.replace("0x", "0x000000000000000000000000"));
                assert.strictEqual(
                    txObject.receipt.logs[0].topics[2],
                    sink.address.replace("0x", "0x000000000000000000000000"));
                assert.strictEqual(
                    txObject.receipt.logs[0].data,
                    "0x0000000000000000000000000000000000000000000000000000000000000002");


                // Second one is from Sink
                assert.strictEqual(txObject.receipt.logs[1].address, sink.address);
                assert.strictEqual(txObject.receipt.logs[1].topics.length, 2);
                assert.strictEqual(
                    txObject.receipt.logs[1].topics[0],
                    web3.sha3("LogSunk(address,uint256)"));
                assert.strictEqual(
                    txObject.receipt.logs[1].topics[1],
                    fool.address.replace("0x", "0x000000000000000000000000"));
                assert.strictEqual(
                    txObject.receipt.logs[0].data,
                    "0x0000000000000000000000000000000000000000000000000000000000000002");

                // Which can be formatted
                sink.LogSunk().formatter(txObject.receipt.logs[1]);
                assert.strictEqual(txObject.receipt.logs[1].event, "LogSunk");
                assert.strictEqual(txObject.receipt.logs[1].args.fool, fool.address);
                assert.strictEqual(txObject.receipt.logs[1].args.amount.toNumber(), 2);
            });
    });

});
