import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import axios from 'axios';

const currency = 'INR';
const deliveryCharge = 10;

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_BASE_URL = 'https://sandbox.cashfree.com'; // Use production URL in prod

// Placing orders using COD
const placeOrder = async (req, res) => {
  try {
    const { token, items, address } = req.body;

    const user = await userModel.findOne({ token });
    if (!user) return res.json({ success: false, message: "User not found" });

    // Fetch full product info
    let productDetails = await Promise.all(
      Object.keys(items).map(async (itemId) => {
        const product = await productModel.findById(itemId);
        return {
          productId: itemId,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity: items[itemId],
        };
      })
    );

    const order = new orderModel({
      userId: user._id,
      items: productDetails,
      amount: productDetails.reduce((sum, item) => sum + item.price * item.quantity, 0),
      address,
      status: "Processing",
      payment: false,
      paymentMethod: "COD",
      date: Date.now(),
    });

    await order.save();

    // clear cart after order
    await userModel.findByIdAndUpdate(user._id, { cartData: {} });

    res.json({ success: true, message: "Order Placed Successfully" });
  } catch (error) {
    console.log("Error placing COD order:", error);
    res.json({ success: false, message: error.message });
  }
};

// Placing order using Cashfree
const placeOrderCashfree = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;
    const { origin } = req.headers;

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "Cashfree",
      payment: false,
      date: Date.now()
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    // Step 1: Create order on Cashfree
    const response = await axios.post(
      `${CASHFREE_BASE_URL}/pg/orders`,
      {
        order_id: newOrder._id.toString(),
        order_amount: amount,
        order_currency: currency,
        customer_details: {
          customer_id: userId.toString(),
        },
        order_meta: {
          return_url: `${origin}/verify-cashfree?order_id={order_id}`
        }
      },
      {
        headers: {
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const sessionId = response.data.payment_session_id;

    res.json({
      success: true,
      payment_session_id: sessionId,
      order_id: newOrder._id
    });
  } catch (error) {
    console.log(error.response?.data || error.message);
    res.json({ success: false, message: 'Cashfree order creation failed' });
  }
};

// Verifying Cashfree Payment
const verifyCashfree = async (req, res) => {
  try {
    const { orderId, userId, success } = req.body;

    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      res.json({ success: true, message: "Payment Successful" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Admin: All Orders
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// User Orders
const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await orderModel.find({ userId });
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Admin: Update Status
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({ success: true, message: 'Status Updated' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  placeOrder,
  placeOrderCashfree,
  verifyCashfree,
  allOrders,
  userOrders,
  updateStatus
};
