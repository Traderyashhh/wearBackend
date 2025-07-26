import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import axios from 'axios';

const currency = 'INR';
const deliveryCharge = 40;

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_BASE_URL = 'https://sandbox.cashfree.com';

// Placing order using Cashfree only
const placeOrderCashfree = async (req, res) => {
  try {
    const { address, items, amount } = req.body;
    const token = req.headers.token;

    const user = await userModel.findOne({ token });
    if (!user) return res.json({ success: false, message: "User not found" });

    const productDetails = items.map((item) => ({
      productId: item._id,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
    }));

    const newOrder = new orderModel({
      userId: user._id,
      items: productDetails,
      address,
      amount,
      status: "Processing",
      paymentMethod: "Cashfree",
      payment: false,
      date: Date.now()
    });

    await newOrder.save();

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
          return_url: `${req.headers.origin}/verify-cashfree?order_id={order_id}`
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

    res.json({
      success: true,
      order_id: newOrder._id,
      payment_session_id: response.data.payment_session_id
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

export {
  placeOrderCashfree,
  verifyCashfree,
};
