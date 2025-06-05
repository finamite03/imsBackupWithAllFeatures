import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Layout Components
import Layout from './components/layout/Layout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Main Pages
import Dashboard from './pages/dashboard/Dashboard';
import SKUManagement from './pages/skus/SKUManagement';
import AddEditSKU from './pages/skus/AddEditSKU';
import SKUDetails from './pages/skus/SKUDetails';
import Transactions from './pages/transactions/Transactions';
import StockAdjustments from './pages/inventory/StockAdjustments';
import Suppliers from './pages/suppliers/Suppliers';
import AddEditSupplier from './pages/suppliers/AddEditSupplier';
import Warehouses from './pages/warehouses/Warehouses';
import AddEditWarehouse from './pages/warehouses/AddEditWarehouse';
import SkuVendorMapping from './pages/vendors/SkuVendorMapping';
import Reports from './pages/reports/Reports';
import WarehouseDetail from './pages/warehouses/WarehouseDetail';
import SupplierDetail from './pages/suppliers/SupplierDetail';
import Indent from './pages/purchase/Indent';
import IndentApproval from './pages/purchase/IndentApproval';
import PO from './pages/purchase/PO';
import CreditDebitNote from './pages/purchase/CreditDebitNote';
import SalesOrder from './pages/sales/SalesOrder';
import Invoice from './pages/sales/Invoice';
import SalesDebitNote from './pages/sales/SalesDebitNote';
import Customers from './pages/customers/Customers';
import AdminPanel from './pages/admin/AdminPanel';
import SalesDashboard from './pages/sales/SalesDashboard';
import PurchaseDashboard from './pages/purchase/PurchaseDashboard';
import Dispatch from './pages/sales/Dispatch';
import SalesReturn from './pages/sales/SalesReturn';

// Context
import { useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';

function App() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          bgcolor: 'background.default' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AlertProvider>
      <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />

      {/* Protected Routes */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Layout /> : <Navigate to="/login" state={{ from: location }} />}
      >
        <Route index element={<Dashboard />} />
        <Route path="skus" element={<SKUManagement />} />
        <Route path="skus/add" element={<AddEditSKU />} />
        <Route path="skus/edit/:id" element={<AddEditSKU />} />
        <Route path="skus/:id" element={<SKUDetails />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="stock-adjustments" element={<StockAdjustments />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="suppliers/add" element={<AddEditSupplier />} />
        <Route path="suppliers/edit/:id" element={<AddEditSupplier />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="warehouses/add" element={<AddEditWarehouse />} />
        <Route path="warehouses/edit/:id" element={<AddEditWarehouse />} />
        <Route path="sku-vendor-mapping" element={<SkuVendorMapping />} />
        <Route path="reports" element={<Reports />} />
        <Route path="/warehouses/:id" element={<WarehouseDetail />} />
        <Route path="/suppliers/:id" element={<SupplierDetail />} />
        {/* Purchase Workflow */}
        <Route path="purchase/indent" element={<Indent />} />
        <Route path="purchase/indent-approval" element={<IndentApproval />} />
        <Route path="purchase/po" element={<PO />} />
        <Route path="purchase/credit-debit-note" element={<CreditDebitNote />} />
        {/* Sales Workflow */}
        
          <Route path="/sales/dashboard" element={<SalesDashboard />} />
          <Route path="/sales/orders" element={<SalesOrder />} />
          <Route path="/sales/dispatch" element={<Dispatch />} />
          <Route path="/sales/returns" element={<SalesReturn />} />
          <Route path="/sales/invoices" element={<Invoice />} />
          <Route path="/sales/debit-notes" element={<SalesDebitNote />} />
          <Route path="/purchase/dashboard" element={<PurchaseDashboard />} />
        {/* Customer Management */}
        <Route path="customers" element={<Customers />} />
        {/* Admin Panel */}
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </AlertProvider>
  );
}

export default App;