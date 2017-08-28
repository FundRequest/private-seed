/* global jQuery, Materialize */

(function($) {
    'use strict';

    var $document = $(document);

    var elements = {
        buttons: {
            $buy: $('#btnBuy'),
            $allow: $('#btnAllow')
        },
        $accountSelect: $('#accountSelect'),
        $amount: $('#amount'),
        $busy: $('#busy'),
        $personalStash: $('#personalStash'),
        $presaleSection: $('#presaleSection'),
        $fndCurrentRate: $('#fndCurrentRate'),
        $fndYourTokens: $('#fndYourTokens'),
        $fndTotalBackers: $('#fndTotalBackers'),
        $fndTotalRaised: $('#fndTotalRaised'),
        $targetAddress: $('#targetAddress'),
        $targetAddressLabel: $('#targetAddressLabel'),
        $whiteListArea: $('#whitelistarea')
    };

    function showLoader() {
        elements.$busy.show();
    }

    function hideLoader() {
        elements.$busy.hide();
    }

    function showPresaleSection() {
        elements.$presaleSection.show();
    }

    function hidePresaleSection() {
        elements.$presaleSection.show();
    }

    var presale = (function() {
        var presaleContract = {};

        var colors = {
            GREEN: 'green',
            BLUE: 'blue'
        };

        var ex = {
            accounts: [],
            selectedAccount: null,
            owner: null
        };

        function loadContract(_callback) {
            $.getJSON('./contracts/FundRequestPrivateSeed.json', function(Presale_json) {
                var presaleTruffleContract = TruffleContract(Presale_json);
                presaleTruffleContract.setProvider(window.web3.currentProvider);

                presaleTruffleContract.deployed().then(function(instance) {
                    presaleContract = instance;
                    _callback();
                });
            });
        }

        function allow() {
            showLoader();

            var _target = elements.$targetAddress.val();
            var _from = ex.selectedAccount;

            presaleContract.allow(
                _target, {from: _from}
            ).then(function() {
                Materialize.toast('Account submitted to the whitelist', 4000, colors.BLUE);
                hideLoader();
            }).catch(function(err) {
                Materialize.toast('Whitelisting failed.', 4000);
                console.log(err);
                hideLoader();
            });
        }

        function buy() {
            var chosenAmount = elements.$amount.val();
            var targetAddress = elements.$targetAddress.val();
            var errorMessage = '';

            if (document.getElementById('filled-in-box').checked === false) {
                errorMessage = 'Please accept the Terms and Conditions.';
            } else if (typeof targetAddress === 'undefined' || targetAddress === '') {
                errorMessage = 'Please select an account first.';
            } else if (typeof chosenAmount === 'undefined' || chosenAmount === '') {
                errorMessage = 'Please select an amount first.';
            } else if (typeof chosenAmount === 'undefined' || chosenAmount < 25) {
                errorMessage = 'Private seed requires a minimum amount of 25 ETH.';
            }

            if (errorMessage !== '') {
                Materialize.toast(errorMessage, 4000, colors.BLUE);
                return;
            }

            presaleContract.allowed.call(ex.selectedAccount).then(function(result) {
                if (result === true) {
                    showLoader();
                    Materialize.toast('Please wait while the transaction is being validated...', 2000, colors.BLUE);

                    return presaleContract.buyTokens(targetAddress, {
                        from: ex.selectedAccount,
                        value: web3.toWei(chosenAmount),
                        gas: 210000
                    });
                } else {
                    throw new Error('Unable to fund from this address because it is not whitelisted.');
                }
            }).then(function(result) {
                var txHash = result.tx;
                var $link = $(document.createElement('a'))
                    .attr('href', 'https://etherscan.io/tx/' + txHash)
                    .attr('taget', '_blank')
                    .attr('class', 'yellow-text toast-action')
                    .html('View on EtherScan&nbsp;&nbsp;&nbsp;');
                var $toastContent = $(document.createElement('span'))
                    .text('Funding submitted to the Ethereum blockchain')
                    .add($link);

                Materialize.toast($toastContent, 8000, colors.GREEN);
                updateTokens(ex.selectedAccount);
                elements.$personalStash.show();

                hideLoader();
            }).catch(function(err) {
                console.log('Error during BUY: ', err);
                Materialize.toast('Something went wrong while trying fund. Please check if you\'re whitelisted.', 4000);

                hideLoader();
            });
        }

        function accountsAreInvalid(err, accounts) {
            if (err !== null) {
                Materialize.toast('There was an error fetching your accounts.', 4000);
                return true;
            }
            if (accounts.length === 0) {
                Materialize.toast('Couldn\'t get any accounts! Please check our your Ethereum client.', 4000, colors.BLUE);
                return true;
            }
            return false;
        }

        function fillAccounts(accounts) {
            ex.accounts = accounts;

            $.each(ex.accounts, function(i, item) {
                var option = document.createElement('option');
                option.text = item;
                option.className = 'dropdown-content';

                elements.$accountSelect.append(option);
            });

            updateTokens(ex.accounts[0]);

            elements.$accountSelect.material_select();
            elements.$accountSelect.on('change', function() {
                ex.selectedAccount = $('option:selected', elements.$accountSelect).first().text();
                elements.$targetAddress.val(ex.selectedAccount);
                elements.$targetAddressLabel.html(ex.selectedAccount);

                updateTokens(ex.selectedAccount);

                if (ex.selectedAccount === ex.owner) {
                    elements.$whiteListArea.show();
                }
                Materialize.updateTextFields();
                elements.$personalStash.show();
            });
        }

        function updateTokens(address) {
            presaleContract.balanceOf.call(address).then(function(_tokens) {
                elements.$fndYourTokens.html(web3.fromWei(_tokens.toNumber()));
            }).catch(function() {
                Materialize.toast('Please check your settings. The presale is not deployed on your current network.', 4000);
                hidePresaleSection();
            });
        }

        var refreshContractInformation = function() {
            presaleContract.rate.call().then(function(_rate) {
                elements.$fndCurrentRate.html(_rate.toNumber());
                return presaleContract.weiRaised.call();
            }).then(function(_wei) {
                elements.$fndTotalRaised.html(web3.fromWei(_wei.toNumber()) + ' ETH');
                return presaleContract.investorCount.call();
            }).then(function(_investorCount) {
                elements.$fndTotalBackers.html(_investorCount.toNumber());
                return presaleContract.owner.call();
            }).then(function(_owner) {
                ex.owner = _owner;
            }).catch(function() {
                Materialize.toast('Please check your settings. The presale is not deployed on your current network.', 4000);
                hidePresaleSection();
            });

            setTimeout(refreshContractInformation, 20000);
        };

        var start = function() {
            web3.eth.getAccounts(function(err, accounts) {
                if (accountsAreInvalid(err, accounts)) {
                    return;
                }

                fillAccounts(accounts);
                refreshContractInformation();
            });
        };

        var init = function() {
            disableButton(elements.buttons.$buy);
            elements.buttons.$buy.on('click', buy);
            elements.buttons.$allow.on('click', allow);

            loadContract(start);
        };

        return {
            init: init
        };
    })();

    $(function() {
        var buyEnabled = false;

        // Checking if Web3 has been injected by the browser (Mist/MetaMask)
        if (typeof web3 !== 'undefined') {
            window.web3 = new Web3(web3.currentProvider);
            showPresaleSection();
        }

        $document.on('click', '#filled-in-box', function() {
            if (buyEnabled === false) {
                enableButton(elements.buttons.$buy);
                buyEnabled = true;
            }
            else {
                disableButton(elements.buttons.$buy);
                buyEnabled = false;
            }
        });

        presale.init();
    });

    function enableButton($button) {
        $button.removeClass('custom_btn').addClass('custom_teal');
    }

    function disableButton($button) {
        $button.removeClass('custom_teal').addClass('custom_btn');
    }

    // uncomment rule below when need for exposing the object globally
    // window.presale = presale;
})(jQuery);