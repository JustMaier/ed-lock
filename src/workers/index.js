import secrets from 'secrets.js-grempe';
import QRCode from 'qrcode-svg';

export async function generateShards(shards, threshold, secret){
    return new Promise((resolve) => {
        const shardStrings = secrets.share(secrets.str2hex(secret), shards, threshold);
        resolve(shardStrings)
    });
}

export async function generateQRCodes(codes){
    return new Promise((resolve) => {
        resolve(codes.map(code => {
            const div = document.createElement('div');
            div.classList.add('svg');
            div.innerHTML = new QRCode({
                content: code,
                padding: 0,
                width: 185,
                height: 185,
                color: '#000',
                ecl: 'L',
                background: 'transparent'
            }).svg();
            return div;
        }));
    });
}