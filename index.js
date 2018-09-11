const express = require('express')
const bodyParser = require('body-parser')
const app = express()

app.use(bodyParser.json())

const chain = require('./simpleChain');
let blockchain = new chain.Blockchain();

app.get('/', (req, res) => res.send('Hello World!'))

app.post('/block', function (req, res){
    const blockText = req.body.body;
    if (!blockText) {
        res.status(400).send("Empty body");
        return;
    }
    blockchain.addBlock(new chain.Block(blockText))
        .then(newBlock => res.send(newBlock))
        .catch(err => res.status(500).send("ERR: " + err));
})

app.get('/block/:blockNumber', function (req, res) {
    const blockNumber = req.params.blockNumber;
    blockchain.getBlock(blockNumber)
        .then(block => res.json(block))
        .catch(err => res.send("ERR: " + err));
})


app.listen(8000, () => console.log('Example app listening on port 3000!'))