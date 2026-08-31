import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
