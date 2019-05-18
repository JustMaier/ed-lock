import ArweaveClient from './arweave';
import EthereumClient from './ethereum';
import SSSS from 'ssss-js';
import QRCode from 'qrcode-svg';

class EdLock {
    constructor(){
        this.setState({
            address: null,
            loadingMessage: null,
            errorMessage: null,
            file: null,
            config: {
                lock: 0,
                payout: 1,
                shards: 3,
                threshold: 5
            },
            results: []
        })

        this.arweaveClient = new ArweaveClient('#login-file').on('login', (address) => this.setState({address}))
                                                             .on('error', (err) => this.setState({errorMessage: err.message}));
        
        this.ethereumClient = new EthereumClient({
            rpcUrl: process.env.RPC_URL,
            contractAbiString: process.env.CONTRACT_ABI, // TODO - add the contract ABI
            contractAddress: process.env.CONTRACT_ADDRESS // TODO - add the contract address
        });

        document.querySelector('[data-section="input"]').addEventListener('submit', this.loadConfig.bind(this), false);
        document.querySelector('[name="file"]').addEventListener('change', this.setFile.bind(this));
        document.querySelector('#deploy').addEventListener('click', this.deployContract.bind(this));
    }

    renderState(){
        // Render active section
        const activeSection = this.state.errorMessage ? 'error' :
                              this.state.loadingMessage ? 'loading':
                              !this.state.address ? 'login' :
                              !this.state.file ? 'file' :
                              !this.state.config.lock ? 'input' :
                              this.state.results.length > 0 ? 'results' :
                              'error';

        const active = document.querySelector('[data-section].active');
        if(active) active.classList.remove('active');
        document.querySelector(`[data-section="${activeSection}"]`).classList.add('active');

        // Bind data
        document.querySelectorAll('[data-bind]').forEach(el => el.innerHTML = this.state[el.getAttribute('data-bind')]);

        // Bind input
        if(activeSection === 'input')
            document.querySelectorAll('[data-section="input"] [type="number"]').forEach(x=>x.value = this.state.config[x.name]);

        // Render results
        if(activeSection === 'results'){
            const resultsContainer = document.querySelector('[data-section="results"]');
            this.state.results.forEach(svg => {
                resultsContainer.insertAdjacentHTML('beforeend', svg);
            });
        }
    }
    
    setState(state = null){
        console.log(state);
        if(!state) return;
        this.state = {...this.state, ...state};
        console.log(this.state.file);  

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
        this.setState({config});
        this.lockIt();
    }

    loading(message){
        this.setState({loadingMessage: message});
    }

    async lockIt(){
        // 7. Generate Master Encryption Key
        this.loading('Generating master key')
        const masterAcct = this.ethereumClient.createAccount();
        
        // 8. Generate Ether Keypair
        this.loading('Generating honeypot')
        const honeypotAcct = this.ethereumClient.createAccount();
        this.setState({honeypotPublicKey: honeypotAcct.address});
        
        // 9. Generate combination of key+file
        this.loading('Packing lockbox')
        const honeypotKeyBuffer = new TextEncoder().encode(honeypotAcct.privateKey);
        console.log(honeypotKeyBuffer.length, this.state.file.byteLength);
        const lockboxBuffer = new Int8Array(honeypotKeyBuffer.length + this.state.file.byteLength);
        lockboxBuffer.set(honeypotKeyBuffer);
        lockboxBuffer.set(this.state.file, honeypotKeyBuffer.length);
        
        // 10. **Encrypt** the Combined File
        // 11. Sign the encrypted file as tx
        // 12. Dispatch Arweave tx
        this.loading('Sending to Arweave')
        const [transaction, response] = await this.arweaveClient.postFile(lockboxBuffer, masterAcct.privateKey)
        
        // 13. Wait for *n* confs
        // TODO
        
        // 14. Generate SSSS Keys
        this.loading('Generating shards')
        const {config} = this.state;
        const shards = new SSSS(config.shards, config.threshold).split(masterAcct.privateKey, '');
        
        // 15. Generate Burner Wallets
        // 16. Combine Burner Wallets + Shards pairs
        this.loading('Generating shard holder burner wallets')
        const burnerCombos = shards.map(shard => {
            const acct = this.ethereumClient.createAccount();
            return acct.privateKey+':'+shard;
        });
        
        // 17. Gen QR codes
        this.loading('Generating shard QRs')
        const qrSVGs = burnerCombos.map(combo => {
            return new QRCode(combo).svg();
        });
        
        // 18. Display Print-Ready QR codes
        this.loading(null)
        this.setState({results: qrSVGs});
    }

    deployContract() {
        // 19. Deploy Smart Contract with Params
            // - Func 1, final reward
            // - Func 2, honeypot reward when message received (only once)
        this.ethereumClient.deploy({...this.state.config, honeypotPublicKey: this.state.honeypotPublicKey}, () => {
            document.querySelector('#deploy').classList.add('hidden');
        });
    }
}
new EdLock();