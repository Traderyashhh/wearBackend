import userModel from "../models/userModel.js";

// add product to cart
const addToCart = async (req, res) => {
  try {
    const { token, itemId } = req.body;
    const userData = await userModel.findOne({ token }); // or decode token if needed
    let cartData = userData.cartData || {};

    if (cartData[itemId]) {
      cartData[itemId] += 1;
    } else {
      cartData[itemId] = 1;
    }

    await userModel.findByIdAndUpdate(userData._id, { cartData });
    res.json({ success: true, message: "Added To Cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// update cart quantity
const updateCart = async (req, res) => {
  try {
    const { token, itemId, quantity } = req.body;
    const userData = await userModel.findOne({ token }); // or decode token if needed
    let cartData = userData.cartData || {};

    cartData[itemId] = quantity;

    await userModel.findByIdAndUpdate(userData._id, { cartData });
    res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// get user cart
const getUserCart = async (req, res) => {
  try {
    const { token } = req.body;
    const userData = await userModel.findOne({ token });
    let cartData = userData.cartData || {};
    res.json({ success: true, cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart };
