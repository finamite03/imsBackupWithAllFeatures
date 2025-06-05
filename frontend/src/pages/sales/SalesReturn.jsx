
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
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
  Autocomplete,
  Card,
  CardContent,
  TablePagination
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAlert } from '../../context/AlertContext';

const returnReasons = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'defective', label: 'Defective' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'customer_request', label: 'Customer Request' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'other', label: 'Other' }
];

const actionTypes = [
  { value: 'refund', label: 'Refund' },
  { value: 'exchange', label: 'Exchange' },
  { value: 'repair', label: 'Repair' },
  { value: 'credit_note', label: 'Credit Note' }
];

function SalesReturn() {
  const [returns, setReturns] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalReturns, setTotalReturns] = useState(0);
  
  const [formData, setFormData] = useState({
    salesOrder: null,
    returnDate: new Date(),
    reason: '',
    actionRequired: '',
    items: [],
    notes: ''
  });

  const { showSuccess, showError } = useAlert();

  useEffect(() => {
    fetchReturns();
    fetchSalesOrders();
  }, [page, rowsPerPage]);

  const fetchReturns = async () => {
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage
      };
      const response = await axios.get('/api/sales-returns', { params });
      setReturns(response.data.returns || []);
      setTotalReturns(response.data.totalReturns || 0);
    } catch (error) {
      showError('Failed to fetch sales returns');
    }
  };

  const fetchSalesOrders = async () => {
    try {
      const response = await axios.get('/api/sales-orders', {
        params: { status: 'delivered' }
      });
      setSalesOrders(response.data.salesOrders || []);
    } catch (error) {
      showError('Failed to fetch sales orders');
    }
  };

  const handleOrderSelect = async (order) => {
    if (!order) {
      setSelectedOrder(null);
      setFormData(prev => ({ ...prev, items: [] }));
      return;
    }

    setSelectedOrder(order);
    const items = order.items.map(item => ({
      sku: item.sku,
      quantity: 0,
      maxQuantity: item.quantity,
      unitPrice: item.unitPrice,
      totalAmount: 0
    }));
    
    setFormData(prev => ({
      ...prev,
      salesOrder: order,
      items
    }));
  };

  const updateItemQuantity = (index, quantity) => {
    const newItems = [...formData.items];
    const item = newItems[index];
    item.quantity = Math.min(quantity, item.maxQuantity);
    item.totalAmount = item.quantity * item.unitPrice;
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const calculateTotalAmount = () => {
    return formData.items.reduce((total, item) => total + item.totalAmount, 0);
  };

  const handleSubmit = async () => {
    try {
      const returnData = {
        salesOrder: formData.salesOrder._id,
        customer: formData.salesOrder.customer._id,
        returnDate: formData.returnDate,
        reason: formData.reason,
        actionRequired: formData.actionRequired,
        items: formData.items
          .filter(item => item.quantity > 0)
          .map(item => ({
            sku: item.sku._id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount
          })),
        totalAmount: calculateTotalAmount(),
        notes: formData.notes
      };

      await axios.post('/api/sales-returns', returnData);
      showSuccess('Sales return created successfully');
      setDialogOpen(false);
      resetForm();
      fetchReturns();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create sales return');
    }
  };

  const resetForm = () => {
    setFormData({
      salesOrder: null,
      returnDate: new Date(),
      reason: '',
      actionRequired: '',
      items: [],
      notes: ''
    });
    setSelectedOrder(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      processed: 'info',
      rejected: 'error'
    };
    return colors[status] || 'default';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Sales Returns
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Create Return
          </Button>
        </Box>

        {/* Returns Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Return Number</TableCell>
                <TableCell>Sales Order</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Return Date</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Action Required</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returns.map((returnItem) => (
                <TableRow key={returnItem._id}>
                  <TableCell>{returnItem.returnNumber}</TableCell>
                  <TableCell>{returnItem.salesOrder?.orderNumber}</TableCell>
                  <TableCell>{returnItem.customer?.name}</TableCell>
                  <TableCell>
                    {new Date(returnItem.returnDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {returnReasons.find(r => r.value === returnItem.reason)?.label || returnItem.reason}
                  </TableCell>
                  <TableCell>
                    {actionTypes.find(a => a.value === returnItem.actionRequired)?.label || returnItem.actionRequired}
                  </TableCell>
                  <TableCell>${returnItem.totalAmount?.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={returnItem.status}
                      color={getStatusColor(returnItem.status)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={totalReturns}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>

        {/* Create Return Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            resetForm();
          }}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Create Sales Return</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={salesOrders}
                  getOptionLabel={(option) => `${option.orderNumber} - ${option.customer?.name}`}
                  value={formData.salesOrder}
                  onChange={(_, value) => {
                    setFormData(prev => ({ ...prev, salesOrder: value }));
                    handleOrderSelect(value);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Sales Order" required fullWidth />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Return Date"
                  value={formData.returnDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, returnDate: date }))}
                  renderInput={(params) => <TextField {...params} required fullWidth />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Reason for Return"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  required
                  fullWidth
                >
                  {returnReasons.map((reason) => (
                    <MenuItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Action Required"
                  value={formData.actionRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, actionRequired: e.target.value }))}
                  required
                  fullWidth
                >
                  {actionTypes.map((action) => (
                    <MenuItem key={action.value} value={action.value}>
                      {action.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Items Section */}
              {selectedOrder && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Return Items
                  </Typography>
                  {formData.items.map((item, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2">
                              {item.sku?.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              SKU: {item.sku?.sku}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} md={2}>
                            <Typography variant="body2">
                              Max: {item.maxQuantity}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} md={2}>
                            <TextField
                              type="number"
                              label="Return Qty"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                              inputProps={{
                                min: 0,
                                max: item.maxQuantity
                              }}
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={6} md={2}>
                            <Typography variant="body2">
                              Unit: ${item.unitPrice?.toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} md={2}>
                            <Typography variant="body2">
                              Total: ${item.totalAmount?.toFixed(2)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Box sx={{ textAlign: 'right', mt: 2 }}>
                    <Typography variant="h6">
                      Total Return Amount: ${calculateTotalAmount().toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              )}

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
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={!selectedOrder || formData.items.every(item => item.quantity === 0)}
            >
              Create Return
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}

export default SalesReturn;
