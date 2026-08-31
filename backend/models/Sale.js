import mongoose from 'mongoose';

const saleSchema = mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
  quantity: { type: Number, required: true },
  revenue: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;
