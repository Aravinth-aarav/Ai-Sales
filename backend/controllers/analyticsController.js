import asyncHandler from 'express-async-handler';
import { getDashboardAnalytics } from '../services/analyticsService.js';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Campaign from '../models/Campaign.js';
import AIInsight from '../models/AIInsight.js';
import AIAction from '../models/AIAction.js';

// @desc    Get dashboard metrics and Before/After lift analytics
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardMetrics = asyncHandler(async (req, res) => {
  const metrics = await getDashboardAnalytics(req.user._id);
  res.json(metrics);
});

// @desc    Load high-fidelity demo merchant data (500+ transactions)
// @route   POST /api/analytics/demo/load
// @access  Private
export const loadDemoData = asyncHandler(async (req, res) => {
  const merchantId = req.user._id;

  // Clear existing merchant transactions
  await Product.deleteMany({ merchantId });
  await Sale.deleteMany({ merchantId });
  await Campaign.deleteMany({ merchantId });
  await AIInsight.deleteMany({ merchantId });
  await AIAction.deleteMany({ merchantId });

  // 1. Create a modern catalog of 15 products
  const productsList = [
    { name: 'Wireless Earbuds Pro', price: 120, category: 'Electronics' },
    { name: 'Sleek Phone Case', price: 25, category: 'Electronics' },
    { name: 'Bluetooth Speaker Mini', price: 45, category: 'Electronics' }, // Slow-mover
    { name: 'Premium Yoga Mat', price: 50, category: 'Fitness' },
    { name: 'Stainless Water Bottle', price: 30, category: 'Fitness' },
    { name: 'Ceramic Coffee Mug', price: 18, category: 'Home' },
    { name: 'Desk LED Lamp', price: 55, category: 'Home' },
    { name: 'Leather Journal', price: 22, category: 'Home' },
    { name: 'Cozy Fleece Hoodie', price: 65, category: 'Apparel' },
    { name: 'Casual Cotton Tee', price: 20, category: 'Apparel' },
    { name: 'Ergonomic Desk Chair', price: 250, category: 'Home' },
    { name: 'Running Sneakers', price: 95, category: 'Fitness' },
    { name: 'Fitness Tracker Smartband', price: 80, category: 'Fitness' },
    { name: 'Mechanical Keyboard', price: 110, category: 'Electronics' },
    { name: 'Noise Cancelling Headphones', price: 200, category: 'Electronics' }
  ];

  const dbProducts = await Product.create(
    productsList.map(p => ({ ...p, merchantId }))
  );

  // Map products for easy indexing
  const pMap = {};
  dbProducts.forEach(p => {
    pMap[p.name] = p;
  });

  // 2. Generate a 30-day realistic transaction log (500+ items)
  const salesToInsert = [];
  const baseDate = new Date();

  // Seed transactions
  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() - dayOffset);
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Weekday sales are 50% lower than weekend sales to trigger sales trend insight
    const multiplier = (dayOfWeek === 1 || dayOfWeek === 2) ? 8 : 18;

    for (let txn = 0; txn < multiplier; txn++) {
      // Pick products with varied popularity
      let productSelected;
      let qty = 1;

      const roll = Math.random();
      if (roll < 0.35) {
        // Earbuds are best-sellers (35% probability)
        productSelected = pMap['Wireless Earbuds Pro'];
        
        // Co-purchase earbud + phone case bundle trigger
        if (Math.random() < 0.4) {
          salesToInsert.push({
            merchantId,
            productId: pMap['Sleek Phone Case']._id,
            quantity: 1,
            revenue: pMap['Sleek Phone Case'].price,
            date: new Date(currentDate.getTime() + 1000 * 60)
          });
        }
      } else if (roll < 0.55) {
        productSelected = pMap['Premium Yoga Mat'];
      } else if (roll < 0.70) {
        productSelected = pMap['Cozy Fleece Hoodie'];
      } else if (roll < 0.85) {
        productSelected = pMap['Ceramic Coffee Mug'];
      } else if (roll < 0.98) {
        productSelected = pMap['Noise Cancelling Headphones'];
      } else {
        // Bluetooth Speaker is a slow-mover (very low sales)
        productSelected = pMap['Bluetooth Speaker Mini'];
      }

      if (productSelected) {
        salesToInsert.push({
          merchantId,
          productId: productSelected._id,
          quantity: qty,
          revenue: qty * productSelected.price,
          date: currentDate
        });
      }
    }
  }

  await Sale.create(salesToInsert);

  res.status(201).json({
    message: 'Demo Merchant Data loaded successfully!',
    productsCount: dbProducts.length,
    salesCount: salesToInsert.length
  });
});

// @desc    Reset merchant workspace completely
// @route   POST /api/analytics/demo/reset
// @access  Private
export const resetDemoData = asyncHandler(async (req, res) => {
  const merchantId = req.user._id;

  await Product.deleteMany({ merchantId });
  await Sale.deleteMany({ merchantId });
  await Campaign.deleteMany({ merchantId });
  await AIInsight.deleteMany({ merchantId });
  await AIAction.deleteMany({ merchantId });

  res.json({
    message: 'Workspace successfully reset. All sales, products, and campaign logs cleared.'
  });
});
