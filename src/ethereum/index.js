import Web3 from 'web3';

const factoryAbi = [
    {
        "constant": true,
        "inputs": [],
        "name": "getDeployedChildContracts",
        "outputs": [
            {
                "name": "",
                "type": "address[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "unlockTime",
                "type": "uint256"
            },
            {
                "name": "honeypot",
                "type": "address"
            },
            {
                "name": "payoutAddrs",
                "type": "address[]"
            }
        ],
        "name": "createChildContract",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

export default class EthereumClient {
    constructor({contractAddress} = {}){
        window.addEventListener('load', ()=>{
            window.ethereum.enable().then(() => {
                this.web3 = new Web3(window.ethereum);
                this.contractFactory = new this.web3.eth.Contract(factoryAbi, contractAddress);
                this.web3.eth.getAccounts().then(x=>this.account = x[0]);
            });
        })
    }
    createAccount(){
        return this.web3.eth.accounts.create();
    }
    deploy({unlockTime, honeypotAddr, payoutAddrs}){
        console.log('deploy with ', {unlockTime, honeypotAddr, payoutAddrs});
        return new Promise(resolve => {
            this.contractFactory.methods.createChildContract(unlockTime, honeypotAddr, payoutAddrs).send({
                from: this.account
            }).on('transactionHash', (hash) => {
                console.log('transHash', hash)
            })
            .on('confirmation', (confirmationNumber, receipt) => {
                console.log('transConf', confirmationNumber, receipt)
                resolve(receipt.to);
            })
            .on('error', console.error);
        });
        
    }
    fund(contractAddress, payout){
        console.log('pay', payout, contractAddress);
        return new Promise(resolve => {
            this.web3.eth.sendTransaction({
                to: contractAddress,
                value: payout
            }, () => resolve());
        });
    }
}