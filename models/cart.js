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
}