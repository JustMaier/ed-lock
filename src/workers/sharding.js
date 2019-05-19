import secrets from 'secrets.js-grempe';

self.onmessage = ({data: {shards, threshold, secret}}) => {
    const shardStrings = secrets.share(secrets.str2hex(secret), shards, threshold);
    self.postMessage(shardStrings);
}