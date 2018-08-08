/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const levelDb = require('./levelSandbox');
const persistentName = "chain";


/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
    constructor(data) {
        this.hash = "";
        this.height = 0;
        this.body = data;
        this.time = 0;
        this.previousBlockHash = "";
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/


class Blockchain {
    constructor() {
        let self = this;
        this.initBlockchain = levelDb
            .getLevelDBData(persistentName)
            // .then(() => this.initBlockchain.re)
            .catch(function (err) {
                //    check the error is NotFoundError
                console.log("error alalalallaallalalaalalalallaallalalaalalalallaallalala", Object.keys(err));
                return levelDb.addLevelDBData(persistentName, [])
                    .then(_ => {
                        console.log("Creating genesis");
                        let genesisBlock = new Block("First block in the chain - Genesis block");
                        return self._addBlock([], genesisBlock);
                    })
            })

            .catch(err => console.error("errors while init:", err));

    }

    _addBlock(chain, newBlock) {
        // Block height
        newBlock.height = chain.length;
        // UTC timestamp
        newBlock.time = new Date().getTime().toString().slice(0, -3);
        // previous block hash
        if (chain.length > 0) {
            newBlock.previousBlockHash = chain[chain.length - 1].hash;
        }
        // Block hash with SHA256 using newBlock and converting to a string
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        // Adding block object to chain
        chain.push(newBlock);
        return levelDb.addLevelDBData(persistentName, chain);
    }

    _validateBlock(block) {
        // get block hash
        let blockHash = block.hash;
        // remove block hash to test block integrity
        block.hash = '';
        // generate block hash
        let validBlockHash = SHA256(JSON.stringify(block)).toString();
        // Compare
        if (blockHash === validBlockHash) {
            block.hash = blockHash;
            return true;
        } else {
            console.log('Block #' + block.height + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
            block.hash = blockHash;
            return false;
        }
    }

    getChain() {
        return this.initBlockchain
            .then(_ => levelDb.getLevelDBData(persistentName))
            .catch(err => console.error("errors while init:", err));
    }

    // Add new block
    addBlock(newBlock) {
        console.log("this.initBlockchain:", this.initBlockchain);
        return this.getChain()
            .then(chain => this._addBlock(chain, newBlock))
            .catch(err => console.error("err while add a new block:", err))
    }

    // Get block height
    getBlockHeight() {
        return this.getChain()
            .then(chain => chain.length - 1);
    }

    // get block
    getBlock(blockHeight) {
        // return object as a single string
        return this.getChain()
            .then(chain => chain[blockHeight]);

    }

    // validate block
    validateBlockByBlockNumber(blockHeight) {
        // get block object
        return this.getChain()
            .then(chain => this._validateBlock(chain[blockHeight]))
    }

    validateChain() {
        return this.getChain()
            .then(chain => {
                console.log("All the chain:", chain);

                let errorLog = chain.reduce(function (acc, block, index) {
                    if (!this._validateBlock(block)) {
                        acc.push(index)
                    }

                    if ((index < chain.length - 1) && (chain[index].hash !== chain[index + 1].previousBlockHash)) {
                        console.log('Block #' + index + ' hash:' + chain[index].hash + '!=='
                            + 'Block #' + index + 1 + ' hash:' + chain[index + 1].previousBlockHash);
                        acc.push(index);
                    }
                    return acc;
                }.bind(this), []);

                if (errorLog.length > 0) {
                    console.log('Block errors = ' + errorLog.length);
                    console.log('Blocks: ' + errorLog);
                }
            })
    }

    walkChain() {
        return this.getChain()
            .then(chain => chain.map(block => console.log(block)))
    }
}

let node = new Blockchain();
let block1 = new Block("Block 0");
let block2 = new Block("Block 1");
let block3 = new Block("Block 2");
let block4 = new Block("Block 3");

node.walkChain().then();

// node.addBlock(block1)
//     .then(_ => node.addBlock(block2))
//     .then(_ => node.addBlock(block3))
//     .then(_ => node.addBlock(block4))
//     .then(_ => node.getBlockHeight())
//     .then(height => console.log("Blockchain height:", height))
//     .then(_ => node.getBlock(4))
//     .then(block => console.log("I got this block:", block))
//     .then(_ => node.validateBlockByBlockNumber(0))
//     .then(isvalid => console.log("valid block?", isvalid))
//     .then(_ => node.validateChain())
//     .catch(err => console.log(err));





