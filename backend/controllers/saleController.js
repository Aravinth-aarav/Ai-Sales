import asyncHandler from 'express-async-handler';
import Sale from '../models/Sale.js';

export const getSales = asyncHandler(async (req, res) => {
  const sales = await Sale.find({ merchantId: req.user._id }).populate('productId', 'name category');
  res.json(sales);
});

export const createSale = asyncHandler(async (req, res) => {
  const { productId, quantity, revenue, date } = req.body;

  const sale = new Sale({
    merchantId: req.user._id,
    productId,
    quantity,
    revenue,
    date: date || Date.now(),
  });

  const createdSale = await sale.save();
  res.status(201).json(createdSale);
});
