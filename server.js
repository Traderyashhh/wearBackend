import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import cron from 'node-cron'
import axios from 'axios'

// App Config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
app.use(cors())

// api endpoints
app.use('/api/user',userRouter)
app.use('/api/product',productRouter)
app.use('/api/cart',cartRouter)
app.use('/api/order',orderRouter)

app.get('/',(req,res)=>{
    res.send("API Working")
})

// CRON Job to ping the server every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  try {
    console.log("🔁 Pinging server to keep it alive...")
    await axios.get('https://www.wearandwow.shop/')
  } catch (error) {
    console.error('❌ Ping failed:', error.message)
  }
})

app.listen(port, ()=> console.log('Server started on PORT : '+ port))