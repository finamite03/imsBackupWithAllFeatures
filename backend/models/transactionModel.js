import mongoose from 'mongoose';

const transactionSchema = mongoose.Schema(
  {
    transactionType: {
      type: String,
      enum: ['purchase', 'sale', 'purchase_return', 'sales_return', 'transfer'],
      required: true,
    },
    transactionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    referenceNumber: {
      type: String,
      required: true,
    },
    items: [
      {
        sku: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SKU',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
    },
    // For purchase and purchase return
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    // For sales and sales return
    customer: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    // For transfers
    sourceWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    destinationWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referenceType: {
      type: String,
      enum: ['PurchaseOrder', 'SalesOrder', 'StockAdjustment', 'Invoice', 'SalesDebitNote'],
      required: true
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;