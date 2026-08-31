import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { bulkImportMerchantSales } from '../services/dataImportService.js';

// @desc    Import sales & product data via CSV upload
// @route   POST /api/data/import
// @access  Private (Admin or Authenticated Merchant)
export const importCSVData = async (req, res) => {
  try {
    // 1. Edge Case: Empty or missing file
    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ success: false, message: 'CSV file is empty.' });
    }

    // 2. Edge Case: Non-CSV file uploaded
    const originalName = req.file.originalname || '';
    if (!originalName.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({ success: false, message: 'Invalid file type. Please upload a .csv file.' });
    }

    const fileContent = req.file.buffer.toString().trim();
    if (!fileContent) {
      return res.status(400).json({ success: false, message: 'CSV file is empty.' });
    }

    // 3. Parse CSV content
    const rows = [];
    let headers = [];
    let headerError = null;

    await new Promise((resolve, reject) => {
      const stream = Readable.from(req.file.buffer);
      const parser = csvParser();

      parser.on('headers', (headerList) => {
        headers = headerList.map(h => h.trim());
        const normalized = headers.map(h => h.toLowerCase());
        const required = ['productname', 'price', 'quantity', 'date'];
        const missing = required.filter(reqCol => !normalized.includes(reqCol));
        
        if (missing.length > 0) {
          headerError = "CSV format doesn't match expected columns. Expected: productName, price, quantity, date.";
        }
      });

      parser.on('data', (data) => {
        rows.push(data);
      });

      parser.on('end', () => resolve());
      parser.on('error', (err) => reject(err));

      stream.pipe(parser);
    });

    // Handle Header Mismatch Error
    if (headerError) {
      return res.status(400).json({ success: false, message: headerError });
    }

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'CSV file is empty.' });
    }

    // 4. Edge Case: Extremely large file (> 5,000 rows)
    if (rows.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'File exceeds maximum limit of 5,000 rows. Please split the file.'
      });
    }

    // Helper to extract value case-insensitively
    const getVal = (row, key) => {
      const keys = Object.keys(row);
      const targetKey = keys.find(k => k.trim().toLowerCase() === key.toLowerCase());
      return targetKey ? row[targetKey] : undefined;
    };

    const validRows = [];
    const errors = [];

    // 5. Per-row validation
    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // Row 1 is header
      const rawProduct = getVal(row, 'productName');
      const rawPrice = getVal(row, 'price');
      const rawQty = getVal(row, 'quantity');
      const rawDate = getVal(row, 'date');

      // Validate productName
      const productName = (rawProduct || '').toString().trim();
      if (!productName) {
        errors.push(`Row ${rowNum}: missing productName`);
        return;
      }

      // Validate price
      const price = parseFloat(rawPrice);
      if (rawPrice === undefined || rawPrice === null || rawPrice === '' || isNaN(price) || price <= 0) {
        errors.push(`Row ${rowNum}: price must be a positive number`);
        return;
      }

      // Validate quantity
      const qtyNum = Number(rawQty);
      if (rawQty === undefined || rawQty === null || rawQty === '' || isNaN(qtyNum) || qtyNum <= 0 || !Number.isInteger(qtyNum)) {
        errors.push(`Row ${rowNum}: quantity must be a positive integer`);
        return;
      }

      // Validate date
      if (!rawDate) {
        errors.push(`Row ${rowNum}: missing date`);
        return;
      }
      const parsedDate = new Date(rawDate);
      if (isNaN(parsedDate.getTime())) {
        errors.push(`Row ${rowNum}: invalid date format`);
        return;
      }

      validRows.push({
        productName,
        price,
        quantity: qtyNum,
        date: parsedDate
      });
    });

    // 6. Bulk insert valid rows into database
    if (validRows.length > 0) {
      await bulkImportMerchantSales(req.user._id, validRows);
    }

    // 7. Return summary response
    return res.status(200).json({
      success: true,
      imported: validRows.length,
      skipped: errors.length,
      errors
    });
  } catch (error) {
    console.error('CSV Import Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process CSV import. ' + error.message
    });
  }
};

// @desc    Download sample CSV template file
// @route   GET /api/data/sample-csv
// @access  Public / Private
export const downloadSampleCSV = (req, res) => {
  const sampleCSV = `productName,price,quantity,date
Wireless Earbuds Pro,120,15,2026-08-01
Sleek Phone Case,25,40,2026-08-03
Bluetooth Speaker Mini,45,8,2026-08-05
Premium Yoga Mat,50,22,2026-08-07
Stainless Water Bottle,30,35,2026-08-10
Ceramic Coffee Mug,18,50,2026-08-12
Desk LED Lamp,55,14,2026-08-15
Cozy Fleece Hoodie,65,19,2026-08-18
Running Sneakers,95,12,2026-08-20
Noise Cancelling Headphones,200,6,2026-08-25`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sample-sales-data.csv"');
  return res.status(200).send(sampleCSV);
};
