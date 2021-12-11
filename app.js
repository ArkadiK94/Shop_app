const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const errorController = require('./controllers/error');
const sequelize = require("./util/database");

const User = require("./models/user");
const Product = require("./models/product");
const Cart = require("./models/cart");
const CartItem = require("./models/cart-item");
const Order = require("./models/order");
const OrderItem = require("./models/order-item");


const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

let userData;


app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.use((req,res,next)=>{
  req.user = userData;
  next();
});
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(errorController.get404);

// user as an admin
User.hasMany(Product);
Product.belongsTo(User);

// user as an costumer
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, {through: CartItem});
Product.belongsToMany(Cart, {through: CartItem});

User.hasMany(Order);
Order.belongsTo(User);
Order.belongsToMany(Product, {through: OrderItem});
Product.belongsToMany(Order, {through: OrderItem});


// sequelize.sync({ force: true })
sequelize.sync()
  .then(()=>{
    return User.findByPk(1);
  })
  .then((user)=> {
    if(!user){
      return User.create({
        name: "FirstName LastName",
        email: "example@gmail.com"
      });
    }
    return user;
  })
  .then((user) => {
    userData = user;
    return userData.getCart();
  })
  .then((cart)=>{
    if(!cart){
      return userData.createCart();
    }
    return cart;
  })
  .then(()=>{
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });