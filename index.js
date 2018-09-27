const express = require('express')
const bodyParser = require('body-parser')
const validateMessageSignature = require('./utils/validateMessageSignature').validateMessageSignature;
const domain = require('./domain');
const app = express()

app.use(bodyParser.json())

const chain = require('./simpleChain');
let blockchain = new chain.Blockchain();

app.get('/', (req, res) => res.send('Hello World!'))

var tempAddresses = {};

app.post('/block', function (req, res){
    const address = req.body.address;
    const starRow = req.body.star;
    let start = {};
    if (!address) {
        res.status(400).send("Provide an address");
        return;
    }
    if (!tempAddresses[address]) {
        res.status(401).send("You are not validated");
        return;
    }

    if (!tempAddresses[address].registerStar || tempAddresses[address].registerStar === false) {
            res.status(401).send("You are not validated");
            return;
    }

    delete tempAddresses[address];

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
    blockchain.getBlock(height)
               .then(block => domain.decodeStar(block.body.star))
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

app.post('/requestValidation', function (req, res) {
    const address = req.body.address;
    if (!address) {
        res.status(400).send("Provide an address");
        return;
    }

    const defaultValidationWindow = 30000;
    const timeStamp = Date.now();
    let tempMessage = {}

    if(tempAddresses[address]){
        ({requestTimeStamp, message, validationWindow} = tempAddresses[address]);
        const
        timeLeft = requestTimeStamp + validationWindow  - timeStamp ;

        if (timeLeft >= 0) {
            tempAddresses[address] = {
                          "address" : address,
                          "requestTimeStamp" : requestTimeStamp,
                          "message" : message,
                          "validationWindow" : timeLeft
                          };
        } else {
            tempAddresses[address] = {
                          "address" : address,
                          "requestTimeStamp" : timeStamp,
                          "message" : `${address}:${timeStamp}:starRegistry`,
                          "validationWindow" : defaultValidationWindow
                          };
        }
    } else {
        tempAddresses[address] = {
                      "address" : address,
                      "requestTimeStamp" : timeStamp,
                      "message" : `${address}:${timeStamp}:starRegistry`,
                      "validationWindow" : defaultValidationWindow
                      };
    }


    res.json(tempAddresses[address]);

})

app.post("/message-signature/validate", function (req, res){
    const address = req.body.address;
    if (!address) {
        res.status(400).send("Provide an address");
        return;
    }

    if (!tempAddresses[address]) {
        res.status(401).send("You are not validated");
        return;
    }


    const requestTimeStamp = tempAddresses[address].requestTimeStamp;
    const validationWindow = tempAddresses[address].validationWindow;
    const now = Date.now();

    if ((now - requestTimeStamp) > validationWindow) {
        res.status(403).send("Expired validation window");
        return;
    }

    const signature = req.body.signature;
    const message = tempAddresses[address].message;

    const validMessage = validateMessageSignature(message, address, signature);
    if (!validMessage) {
        res.status(400).send("Invalid message");
        return;
    }

    tempAddresses[address].registerStar = true;

    const timeLeft = requestTimeStamp + validationWindow  - now;
    res.json({
              "registerStar": true,
              "status": {
                "address": address,
                "requestTimeStamp": tempAddresses[address].requestTimeStamp,
                "message": tempAddresses[address].message,
                "validationWindow": timeLeft,
                "messageSignature": "valid"
              }
            });
})



app.listen(8000, () => console.log('Example app listening on port 8000!'))