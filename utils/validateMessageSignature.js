const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');


module.exports = {

    // Add data to levelDB with key/value pair
    validateMessageSignature: function (message, address, signature) {
        console.log(message, address, signature)
        return bitcoinMessage.verify(message, address, signature)
    }

};
