
import mongoose from 'mongoose';

const salesOrderItemSchema = mongoose.Schema({
  sku: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SKU',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true
  }
});

const salesOrderSchema = mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  items: [salesOrderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'pending_dispatch', 'dispatched', 'delivered', 'cancelled', 'returned'],
    default: 'pending_dispatch'
  },
  dispatchStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending'
  },
  dispatchedItems: [{
    sku: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SKU'
    },
    quantity: {
      type: Number,
      default: 0
    },
    dispatchedAt: {
      type: Date
    }
  }],
  allocatedStock: [{
    sku: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SKU'
    },
    quantity: {
      type: Number,
      default: 0
    }
  }],
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate order number
salesOrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const lastOrder = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
    const lastNumber = lastOrder ? parseInt(lastOrder.orderNumber.split('-')[1]) : 0;
    this.orderNumber = `SO-${String(lastNumber + 1).padStart(6, '0')}`;
  }
  next();
});

const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);
export default SalesOrder;
