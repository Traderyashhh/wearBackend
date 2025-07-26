import userModel from "../models/userModel.js";

// Add product to cart
const addToCart = async (req, res) => {
  try {
    const { token, itemId } = req.body;
    if (!token) return res.json({ success: false, message: "Token missing" });

    const user = await userModel.findOne({ token });
    if (!user) return res.json({ success: false, message: "User not found" });

    let cartData = user.cartData || {};

    cartData[itemId] = (cartData[itemId] || 0) + 1;

    await userModel.findByIdAndUpdate(user._id, { cartData });
    res.json({ success: true, message: "Added To Cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Update cart item quantity
const updateCart = async (req, res) => {
  try {
    const { token, itemId, quantity } = req.body;
    if (!token) return res.json({ success: false, message: "Token missing" });

    const user = await userModel.findOne({ token });
    if (!user) return res.json({ success: false, message: "User not found" });

    let cartData = user.cartData || {};
    cartData[itemId] = quantity;

    await userModel.findByIdAndUpdate(user._id, { cartData });
    res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get user cart
const getUserCart = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.json({ success: false, message: "Token missing" });

    const user = await userModel.findOne({ token });
    if (!user) return res.json({ success: false, message: "User not found" });

    res.json({ success: true, cartData: user.cartData || {} });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart };
