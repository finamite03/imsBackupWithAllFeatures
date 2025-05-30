import mongoose from 'mongoose';

const supplierSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    alternatePhone: { type: String }, // <-- Add this line
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true }, // <-- Change zipCode to pincode
      // country: { type: String, required: true }, // <-- Remove this line
    },
    taxId: { type: String, default: '' },
    paymentTerms: { type: String, default: 'Net 30' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    categories: [String],
    leadTime: { type: Number, default: 7 },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;