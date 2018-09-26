const express = require('express')
const bodyParser = require('body-parser')
const validateMessageSignature = require('./utils/validateMessageSignature').validateMessageSignature;
const domain = require('./domain');
const app = express()

app.use(bodyParser.json())

const chain = require('./simpleChain');
let blockchain = new chain.Blockchain();

app.get('/', (req, res) => res.send('Hello World!'))

app.post('/block', function (req, res){
    const address = req.body.address;
    const starRow = req.body.star;
    let start = {};
    if (!address) {
        res.status(400).send("Provide an address");
        return;
    }
    try{
        star = domain.encodeStar(starRow);
    } catch(err) {
        res.status(400).send(err.message);
        return;
    }
    blockchain.addBlock(new chain.Block({...star, address}))
        .then(newBlock => res.send(newBlock))
        .catch(err => res.status(500).send("ERR: " + err));
})

app.get('/block/:height', function (req, res) {
    const height = req.params.height;
    blockchain.getChain()
               .then(chain => chain.filter(block =>block.height === height))
               .then(blocks => blocks.map(block => domain.decodeStar(block.body.star)))
               .then(filterBlocks => res.json(filterBlocks))
               .catch(err => res.send("ERR: " + err));
})

app.get('/stars/address::address', function (req, res) {
    const address = req.params.address;
    blockchain.getChain()
               .then(chain => chain.filter(block =>((block||{}).body || {}).address === address))
               .then(blocks => blocks.map(block => domain.decodeStar(block.body.star)))
               .then(filterBlocks => res.json(filterBlocks))
               .catch(err => res.send("ERR: " + err));
})

app.get('/stars/hash::hash', function (req, res) {
    const hash = req.params.hash;
    blockchain.getChain()
               .then(chain => chain.filter(block => block.hash === hash))
               .then(blocks => blocks.map(block => domain.decodeStar(block.body.star)))
               .then(filterBlocks => res.json(filterBlocks))
               .catch(err => res.send("ERR: " + err));
})

var tempAddresses = {};

app.post('/requestValidation', function (req, res) {
    const address = req.body.address;
    if (!address) {
        res.status(400).send("Provide an address");
        return;
    }
    const timeStamp = Date.now();
    const message = `${address}:${timeStamp}:starRegistry`;
    tempAddresses[address] = {
                        "address" : address,
                        "requestTimeStamp" : timeStamp,
                        "message" : message,
                        "validationWindow" : 300000
                        };

    res.json(tempAddresses[address]);

})

app.post("/message-signature/validate", function (req, res){
    const address = req.body.address;
    const signature = req.body.signature;
    const message = tempAddresses[address].message;
    if (!address) {
        res.status(400).send("Provide an address");
        return;
    }
    const validMessage = validateMessageSignature(message, address, signature);
    if (!validMessage) {
        res.status(400).send("Invalid message");
        return;
    }
    const requestTimeStamp = tempAddresses[address].requestTimeStamp;
    const validationWindow = tempAddresses[address].validationWindow;
    const now = Date.now();
    if ((now - requestTimeStamp) > validationWindow) {
        res.status(400).send("Expired validation window");
        return;
    }
    tempAddresses[address] = {
                          "registerStar": true,
                          "status": {
                            "address": address,
                            "requestTimeStamp": tempAddresses[address].requestTimeStamp,
                            "message": tempAddresses[address].message,
                            "validationWindow": tempAddresses[address].validationWindow,
                            "messageSignature": "valid"
                          }
                        }

    res.json(tempAddresses[address]);
})



app.listen(8000, () => console.log('Example app listening on port 8000!'))