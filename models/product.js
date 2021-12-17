const mongodb = require('mongodb');

const getDb = require("../util/database").getDb;

class Product {
  constructor(title,price,imageUrl,description,id,userId){
    this.title = title;
    this.price = price;
    this.imageUrl = imageUrl;
    this.description = description;
    this._id = id ? new mongodb.ObjectId(id) : null;
    this.userId = userId;
  }

  save(){
    const db = getDb();
    let dbOperation;
    if(this._id){
      dbOperation = db.collection('products').updateOne({_id: this._id},{$set: this});
    } else{
      dbOperation = db.collection('products').insertOne(this);
    }
    return dbOperation;
  }

  static findById(prodId){
    const db = getDb();
    return db.collection('products').find({_id: new mongodb.ObjectId(prodId)}).next()
      .then(product =>{
        return product;
      })
      .catch(err=>{
        throw err;
      });
  }

  static fetchAll(){
    const db = getDb();
    return db.collection('products').find().toArray()
      .then(productsArray =>{
        return productsArray;
      })
      .catch(err=>{
        throw err;
      });
  }

  static deleteById(prodId){
    const db = getDb();
    return db.collection('products').deleteOne({_id: new mongodb.ObjectId(prodId)});
  }
}

module.exports = Product;