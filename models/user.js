const mongodb = require('mongodb');

const getDb = require('../util/database').getDb;

const ObjectId = mongodb.ObjectId;
class User{
  constructor(username, email, cart, id){
    this.username = username;
    this.email = email;
    this.cart = cart;
    this._id = id;
  }

  save(){
    const db = getDb();
    return db.collection('users').insertOne(this);
  }

  addToCart(product){
    let updatedCart;
    let productInCartIndex = -1;
    if(!this.cart){
      updatedCart = {items:[]};
    } else {
      updatedCart = {items:[...this.cart.items]};
      productInCartIndex = updatedCart.items.findIndex(item =>{
        return product._id.toString() === item.prodId.toString();
      });
    }
    let newQuantity = 1;
    if(productInCartIndex >= 0){
      newQuantity = updatedCart.items[productInCartIndex].quantity + 1;
      updatedCart.items[productInCartIndex].quantity = newQuantity;
    } else {
      updatedCart.items.push({prodId: product._id, quantity: newQuantity});
    }
    const db = getDb();
    return db.collection('users').updateOne({_id: ObjectId(this._id)},{$set:{cart: updatedCart}});
  }

  getCart(){
    const productIds = this.cart.items.map(item=>{
      return item.prodId;
    });
    const db = getDb();
    return db.collection("products").find({_id: {$in: productIds}}).toArray()
      .then(products =>{
        return products.map(prod=>{
          return {
            ...prod, 
            quantity: this.cart.items.find(item=>{
              return item.prodId.toString() === prod._id.toString();
            }).quantity
          };
        });
      })
      .catch(err => console.log(err));
  }

  deleteFromCart(prodId){
    const items = this.cart.items.filter(item=>{
      return item.prodId.toString() !== prodId.toString();
    });
    const updatedCart = {items: items};
    const db = getDb();
    return db.collection('users').updateOne({_id: ObjectId(this._id)},{$set:{cart:updatedCart}});
  }

  addOrder(){
    const db = getDb();
    return this.getCart()
    .then(products=>{
      const order = {
        items : products,
        user : {
          _id: ObjectId(this._id),
          username: this.username  
        }
      }
      return db.collection('orders').insertOne(order);
    })
    .then(()=>{
      this.cart.items = [];
      return db.collection('users').updateOne({_id: ObjectId(this._id)},{$set:{cart:{items:[]}}});
    })
    .catch(err=> console.log(err));
    
  }

  getOrders(){
    const db = getDb();
    return db.collection('orders').find({'user._id': ObjectId(this._id)}).toArray();
  }

  static findById(userId){
    const db = getDb();
    return db.collection('users').find({_id: new mongodb.ObjectId(userId)}).next()
      .then(user => {
        return user;
      })
      .catch(err => console.log(err));
  }
}

module.exports = User;