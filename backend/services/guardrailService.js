import Product from '../models/Product.js';

/**
 * Parses numeric value from a discount string or number.
 * Returns NaN if not parseable.
 */
export const parseDiscountValue = (discount) => {
  if (discount === null || discount === undefined) return NaN;
  if (typeof discount === 'number') return discount;
  if (typeof discount === 'string') {
    const trimmed = discount.trim();
    if (!trimmed) return NaN;
    // Extract first numeric match (integer or float)
    const match = trimmed.match(/(-?\d+(\.\d+)?)/);
    if (match) {
      return parseFloat(match[1]);
    }
  }
  return NaN;
};

/**
 * Server-side validation of proposed or modified actions.
 * Enforces strict limits:
 * - Max Discount: 15%
 * - Min Discount: 0%
 * - Campaign Duration: 1 to 30 days
 * - Ownership of referenced Product
 * - Safe numeric handling (NaN, Infinity check)
 */
export const validateCampaignGuardrails = async (merchantId, data) => {
  const { title, type, discount, marketingCopy, durationDays, productId } = data;

  // 1. Check critical field existence
  if (!title || !title.trim()) {
    return { valid: false, code: 'MISSING_FIELD', reason: 'Campaign title is required.' };
  }
  if (!discount) {
    return { valid: false, code: 'MISSING_FIELD', reason: 'Discount value is required.' };
  }
  if (!type || !type.trim()) {
    return { valid: false, code: 'MISSING_FIELD', reason: 'Campaign type is required.' };
  }

  // 2. Validate Discount Edge Cases
  const discountVal = parseDiscountValue(discount);
  
  if (isNaN(discountVal)) {
    return { valid: false, code: 'INVALID_DISCOUNT', reason: `Discount value "${discount}" is not a valid number.` };
  }
  if (!isFinite(discountVal)) {
    return { valid: false, code: 'INVALID_DISCOUNT', reason: 'Discount cannot be infinite.' };
  }
  if (discountVal < 0) {
    return { valid: false, code: 'POLICY_VIOLATION', reason: 'Discount value cannot be negative.' };
  }
  if (discountVal > 15) {
    return { valid: false, code: 'POLICY_VIOLATION', reason: `AI or user proposed a ${discountVal}% discount. Maximum discount allowed is 15%.` };
  }

  // 3. Validate Campaign Duration
  if (durationDays !== undefined && durationDays !== null) {
    const days = parseInt(durationDays, 10);
    if (isNaN(days)) {
      return { valid: false, code: 'INVALID_DURATION', reason: 'Duration must be a valid number of days.' };
    }
    if (!isFinite(days)) {
      return { valid: false, code: 'INVALID_DURATION', reason: 'Duration cannot be infinite.' };
    }
    if (days < 1 || days > 30) {
      return { valid: false, code: 'POLICY_VIOLATION', reason: `Campaign duration of ${days} days is invalid. Must be between 1 and 30 days.` };
    }
  }

  // 4. Product Ownership Check
  if (productId) {
    const product = await Product.findById(productId);
    if (!product) {
      return { valid: false, code: 'PRODUCT_NOT_FOUND', reason: 'The specified product does not exist.' };
    }
    if (String(product.merchantId) !== String(merchantId)) {
      return { valid: false, code: 'FORBIDDEN', reason: 'You do not own the specified product.' };
    }
  }

  return { valid: true };
};
