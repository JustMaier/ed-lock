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
        
        // 12. Dispatch Arweave tx
        let transaction = null;
        let successfulUpload = false;
        while(!successfulUpload){
            // 11. Sign the encrypted file as tx
            transaction = await this.arweave.createTransaction({
                data: encryptedBuffer
            }, this.wallet);
            transaction.addTag('App-Name', 'ed-lock');
            transaction.addTag('App-Version', '0.1.0');
            transaction.addTag('Unix-Time', new Date().getTime());
            await this.arweave.transactions.sign(transaction, this.wallet);
            
            console.log('Sending Arweave transaction');
            const response = await this.arweave.transactions.post(transaction);
            console.log('Arweave response', response);
            successfulUpload = response.status === 200;
        }

        return transaction;
    }
}