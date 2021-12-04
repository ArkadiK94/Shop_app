const fs = require('fs');
const path = require('path');

const root = require("../util/path");
const Cart = require("../models/cart");

const pathToFile = path.join(
  root,
  'data',
  'products.json'
);

const getProductsFromFile = cb => {
  fs.readFile(pathToFile, (err, fileContent) => {
    if (err) {
      cb([]);
    } else {
      cb(JSON.parse(fileContent));
    }
  });
};

module.exports = class Product {
  constructor(title, imageUrl, description, price,id = null) {
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
    this.id = id;
  }

  save(cb) {
    getProductsFromFile(products => { 
      const sendProducts = [...products];
      if(this.id){
        const existingProductIndex = products.findIndex(product=> product.id === this.id);
        sendProducts[existingProductIndex] = {...this};
      } else {
        this.id = Math.random().toString();
        sendProducts.push(this);
      }
      fs.writeFile(pathToFile, JSON.stringify(sendProducts), err => {
        console.log(error);
      });
    });
  }

  static fetchAll(cb) {
    getProductsFromFile(cb);
  }

  static findById(id,cb) {
    getProductsFromFile(products=>{
			const product = products.find(prod => prod.id === id);
			cb(product);			
    });
  }

  static deleteById(id){
    getProductsFromFile(products=>{
			const productIndex = products.findIndex(prod => prod.id === id);
      const newProducts = [...products.slice(0,productIndex),...products.slice(productIndex+1)];
      const deletedProduct = products[productIndex];
      fs.writeFile(pathToFile, JSON.stringify(newProducts), err => {
        if(!err){
          Cart.deleteProduct(id,deletedProduct.price);
        }
      });
    });
  }
};
