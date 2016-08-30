var getEventsPromise = function (myFilter, count) {
  return new Promise(function (resolve, reject) {
    count = count ? count : 1;
    var results = [];
    myFilter.watch(function (error, result) {
      if (error) {
        reject(error);
      } else {
        count--;
        results.push(result);
      }
      if (count <= 0) {
        resolve(results);
        myFilter.stopWatching();
      }
    });
  });
};

contract('Incrementor', function(accounts) {

  it("should receive constructor event", function() {

    var incrementor = Incrementor.deployed();
    return getEventsPromise(incrementor.LogValue(
        {},
        { fromBlock: 0, toBlock: "latest" }))
      .then(function (events) {
        assert.equal(events.length, 1, "should have received 1 event");
        assert.equal(events[0].args.value.valueOf(), 0, "should be 0 from constructor");
      });

  });

  it("should receive next event", function() {

    var incrementor = Incrementor.deployed();
    var blockNumber = web3.eth.blockNumber;
    return incrementor.increaseValue({ from: accounts[0] })
      .then(function (tx) {
        return getEventsPromise(incrementor.LogValue(
          {},
          { fromBlock: blockNumber + 1, toBlock: "latest" }));
      })
      .then(function (events) {
        assert.equal(events.length, 1, "should have received 1 event");
        assert.equal(events[0].args.value.valueOf(), 1, "should be the increased value");
      });

  });

  it("should receive next 2 events", function() {

    var incrementor = Incrementor.deployed();
    var blockNumber = web3.eth.blockNumber;
    return incrementor.increaseValue({ from: accounts[0] })
      .then(function (tx) {
        return incrementor.increaseValue({ from: accounts[0] });
      })
      .then(function (tx) {
        return getEventsPromise(incrementor.LogValue(
            {},
            { fromBlock: blockNumber + 1, toBlock: "latest" }),
          2);
      })
      .then(function (events) {
        assert.equal(events.length, 2, "should have received those 2 events");
        assert.equal(events[0].args.value.valueOf(), 2, "should be the increased value");
        assert.equal(events[1].args.value.valueOf(), 3, "should be the increased value");
      });

  });

  it("should receive all past events", function() {

    var incrementor = Incrementor.deployed();
    return getEventsPromise(incrementor.LogValue(
          {},
          { fromBlock: 0, toBlock: "latest" }),
        4)
      .then(function (events) {
        assert.equal(events.length, 4, "should have received all 4 events");
        assert.equal(events[0].args.value.valueOf(), 0, "should be the constructor value");
        assert.equal(events[1].args.value.valueOf(), 1, "should be the increased value");
        assert.equal(events[2].args.value.valueOf(), 2, "should be the increased value");
        assert.equal(events[3].args.value.valueOf(), 3, "should be the increased value");
      });

  });

});
