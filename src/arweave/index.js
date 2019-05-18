import Arweave from 'arweave/web';
import EventEmitter from 'lite-ee';

export default class ArweaveClient extends EventEmitter {
    constructor (loginInputSelector, {versionNumber, ...options} = {}) {
        super();
        this.arweave = Arweave.init({host: 'arweave.net', port: 443, protocol: 'https', ...options});
        this.versionNumber = versionNumber || '0.0.1';

        document.querySelector(loginInputSelector).addEventListener('change', this.login.bind(this));
    }

    login (evt) {
        const files = evt.target.files;
        var fr = new FileReader()
        fr.onload = (ev) => {
            try {
                this.wallet = JSON.parse(ev.target.result)
    
                this.arweave.wallets.jwkToAddress(this.wallet).then((address) => {
                    this.address = address;
                    this.emit('login', address);
                });
            } catch (err) {
                console.log('test', err.message);
                this.emit('error', err);
            }
        }
        fr.readAsText(files[0])
    }

    async postFile (buffer, key) {
        // 10. **Encrypt** the Combined File
        const encryptedBuffer = await this.arweave.crypto.encrypt(buffer, key);
        
        // 11. Sign the encrypted file as tx
        console.log(encryptedBuffer);
        const transaction = await this.arweave.createTransaction({
            data: encryptedBuffer
        }, this.wallet);
        await this.arweave.transactions.sign(transaction, this.wallet);

        // 12. Dispatch Arweave tx
        const response = await this.arweave.transactions.post(transaction);

        return [transaction, response];
    }
}