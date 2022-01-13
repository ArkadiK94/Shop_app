const mongoose = require('mongoose');

const Order = require("./order");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  }, 
  password: {
    type: String,
    required: true
  },
  cart: {
    items: [
      {
        productId: {type: Schema.Types.ObjectId, ref: "Product", required: true},
        quantity: {type: Number, required: true}
      }
    ]
  }
});

userSchema.methods.addToCart = function(product){
  updatedItems = [...this.cart.items];
  productInCartIndex = updatedItems.findIndex(item =>{
    return product._id.toString() === item.productId.toString();
  });
  
  let newQuantity = 1;
  if(productInCartIndex >= 0){
    newQuantity = updatedItems[productInCartIndex].quantity + 1;
    updatedItems[productInCartIndex].quantity = newQuantity;
  } else {
    updatedItems.push({productId: product._id, quantity: newQuantity});
  }
  const updatedCart = {
    items: updatedItems
  }
  this.cart = updatedCart;
  return this.save();
}

userSchema.methods.deleteFromCart = function(prodId){
  const items = this.cart.items.filter(item=>{
    return item.productId.toString() !== prodId.toString();
  });
  const updatedCart = {items: items};
  this.cart = updatedCart;
  return this.save();
}

userSchema.methods.getCart = function(){
  return this.populate("cart.items.productId")
  .then(user=>{
    return user.cart.items;
  })
  .catch(err => console.log(err));
}

userSchema.methods.addOrder = function(){
  return this.getCart()
    .then(products=>{
      let totalPrice = 0;
      const prodsArray = [];
      products.forEach(product=>{
        const newProd = {
          _id: product.productId._id,
          title: product.productId.title,
          price: product.productId.price,
          imageUrl: product.productId.imageUrl,
          quantity: product.quantity
        }
        prodsArray.push(newProd);
        totalPrice += +newProd.price * +newProd.quantity;
      })
      const order = new Order({
        items:[...prodsArray], 
        user:{
          _id:this._id, 
          email:this.email
        },
        totalPrice: totalPrice
      });
      return order.save() 
    })
    .then(()=>{
      this.cart.items = [];
      return this.save()
    })
    .catch(err => console.log(err));
}

userSchema.methods.getOrders = function(){
  return Order.find({"user._id": this._id});
}

module.exports = mongoose.model("User", userSchema);

