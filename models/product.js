const mongodb = require('mongodb');

const getDb = require("../util/database").getDb;

class Product {
  constructor(title,price,imageUrl,description){
    this.title = title;
    this.price = price;
    this.imageUrl = imageUrl;
    this.description = description;
  }

  save(){
    const db = getDb();
    return db.collection('products').insertOne(this)
      .then(()=>{
        console.log("Success");
      })
      .catch(err=>{
        throw err;
      });
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

  static findAll(){
    const db = getDb();
    return db.collection('products').find().toArray()
      .then(productsArray =>{
        return productsArray;
      })
      .catch(err=>{
        throw err;
      });
  }
}

module.exports = Product;