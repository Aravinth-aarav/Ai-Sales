import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Sale from './models/Sale.js';
import Campaign from './models/Campaign.js';

dotenv.config();

connectDB();

const seedData = async () => {
  try {
    await User.deleteMany();
    await Product.deleteMany();
    await Sale.deleteMany();
    await Campaign.deleteMany();

    const createdUsers = await User.create([
      {
        name: 'Admin Merchant',
        email: 'admin@example.com',
        password: 'password123',
        shopName: 'Admin Super Store',
        role: 'Admin'
      }
    ]);

    const merchant = createdUsers[0]._id;

    const products = await Product.create([
      { merchantId: merchant, name: 'Wireless Headphones', price: 150, category: 'Electronics' },
      { merchantId: merchant, name: 'Coffee Mug', price: 15, category: 'Home' },
      { merchantId: merchant, name: 'Yoga Mat', price: 35, category: 'Fitness' },
      { merchantId: merchant, name: 'Desk Lamp', price: 45, category: 'Home' },
    ]);

    // Create a week of sales data (simulate underperforming yoga mat)
    const salesData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      salesData.push({ merchantId: merchant, productId: products[0]._id, quantity: 5, revenue: 5 * 150, date });
      salesData.push({ merchantId: merchant, productId: products[1]._id, quantity: 10, revenue: 10 * 15, date });
      
      if (i % 3 === 0) {
        salesData.push({ merchantId: merchant, productId: products[2]._id, quantity: 1, revenue: 35, date }); // low sales
      }
      
      salesData.push({ merchantId: merchant, productId: products[3]._id, quantity: 3, revenue: 3 * 45, date });
    }

    await Sale.create(salesData);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
