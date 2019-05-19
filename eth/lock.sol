pragma solidity ^0.5.0;

contract LockFactory {
   Lock[] locks;
   
   function createChildContract(uint unlockTime, address payable honeypot, address payable[] memory payoutAddrs) public returns (Lock){
      Lock newLock = new Lock(unlockTime, honeypot, payoutAddrs);            
      locks.push(newLock);
      return newLock;
   }
   function getDeployedChildContracts() public view returns (Lock[] memory) {
      return locks;
   }
}

contract Lock {
    uint unlockTime;
    address payable[] payoutAddrs;
    address payable honeypot;
    uint pot;

    constructor 
        (uint _unlockTime, address payable _honeypot, address payable[] memory _payoutAddrs) public {
        unlockTime = _unlockTime;
        payoutAddrs =_payoutAddrs;
        honeypot = _honeypot;
    }

    function () external payable {
        pot += msg.value;
    }
    
    function unlock() public payable {
        require(now>unlockTime);
        uint i;
        uint share = (pot / payoutAddrs.length);
        for(i = 0; i<payoutAddrs.length; i++) {
            address payable recipient = payoutAddrs[i];
            recipient.transfer(share);
        }
    }

}