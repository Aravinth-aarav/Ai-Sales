import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import AIInsight from '../models/AIInsight.js';
import AIAction from '../models/AIAction.js';
import { executeGeminiPrompt } from './geminiService.js';
import { validateCampaignGuardrails } from './guardrailService.js';

/**
 * Service to process sales history, coordinate with Gemini, and build opportunities.
 */
export const detectGrowthOpportunities = async (merchantId) => {
  // Fetch active sales populated with products
  const sales = await Sale.find({ merchantId }).populate('productId');
  const products = await Product.find({ merchantId });

  if (!sales || sales.length < 5) {
    throw new Error('Insufficient sales transaction history to analyze growth patterns. Please add more sales data.');
  }

  // Aggregate metrics to supply context to AI without bloat
  const totalSales = sales.reduce((acc, s) => acc + s.revenue, 0);
  
  const productPerformance = {};
  sales.forEach(s => {
    const name = s.productId?.name || 'Unknown';
    if (!productPerformance[name]) {
      productPerformance[name] = { revenue: 0, quantity: 0 };
    }
    productPerformance[name].revenue += s.revenue;
    productPerformance[name].quantity += s.quantity;
  });

  // Calculate weekday vs weekend sales
  let weekdaySales = 0;
  let weekendSales = 0;
  sales.forEach(s => {
    const day = new Date(s.date).getDay();
    if (day === 0 || day === 6) {
      weekendSales += s.revenue;
    } else {
      weekdaySales += s.revenue;
    }
  });

  const summaryContext = {
    merchantTotalRevenue: totalSales,
    totalTransactionsCount: sales.length,
    productSalesSummary: productPerformance,
    weekdaySalesRevenue: weekdaySales,
    weekendSalesRevenue: weekendSales,
    availableInventoryProducts: products.map(p => ({ id: p._id, name: p.name, price: p.price, category: p.category }))
  };

  const prompt = `You are an AI Growth Agent helping small online merchants increase revenue using their historical sales and product data.
Here is the merchant's store data:
${JSON.stringify(summaryContext)}

Analyze this data and return EXACTLY ONE growth opportunity in the JSON structure below.
CRITICAL CONSTRAINT: Any proposed campaign discount value and discountPercentage MUST be strictly between 5% and 15% (e.g., "10% Off", "12% Off", "15% Off"). Do NOT exceed a 15% discount under any circumstances, as the platform guardrail policies will reject it.

Choose the single most impactful opportunity from these types:
- SALES_TREND (e.g. weak Monday/Tuesday sales compared to weekends)
- PRODUCT_BUNDLE (e.g. products frequently bought together or naturally complementary)
- SLOW_MOVING (e.g. low sales for specific items compared to others)
- BEST_SELLER (e.g. capitalizing on top product demand)
- CUSTOMER_SEGMENT (e.g. rewarding repeat buyers)

You MUST respond ONLY with a raw JSON object matching this schema (do not include markdown syntax, backticks, or any conversational text):
{
  "type": "SALES_TREND" | "PRODUCT_BUNDLE" | "SLOW_MOVING" | "BEST_SELLER" | "CUSTOMER_SEGMENT",
  "title": "Short title describing the opportunity",
  "description": "Detail what pattern was observed in the data",
  "severity": "low" | "medium" | "high",
  "confidence": 0.85,
  "recommendation": "What action should the merchant take?",
  "reasoning": "A concise single-sentence explanation of why this campaign is proposed (e.g., 'Based on low weekend sales and high inventory of Product X')",
  "confidenceScore": 82,
  "expectedImpactText": "Predicted 15% sales lift",
  "suggestedAction": {
    "type": "DISCOUNT_CAMPAIGN" | "BUNDLE_CAMPAIGN" | "FLASH_SALE",
    "discountPercentage": 10,
    "durationDays": 7,
    "campaignDetails": {
      "title": "Actionable Campaign Title",
      "type": "Discount | Bundle | Flash Sale",
      "discount": "e.g. 10% Off or Save $15",
      "marketingCopy": "Compelling marketing newsletter copy for customers (e.g. 'Hey there! Elevate your week with...')"
    }
  },
  "expectedImpact": {
    "metric": "revenue",
    "estimatedIncreasePercentage": "8-12%"
  }
}`;

  // Call Gemini
  const parsedResponse = await executeGeminiPrompt(prompt);

  // Apply policy guardrails check on initial proposal
  const initialActionPayload = {
    title: parsedResponse.suggestedAction?.campaignDetails?.title,
    type: parsedResponse.suggestedAction?.campaignDetails?.type,
    discount: parsedResponse.suggestedAction?.campaignDetails?.discount,
    marketingCopy: parsedResponse.suggestedAction?.campaignDetails?.marketingCopy,
    durationDays: parsedResponse.suggestedAction?.durationDays
  };

  const guardrailResult = await validateCampaignGuardrails(merchantId, initialActionPayload);
  
  // Save Insight in DB
  const newInsight = new AIInsight({
    merchantId,
    type: parsedResponse.type,
    title: parsedResponse.title,
    description: parsedResponse.description,
    severity: parsedResponse.severity,
    confidence: parsedResponse.confidence || 0.85,
    recommendation: parsedResponse.recommendation,
    reasoning: parsedResponse.reasoning || `Based on historical sales trends and inventory levels.`,
    confidenceScore: parsedResponse.confidenceScore || Math.floor((parsedResponse.confidence || 0.8) * 100),
    expectedImpactText: parsedResponse.expectedImpactText || `Predicted ${parsedResponse.expectedImpact?.estimatedIncreasePercentage || '10%'} sales lift`,
    suggestedAction: parsedResponse.suggestedAction,
    expectedImpact: parsedResponse.expectedImpact,
    status: 'active'
  });

  const savedInsight = await newInsight.save();

  // Create initial proposed AIAction in audit log
  const newAction = new AIAction({
    merchantId,
    insightId: savedInsight._id,
    actionType: parsedResponse.suggestedAction?.type || 'DISCOUNT_CAMPAIGN',
    originalAIProposal: parsedResponse.suggestedAction,
    merchantEditedValues: null,
    merchantDecision: guardrailResult.valid ? 'PENDING' : 'BLOCKED',
    guardrailResult: guardrailResult,
    status: guardrailResult.valid ? 'PROPOSED' : 'BLOCKED',
    failureReason: guardrailResult.valid ? null : guardrailResult.reason
  });

  await newAction.save();

  return {
    insight: savedInsight,
    action: newAction,
    guardrail: guardrailResult
  };
};
