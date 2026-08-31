import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';

export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ merchantId: req.user._id });
  res.json(products);
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, price, category } = req.body;

  const product = new Product({
    name,
    price,
    category,
    merchantId: req.user._id,
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});
