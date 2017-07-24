var Presale;

window.App = {
  loadContract: function() {
     $.getJSON("./contracts/Presale.json", function(Presale_json) {
         console.log(Presale_json);
        Presale = TruffleContract( Presale_json );
        Presale.setProvider(window.web3.currentProvider);        
      });
  },
  start: function() {
    var self = this;
    self.loadContract();
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }
      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }
      accounts = accs;
      self.refreshContractInformation();
    });
  },

  refreshContractInformation: function(){
    var self = this;
    Presale.deployed().then(function(instance){
      return instance.rate.call();
    }).then(function(_rate) {
        console.log(_rate.toNumber());
    }).catch(function(e) {
      console.log(e);
    });
  },
};


window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }
  App.start();
});