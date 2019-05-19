import QRCode from 'qrcode-svg';

self.onmessage = ({data: {codes}}) => {
    const qrElements = codes.map(code => {
        return new QRCode({
            content: code,
            padding: 0,
            width: 185,
            height: 185,
            color: '#000',
            background: 'transparent'
        }).svg();
    });
    self.postMessage(qrElements);
}