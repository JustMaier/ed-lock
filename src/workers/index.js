export async function generateShards(shards, threshold, secret){
    return new Promise((resolve) => {
        const w = new Worker('./sharding.js');
        w.postMessage({shards, threshold, secret});
        w.onmessage = ({data}) => {
            w.terminate();
            resolve(data);
        }
    });
}

export async function generateQRCodes(codes){
    return new Promise((resolve) => {
        const w = new Worker('./qr.js');
        w.postMessage({codes});
        w.onmessage = ({data}) => {
            data = data.map(x => {
                const div = document.createElement('div');
                div.classList.add('svg');
                div.innerHTML = x;
                return div;
            });
            
            w.terminate();
            resolve(data);
        };
    });
}