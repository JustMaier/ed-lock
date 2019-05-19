import ArweaveClient from './arweave';
import EthereumClient from './ethereum';
import {generateShards, generateQRCodes} from './workers';

class EdLock {
    constructor(){
        this.setState({
            loggedIn: false,
            configured: false,
            loadingMessage: null,
            errorMessage: null,
            file: null,
            config: {
                unlockTime: new Date(new Date().toJSON().split('T')[0]),
                payout: 1,
                shards: 10,
                threshold: 7
            },
            results: []
        })

        this.arweaveClient = new ArweaveClient('#login-file').on('login', (address) => this.setState({loggedIn: true}))
                                                             .on('error', (err) => this.setState({errorMessage: err.message}));
        
        this.ethereumClient = new EthereumClient({
            rpcUrl: process.env.RPC_URL,
            contractAbiString: process.env.CONTRACT_ABI, // TODO - add the contract ABI
            contractAddress: process.env.CONTRACT_ADDRESS // TODO - add the contract address
        });

        document.querySelector('[data-section="input"]').addEventListener('submit', this.loadConfig.bind(this), false);
        document.querySelector('[name="file"]').addEventListener('change', this.setFile.bind(this));
        document.querySelector('#fund').addEventListener('click', this.fundIt.bind(this));
    }

    renderState(){
        // Render active section
        const activeSection = this.state.errorMessage ? 'error' :
                            this.state.loadingMessage ? 'loading':
                            !this.state.loggedIn ? 'login' :
                            !this.state.file ? 'file' :
                            !this.state.configured ? 'input' :
                            'results';

        const active = document.querySelector('[data-section].active');
        if(active) active.classList.remove('active');
        document.querySelector(`[data-section="${activeSection}"]`).classList.add('active');

        // Bind data
        document.querySelectorAll('[data-bind]').forEach(el => el.innerHTML = this.state[el.getAttribute('data-bind')]);
        console.log(activeSection, active, document.querySelector(`[data-section="${activeSection}"]`));

        // Bind input
        if(activeSection === 'input'){
            document.querySelectorAll('[data-section="input"] [type="number"]').forEach(x=>x.value = this.state.config[x.name]);
            const unlockTimeField = document.querySelector('[name="unlockTime"]');
            unlockTimeField.valueAsNumber = this.state.config.unlockTime;
            unlockTimeField.min = new Date().toISOString().split('T')[0]+'T00:00:00';
        }

        // Render results
        if(activeSection === 'results'){
            const qrContainer = document.querySelector('#qrCodes');
            this.state.results.forEach(svg => qrContainer.append(svg));
        }
    }
    
    setState(state = null){
        console.log(state);
        if(!state) return;
        this.state = {...this.state, ...state};

        this.renderState();
    }

    setFile(e) {
        const files = e.target.files;
        if(files[0].size/1024/1024 > 1.8){
            alert('File is too large');
            return;
        }

        var fr = new FileReader()
        fr.onload = (ev) => {
            try {
                this.setState({file: ev.target.result});
            } catch (err) {
                console.log('test', err.message);
                this.emit('error', err);
            }
        }
        fr.readAsArrayBuffer(files[0])
    }

    loadConfig(e){
        e.preventDefault();
        const config = {};
        e.target.querySelectorAll('[type="number"]').forEach(x => config[x.name] = parseInt(x.value, 10));
        e.target.querySelectorAll('[type="datetime-local"]').forEach(x=>config[x.name] = x.valueAsNumber);
        this.setState({config, configured: true, loadingMessage: 'Starting deploy'});
        this.deployIt();
    }

    loading(message){
        this.setState({loadingMessage: message});
    }

    async deployIt(){
        // Generate Master Encryption Key
        this.loading('Generating master key')
        const masterAcct = this.ethereumClient.createAccount();

        // Generate Ether Keypair
        this.loading('Generating honeypot')
        const honeypotAcct = this.ethereumClient.createAccount();
        
        // Generate Shard the master key
        this.loading('Generating shards');
        console.log(masterAcct.privateKey);
        const {config} = this.state;
        const shards = await generateShards(config.shards, config.threshold, masterAcct.privateKey);
        
        // Generate Burner Wallets
        // Combine Burner Wallets + Shards pairs
        this.loading('Generating shard holder burner wallets')
        const burnerCombos = shards.map(shard => {
            const acct = this.ethereumClient.createAccount();
            return {
                shard,
                acct
            };
        });
        this.setState({results: await generateQRCodes(burnerCombos.map(x=>x.shard+':'+x.acct.privateKey))});

        // Deploy Smart Contract with Params
        this.loading('Deploying contract')
        this.state.contractAddrs = await this.ethereumClient.deploy({
            ... this.state.config,
            honeypotAddr: honeypotAcct.address,
            payoutAddrs: burnerCombos.map(x=>x.acct.address)
        });

        this.buryIt(masterAcct, honeypotAcct);
    }

    async buryIt(masterAcct, honeypotAcct){
        // Generate combination of key+file
        this.loading('Packing lockbox')
        const textEncoder = new TextEncoder();
        const honeypotKeyBuffer = textEncoder.encode(honeypotAcct.privateKey);
        const contractAddressBuffer = textEncoder.encode(this.state.contractAddrs);
        const lockboxBuffer = new Int8Array(honeypotKeyBuffer.length + contractAddressBuffer.length + this.state.file.byteLength);
        lockboxBuffer.set(honeypotKeyBuffer);
        lockboxBuffer.set(contractAddressBuffer, honeypotKeyBuffer.length);
        lockboxBuffer.set(this.state.file, honeypotKeyBuffer.length + contractAddressBuffer.length);
        
        // 10. **Encrypt** the Combined File
        // 11. Sign the encrypted file as tx
        // 12. Dispatch Arweave tx
        this.loading('Burying in Arweave')
        const [transaction, response] = await this.arweaveClient.postFile(lockboxBuffer, masterAcct.privateKey);
        this.state.arweaveId = transaction.id;
        
        // Done
        this.loading(null)
    }

    async fundIt() {
        this.ethereumClient.fund(this.state.contractAddress, this.state.config.payout, this.state.arweaveId, () => {
            document.querySelector('#fund').classList.add('hidden');
            document.querySelector('#paid').classList.remove('hidden');
        });
    }
}
new EdLock();