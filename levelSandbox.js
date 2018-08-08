/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);


module.exports = {

    // Add data to levelDB with key/value pair
    addLevelDBData: function (key, value) {
        console.log("Adding key:", key, ", and value: ", value);
        return db.put(key, JSON.stringify(value));
    },

    // Get data from levelDB with key
    getLevelDBData: function (key) {
        return db.get(key).then(value => JSON.parse(value));
    }

};
