const fs = require("fs");
const path = require("path");

const root = require("../util/path");

const pathToFile = path.join(
    root,
    "data",
    "cart.json"
);

module.exports = class Cart{
    static addProduct(id, productPrice){
        fs.readFile(pathToFile,(error,fileContent)=>{
            let cart = {products:[], totalPrice:0};
            if(!error){
                cart = JSON.parse(fileContent);
            }
            const existingProductIndex = cart.products.findIndex(product => product.id === id);
            const existingProduct = cart.products[existingProductIndex];
            if(existingProduct){
                const updatedProduct = {...existingProduct};
                updatedProduct.quantity += 1;
                cart.products = [...cart.products];
                cart.products[existingProductIndex] = updatedProduct; 
            }else{
                const newProduct = {id:id, quantity: 1};
                cart.products = [...cart.products, newProduct];
            }
            cart.totalPrice = cart.totalPrice + +productPrice;
            fs.writeFile(pathToFile, JSON.stringify(cart), (err)=>{
                console.log(err);
            });
        });
    }

    static getProducts(cb){
        fs.readFile(pathToFile,(err,fileContent)=>{
            if(err){
                return;
            }
            const cart = JSON.parse(fileContent);
            if(cart){
                cb(cart);
            } else{
                cb([]);
            }

        });
    }

    static deleteProduct(id,priceOfProduct){
        fs.readFile(pathToFile, (err,fileContent)=>{
            if(err){
                return;
            }
            const cart = JSON.parse(fileContent);
            if(!cart){
                return;
            }
            const itemToDelete = cart.products.find(prod=> prod.id === id);
            const itemQty = itemToDelete.quantity;
            const updatedCartProducts = cart.products.filter(prod=> prod.id !== id);
            const updatedTotalPrice = cart.totalPrice - itemQty*priceOfProduct;
            const updatedCart = {products:updatedCartProducts, totalPrice:updatedTotalPrice };
            fs.writeFile(pathToFile, JSON.stringify(updatedCart), (err)=>{
                console.log(err);
            });
        });
    }
}