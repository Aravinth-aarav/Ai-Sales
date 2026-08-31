import Product from '../models/Product.js';
import Sale from '../models/Sale.js';

/**
 * Bulk imports products and sales for a merchant
 * @param {string|ObjectId} merchantId 
 * @param {Array<{productName: string, price: number, quantity: number, date: Date}>} validRows 
 */
export const bulkImportMerchantSales = async (merchantId, validRows) => {
  if (!validRows || validRows.length === 0) {
    return { insertedSalesCount: 0, productsCreatedCount: 0 };
  }

  // 1. Get unique products from valid rows
  const productMap = new Map();
  validRows.forEach(r => {
    if (!productMap.has(r.productName)) {
      productMap.set(r.productName, {
        name: r.productName,
        price: r.price,
        category: 'General'
      });
    }
  });

  // 2. Fetch existing products for this merchant
  const existingProducts = await Product.find({ 
    merchantId, 
    name: { $in: Array.from(productMap.keys()) } 
  });

  const existingMap = new Map();
  existingProducts.forEach(p => {
    existingMap.set(p.name, p._id);
  });

  // 3. Create missing products
  const productsToCreate = [];
  productMap.forEach((pData, name) => {
    if (!existingMap.has(name)) {
      productsToCreate.push({
        merchantId,
        name: pData.name,
        price: pData.price,
        category: pData.category
      });
    }
  });

  let createdProductsCount = 0;
  if (productsToCreate.length > 0) {
    const createdProducts = await Product.create(productsToCreate);
    createdProductsCount = createdProducts.length;
    createdProducts.forEach(p => {
      existingMap.set(p.name, p._id);
    });
  }

  // 4. Map valid rows into Sale documents
  const salesToInsert = validRows.map(r => ({
    merchantId,
    productId: existingMap.get(r.productName),
    quantity: r.quantity,
    revenue: r.quantity * r.price,
    date: r.date
  }));

  const insertedSales = await Sale.insertMany(salesToInsert);

  return {
    insertedSalesCount: insertedSales.length,
    productsCreatedCount: createdProductsCount
  };
};
