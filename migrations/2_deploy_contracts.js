module.exports = function(deployer) {
  deployer.deploy(Incrementor);
  deployer.deploy(Owned);
};
