const Sequelize = require("sequelize");

const sequelize = new Sequelize("node-shop-app","root","Aa$123456",{
    host: "localhost",
    dialect: "mysql"
});

module.exports = sequelize;
