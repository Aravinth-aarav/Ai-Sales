import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['campaign_live', 'payment_success', 'payment_failed', 'ai_insight']
  },
  read: { 
    type: Boolean, 
    required: true,
    default: false 
  }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
