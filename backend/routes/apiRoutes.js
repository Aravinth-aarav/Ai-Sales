import express from 'express';
import { body, validationResult } from 'express-validator';
import { getProducts, createProduct } from '../controllers/productController.js';
import { getSales, createSale } from '../controllers/saleController.js';
import { getCampaigns, createCampaign, deleteCampaign } from '../controllers/campaignController.js';
import { 
  getInsights, 
  getInsightsHistory, 
  rejectInsight, 
  getAuditActions, 
  modifyAndApproveAction,
  deleteAuditAction
} from '../controllers/aiController.js';
import { getDashboardMetrics, loadDemoData, resetDemoData } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      code: 'VALIDATION_ERROR', 
      message: 'Invalid input data', 
      errors: errors.array().map(err => err.msg)
    });
  }
  next();
};

const campaignValidationRules = [
  body('title').isString().trim().notEmpty().withMessage('Title is required'),
  body('type').isString().trim().notEmpty().withMessage('Type is required'),
  body('discount').isString().trim().notEmpty().withMessage('Discount is required'),
  body('durationDays').isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
  validateRequest
];

const productValidationRules = [
  body('name').isString().trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('category').isString().trim().notEmpty().withMessage('Category is required'),
  validateRequest
];

const productRoutes = express.Router();
productRoutes.route('/').get(protect, getProducts).post(protect, productValidationRules, createProduct);

const saleRoutes = express.Router();
saleRoutes.route('/').get(protect, getSales).post(protect, createSale);

const campaignRoutes = express.Router();
campaignRoutes.route('/').get(protect, getCampaigns).post(protect, campaignValidationRules, createCampaign);
campaignRoutes.route('/:id').delete(protect, deleteCampaign);

const analyticsRoutes = express.Router();
analyticsRoutes.route('/dashboard').get(protect, getDashboardMetrics);
analyticsRoutes.route('/demo/load').post(protect, loadDemoData);
analyticsRoutes.route('/demo/reset').post(protect, resetDemoData);

const aiRoutes = express.Router();
aiRoutes.route('/insights').get(protect, getInsights);
aiRoutes.route('/insights/history').get(protect, getInsightsHistory);
aiRoutes.route('/insights/:id/reject').post(protect, rejectInsight);
aiRoutes.route('/actions').get(protect, getAuditActions);
aiRoutes.route('/actions/modify').post(protect, modifyAndApproveAction);
aiRoutes.route('/actions/:id').delete(protect, deleteAuditAction);

export { productRoutes, saleRoutes, campaignRoutes, aiRoutes, analyticsRoutes };
