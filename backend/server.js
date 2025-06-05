import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend folder
dotenv.config({ path: path.resolve(__dirname, '.env') });
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import skuRoutes from './routes/skuRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import stockAdjustmentRoutes from './routes/stockAdjustmentRoutes.js';
import vendorMappingRoutes from './routes/vendorMappingRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import salesOrderRoutes from './routes/salesOrderRoutes.js';
import salesReturnRoutes from './routes/salesReturnRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import purchaseIndentRoutes from './routes/purchaseIndentRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js'; // Import PO routes
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/skus', skuRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stock-adjustments', stockAdjustmentRoutes);
app.use('/api/vendor-mappings', vendorMappingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/sales-returns', salesReturnRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/purchase-indents', purchaseIndentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes); // Register PO routes

// Handle production build
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  const distPath = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  
  // Any route that is not api will be redirected to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// Custom error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
