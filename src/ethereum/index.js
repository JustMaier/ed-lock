import Web3 from 'web3';

export default class EthereumClient {
    constructor({rpcUrl, contractAbiString, contractAddress} = {}){
        console.log('Connect ETH via', rpcUrl);
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
        const contractFactoryAbi = JSON.parse(contractAbiString);
        this.contractFactory = new this.web3.eth.Contract(contractFactoryAbi, contractAddress);
    }
    createAccount(){
        return this.web3.eth.accounts.create();
    }
    deploy({unlockTime, shards, threshold, honeypotAddr, payoutAddrs}){
        console.log('deploy with ', {unlockTime, shards, threshold, honeypotAddr, payoutAddrs});
        // TODO - make the smart contract that handles this method
        return 'address';
        // return this.contractFactory.methods.createContract(unlockTime, shards, threshold, honeypotAddr, payoutAddrs).call();
        
    }
    fund(contractAddress, payout, arweaveId, cb = null){
        if(!cb) cb = () => {};
        return true;
        const contract = new this.web3.eth.Contract(ABI, contractAddress);
        return contract.methods.fund(arweaveId).send({
            value: payout
        });
    }
}