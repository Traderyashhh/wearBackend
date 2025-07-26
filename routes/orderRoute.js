import express from 'express'
import {
    placeOrderCashfree,
    verifyCashfree,
    allOrders,
    userOrders,
    updateStatus
} from '../controllers/orderController.js'
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'

const orderRouter = express.Router()

// Admin Features
orderRouter.post('/list', adminAuth, allOrders)
orderRouter.post('/status', adminAuth, updateStatus)

// Payment Features
orderRouter.post('/razorpay', authUser, placeOrderCashfree)

// User Feature 
orderRouter.post('/userorders', authUser, userOrders)

// verify payment
orderRouter.post('/verifyRazorpay', authUser, verifyCashfree)

export default orderRouter