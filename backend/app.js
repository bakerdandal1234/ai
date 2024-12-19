const express = require('express')
const app = express()
require('dotenv').config()
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const cors = require('cors')

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie']
}))
app.use(cookieParser())
app.use(express.json())

const router = require('./router/root')
app.use(router)

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(process.env.PORT, () => {
    console.log(`http://localhost:${process.env.PORT}`)
  }))
  .catch((err) => console.error('Could not connect to MongoDB:', err))
