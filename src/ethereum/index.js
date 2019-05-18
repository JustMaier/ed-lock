import Web3 from 'web3';

export default class EthereumClient {
    constructor({rpcUrl, contractAbiString, contractAddress} = {}){
        console.log('Connect ETH via', rpcUrl);
        console.log(contractAbiString);
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
        const contractAbi = JSON.parse(contractAbiString);
        this.contract = new this.web3.eth.Contract(contractAbi, contractAddress);
    }
    createAccount(){
        return this.web3.eth.accounts.create();
    }
    deploy({lock, shards, threshold, honeypotPublicKey}, cb = null){
        if(!cb) cb = () => {};
        // TODO - make the smart contract that handles this method
        this.contract.methods.createContract(lock, shards, threshold, honeypotPublicKey).send({
            value: this.web3.utils.toWei(payout)
        }, cb);
    }
}