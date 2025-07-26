import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import axios from 'axios';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_BASE_URL = 'https://sandbox.cashfree.com';
const currency = 'INR';

// Place order using Cashfree
const placeOrderCashfree = async (req, res) => {
  try {
    const { items, amount, address } = req.body;
    const token = req.headers.token;
    const { origin } = req.headers;

    if (!token) return res.json({ success: false, message: "Token missing" });
    const user = await userModel.findOne({ token });
    if (!user) return res.json({ success: false, message: "User not found" });

    const productDetails = await Promise.all(
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

    const newOrder = new orderModel({
      userId: user._id,
      items: productDetails,
      amount,
      address,
      status: "Processing",
      paymentMethod: "Cashfree",
      payment: false,
      date: Date.now(),
    });

    await newOrder.save();

    // Create Cashfree payment session
    const response = await axios.post(
      `${CASHFREE_BASE_URL}/pg/orders`,
      {
        order_id: newOrder._id.toString(),
        order_amount: amount,
        order_currency: currency,
        customer_details: {
          customer_id: user._id.toString(),
          customer_email: address.email,
          customer_phone: address.phone,
        },
        order_meta: {
          return_url: `${origin}/verify-cashfree?order_id={order_id}`,
        },
      },
      {
        headers: {
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const sessionId = response.data.payment_session_id;

    res.json({
      success: true,
      payment_session_id: sessionId,
      order_id: newOrder._id,
    });
  } catch (error) {
    console.log(error.response?.data || error.message);
    res.json({ success: false, message: "Cashfree order creation failed" });
  }
};

// Verify Cashfree Payment
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

// Admin - All Orders
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// User - Orders
const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await orderModel.find({ userId });
    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Admin - Update Order Status
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export {
  placeOrderCashfree,
  verifyCashfree,
  allOrders,
  userOrders,
  updateStatus
};
