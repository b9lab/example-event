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

contract('Owned', function(accounts) {

  // For the moment, these tests do not work with TestRPC.
  
  it("should receive the changed owner", function() {

    var owned = Owned.deployed();
    return owned.setOwner(accounts[1], { from: accounts[0] })
      .then(function (tx) {
        return getEventsPromise(owned.OnOwnerChanged(
          {},
          { fromBlock: 0, toBlock: "latest" }));
      })
      .then(function (events) {
        assert.equal(events.length, 1, "should have received 1 event");
        assert.equal(events[0].args.previousOwner, accounts[0], "should be the first account");
        assert.equal(events[0].args.newOwner, accounts[1], "should be the second account");
        return owned.setOwner(accounts[0], { from: accounts[1] });
      })
      .then(function (tx) {
        return Promise.all([
            getEventsPromise(owned.OnOwnerChanged(
              { previousOwner: accounts[0] },
              { fromBlock: 0, toBlock: "latest" })),
            getEventsPromise(owned.OnOwnerChanged(
              { previousOwner: accounts[1] },
              { fromBlock: 0, toBlock: "latest" }))
          ]);
      })
      .then(function (events) {
        assert.equal(events[0].length, 1, "should have had only 1 from first account");
        assert.equal(events[1].length, 1, "should have had only 1 from second account");
        assert.equal(events[0][0].args.previousOwner, accounts[0], "should be the first account");
        assert.equal(events[0][0].args.newOwner, accounts[1], "should be the second account");
        assert.equal(events[1][0].args.previousOwner, accounts[1], "should be the second account");
        assert.equal(events[1][0].args.newOwner, accounts[0], "should be the first account");
        return owned.setOwner(accounts[1], { from: accounts[0] })
      })
      .then(function (tx) {
        return getEventsPromise(owned.OnOwnerChanged(
            { previousOwner: accounts[0] },
            { fromBlock: 0, toBlock: "latest" }),
          2);        
      })
      .then(function (events) {
        assert.equal(events.length, 2, "should have received 2 events for this previous account");
        assert.equal(events[0].args.previousOwner, accounts[0], "should be the first account");
        assert.equal(events[0].args.newOwner, accounts[1], "should be the second account");
        assert.equal(events[1].args.previousOwner, accounts[0], "should be the first account");
        assert.equal(events[1].args.newOwner, accounts[1], "should be the second account");
        return getEventsPromise(owned.OnOwnerChanged(
            { newOwner: accounts[0] }, // newOwner is NOT indexed
            { fromBlock: 0, toBlock: "latest" }),
          1);
      })
      .then(function (events) {
        assert.equal(events.length, 3, "should have received all events as newOwner is not indexed");
      });

  });

});
