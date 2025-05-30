import mongoose from 'mongoose';

const stockAdjustmentSchema = mongoose.Schema(
  {
    adjustmentType: {
      type: String,
      enum: ['increase', 'decrease'],
      required: true,
    },
    sku: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SKU',
      required: true,
    },
    // warehouse: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Warehouse',
    //   required: true,
    // },
    quantity: {
      type: Number,
      required: true,
    },
     previousStock: {
      type: Number,
      required: true,
    },
     updatedStock: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      enum: ['damaged', 'expired', 'lost', 'found', 'inventory_count', 'other'],
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const StockAdjustment = mongoose.model('StockAdjustment', stockAdjustmentSchema);

export default StockAdjustment;