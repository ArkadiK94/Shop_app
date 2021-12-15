const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
    MongoClient.connect('mongodb+srv://ArkadiK:Arkadi$29081994@nodeapp.aoeo9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority')
        .then(client=>{
            _db = client.db();
            callback();
        })
        .catch(err=> {
            throw err;
        });    
}

const getDb = ()=> {
    if(_db){
        return _db;
    }
    throw "NO database found!";
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;

