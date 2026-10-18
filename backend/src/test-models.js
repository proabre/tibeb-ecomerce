import User from "../models/User.js";
import Shop from "../models/Cart.js";
import Product from "../models/Products.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Shipment from "../models/Shipment.js";
import Review from "../models/Review.js";

const models = {
  User,
  Shop,
  Product,
  Cart,
  Order,
  Payment,
  Shipment,
  Review,
};

for (const [name, model] of Object.entries(models)) {
  console.log(`${name}: ${model.modelName}`);
}

console.log("All marketplace models loaded successfully.");
