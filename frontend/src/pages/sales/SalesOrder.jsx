
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Fab,
  Autocomplete,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAlert } from '../../context/AlertContext';
import axios from 'axios';

function SalesOrder() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [skus, setSkus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalOrders, setTotalOrders] = useState(0);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    customer: null,
    expectedDeliveryDate: new Date(),
    items: [{ sku: null, quantity: 1, unitPrice: 0, discount: 0, tax: 0 }],
    notes: ''
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    customer: '',
    startDate: null,
    endDate: null
  });

  const { showSuccess, showError } = useAlert();

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchSKUs();
  }, [page, rowsPerPage, filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      };
      
      const response = await axios.get('/api/sales-orders', { params });
      setOrders(response.data.salesOrders);
      setTotalOrders(response.data.totalOrders);
    } catch (error) {
      showError('Failed to fetch sales orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data.customers || response.data);
    } catch (error) {
      showError('Failed to fetch customers');
    }
  };

  const fetchSKUs = async () => {
    try {
      const response = await axios.get('/api/skus');
      setSkus(response.data.skus || response.data);
    } catch (error) {
      showError('Failed to fetch SKUs');
    }
  };

  const handleCreateOrder = async () => {
    try {
      const orderData = {
        ...formData,
        customer: formData.customer?._id,
        items: formData.items.map(item => ({
          ...item,
          sku: item.sku?._id
        }))
      };

      await axios.post('/api/sales-orders', orderData);
      showSuccess('Sales order created successfully');
      setDialogOpen(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create sales order');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`/api/sales-orders/${orderId}`, { status });
      showSuccess('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      showError('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this sales order?')) {
      try {
        await axios.delete(`/api/sales-orders/${orderId}`);
        showSuccess('Sales order deleted successfully');
        fetchOrders();
      } catch (error) {
        showError('Failed to delete sales order');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      customer: null,
      expectedDeliveryDate: new Date(),
      items: [{ sku: null, quantity: 1, unitPrice: 0, discount: 0, tax: 0 }],
      notes: ''
    });
    setSelectedOrder(null);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { sku: null, quantity: 1, unitPrice: 0, discount: 0, tax: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const itemTotal = (item.quantity * item.unitPrice) - item.discount + item.tax;
      return total + itemTotal;
    }, 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      confirmed: 'primary',
      processing: 'warning',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Sales Orders
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Create Order
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                size="small"
                options={customers}
                getOptionLabel={(option) => option.name || ''}
                value={customers.find(c => c._id === filters.customer) || null}
                onChange={(_, value) => setFilters(prev => ({ ...prev, customer: value?._id || '' }))}
                renderInput={(params) => (
                  <TextField {...params} label="Customer" />
                )}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setFilters({ status: '', customer: '', startDate: null, endDate: null })}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Orders Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order Number</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>Delivery Date</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>{order.customer?.name}</TableCell>
                  <TableCell>
                    {new Date(order.orderDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedOrder(order);
                        setViewDialog(true);
                      }}
                    >
                      <ViewIcon />
                    </IconButton>
                    {order.status === 'draft' && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedOrder(order);
                            setFormData({
                              customer: order.customer,
                              expectedDeliveryDate: new Date(order.expectedDeliveryDate),
                              items: order.items,
                              notes: order.notes
                            });
                            setDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteOrder(order._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                    {order.status === 'draft' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}
                      >
                        Confirm
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={totalOrders}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>

        {/* Create/Edit Order Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            resetForm();
          }}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            {selectedOrder ? 'Edit Sales Order' : 'Create Sales Order'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => option.name || ''}
                  value={formData.customer}
                  onChange={(_, value) => setFormData(prev => ({ ...prev, customer: value }))}
                  renderInput={(params) => (
                    <TextField {...params} label="Customer" required fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Expected Delivery Date"
                  value={formData.expectedDeliveryDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, expectedDeliveryDate: date }))}
                  renderInput={(params) => <TextField {...params} required fullWidth />}
                />
              </Grid>
              
              {/* Items Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Order Items</Typography>
                {formData.items.map((item, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                          <Autocomplete
                            options={skus}
                            getOptionLabel={(option) => `${option.name} (${option.sku})` || ''}
                            value={item.sku}
                            onChange={(_, value) => {
                              updateItem(index, 'sku', value);
                              if (value) {
                                updateItem(index, 'unitPrice', value.sellingPrice || 0);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField {...params} label="SKU" size="small" />
                            )}
                          />
                        </Grid>
                        <Grid item xs={6} md={1.5}>
                          <TextField
                            type="number"
                            label="Quantity"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6} md={1.5}>
                          <TextField
                            type="number"
                            label="Unit Price"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6} md={1.5}>
                          <TextField
                            type="number"
                            label="Discount"
                            value={item.discount}
                            onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6} md={1.5}>
                          <TextField
                            type="number"
                            label="Tax"
                            value={item.tax}
                            onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value) || 0)}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              Total: ${((item.quantity * item.unitPrice) - item.discount + item.tax).toFixed(2)}
                            </Typography>
                            {formData.items.length > 1 && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeItem(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
                
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addItem}
                  sx={{ mb: 2 }}
                >
                  Add Item
                </Button>
                
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" align="right">
                  Total Amount: ${calculateTotal().toFixed(2)}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  fullWidth
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrder} variant="contained">
              {selectedOrder ? 'Update' : 'Create'} Order
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Order Dialog */}
        <Dialog
          open={viewDialog}
          onClose={() => setViewDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Order Details</DialogTitle>
          <DialogContent>
            {selectedOrder && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Order Number:</Typography>
                    <Typography variant="body1">{selectedOrder.orderNumber}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Customer:</Typography>
                    <Typography variant="body1">{selectedOrder.customer?.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Order Date:</Typography>
                    <Typography variant="body1">
                      {new Date(selectedOrder.orderDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Expected Delivery:</Typography>
                    <Typography variant="body1">
                      {new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Items</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>SKU</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Price</TableCell>
                        <TableCell>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.sku?.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell>${item.totalAmount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Typography variant="h6">
                    Total: ${selectedOrder.totalAmount?.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}

export default SalesOrder;
