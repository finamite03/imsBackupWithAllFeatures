import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Chip,
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
  Alert,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
  TablePagination,
  TableSortLabel,
  Autocomplete,
  Card,
  CardContent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import axios from 'axios';

const adjustmentTypes = [
  { value: 'increase', label: 'Increase Stock', color: 'success' },
  { value: 'decrease', label: 'Decrease Stock', color: 'error' },
];

const reasons = [
  'damaged',
  'expired',
  'lost',
  'found',
  'inventory_count',
  'other'
];

function StockAdjustment() {
  const [skus, setSkus] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });
  const [selectedSku, setSelectedSku] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    adjustmentType: '',
    reason: '',
    search: '',
  });
  const [selectedSkus, setSelectedSkus] = useState([]);
  const [bulkForm, setBulkForm] = useState({
    adjustmentType: 'increase',
    reason: '',
    notes: '',
  });

  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState({
    sku: '',
    adjustmentType: '',
    quantity: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
    fetchWarehouses();
  }, [page, rowsPerPage, sortBy, sortOrder, filters]);

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get('/api/warehouses');
      setWarehouses(res.data.warehouses || []);
    } catch (error) {
      showAlert('Error fetching warehouses', 'error');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [skusRes, adjustmentsRes] = await Promise.all([
        axios.get('/api/skus',{ params: { limit: 1000 } }),
        axios.get('/api/stock-adjustments', {
          params: {
            page: page + 1,
            sortBy,
            sortOrder,
            ...filters,
          }
        })
      ]);
      
      setSkus(skusRes.data.skus || []);
      setAdjustments(adjustmentsRes.data.adjustments || []);
      setTotalCount(adjustmentsRes.data.total);
      setLoading(false);
    } catch (error) {
      showAlert('Error fetching data', 'error');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const newForm = { ...prev, [name]: value };
      
      // Update preview when SKU or quantity changes
      if (name === 'sku') {
        const sku = skus.find(s => s._id === value);
        setSelectedSku(sku);
      }
      
      return newForm;
    });
  };

  const calculateNewStock = () => {
    if (!selectedSku || !form.quantity) return null;
    const qty = parseInt(form.quantity);
    return form.adjustmentType === 'increase' 
      ? selectedSku.currentStock + qty 
      : selectedSku.currentStock - qty;
  };

  const showAlert = (message, severity = 'success') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/stock-adjustments', form);
      showAlert('Stock adjustment completed successfully');
      setOpenDialog(false);
      fetchData();
      resetForm();
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error creating adjustment', 'error');
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      const promises = selectedSkus.map(sku => 
        axios.post('/api/stock-adjustments', {
          ...bulkForm,
          sku: sku._id,
          quantity: sku.adjustmentQuantity
        })
      );
      
      await Promise.all(promises);
      showAlert('Bulk adjustments completed successfully');
      setOpenBulkDialog(false);
      fetchData();
      setSelectedSkus([]);
      setBulkForm({
        adjustmentType: 'increase',
        reason: '',
        notes: '',
      });
    } catch (error) {
      showAlert('Error processing bulk adjustments', 'error');
    }
  };

  const resetForm = () => {
    setForm({
      sku: '',
      adjustmentType: 'increase',
      quantity: 1,
      reason: '',
      notes: ''
    });
    setSelectedSku(null);
  };

  const handleSort = (column) => {
    const isAsc = sortBy === column && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(column);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const newStock = calculateNewStock();

  return (
    <Box>
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Stock Adjustments
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenBulkDialog(true)}
          >
            Bulk Adjustment
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            New Adjustment
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search SKUs"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.adjustmentType}
                onChange={(e) => handleFilterChange('adjustmentType', e.target.value)}
                label="Type"
              >
                <MenuItem value="">All</MenuItem>
                {adjustmentTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Reason</InputLabel>
              <Select
                value={filters.reason}
                onChange={(e) => handleFilterChange('reason', e.target.value)}
                label="Reason"
              >
                <MenuItem value="">All</MenuItem>
                {reasons.map(reason => (
                  <MenuItem key={reason} value={reason}>
                    {reason.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
          </LocalizationProvider>
          <Grid item xs={12} md={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={() => {
                setFilters({
                  startDate: null,
                  endDate: null,
                  adjustmentType: '',
                  reason: '',
                  search: '',
                });
                setPage(0);
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
         <TableHead>
  <TableRow>
    <TableCell>
      <TableSortLabel
        active={sortBy === 'createdAt'}
        direction={sortOrder}
        onClick={() => handleSort('createdAt')}
      >
        Date
      </TableSortLabel>
    </TableCell>
    <TableCell>
      <TableSortLabel
        active={sortBy === 'sku.name'}
        direction={sortOrder}
        onClick={() => handleSort('sku.name')}
      >
        SKU
      </TableSortLabel>
    </TableCell>
    <TableCell>Type</TableCell>
    <TableCell>
      <TableSortLabel
        active={sortBy === 'quantity'}
        direction={sortOrder}
        onClick={() => handleSort('quantity')}
      >
        Quantity
      </TableSortLabel>
    </TableCell>
    <TableCell>Previous Stock</TableCell>
    <TableCell>Updated Stock</TableCell>
    <TableCell>Current Stock</TableCell> {/* Add this */}
    <TableCell>Reason</TableCell>
    <TableCell>Notes</TableCell>
  </TableRow>
</TableHead>
<TableBody>
  {loading ? (
    <TableRow>
      <TableCell colSpan={9} align="center">
        Loading...
      </TableCell>
    </TableRow>
  ) : adjustments.length === 0 ? (
    <TableRow>
      <TableCell colSpan={9} align="center">
        No adjustments found
      </TableCell>
    </TableRow>
  ) : (
    adjustments.map((adjustment) => (
      <TableRow key={adjustment._id}>
        <TableCell>{new Date(adjustment.createdAt).toLocaleDateString()}</TableCell>
        <TableCell>{adjustment.sku.name}</TableCell>
        <TableCell>
          <Chip
            label={adjustment.adjustmentType}
            color={adjustment.adjustmentType === 'increase' ? 'success' : 'error'}
            size="small"
          />
        </TableCell>
        <TableCell>{adjustment.quantity}</TableCell>
        <TableCell>{adjustment.previousStock}</TableCell>
        <TableCell>{adjustment.updatedStock}</TableCell>
        <TableCell>{adjustment.sku.currentStock}</TableCell> {/* Add this */}
        <TableCell>{adjustment.reason}</TableCell>
        <TableCell>{adjustment.notes}</TableCell>
      </TableRow>
    ))
  )}
</TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Single Adjustment Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Stock Adjustment</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    options={skus}
                    getOptionLabel={(option) => `${option.name} (${option.sku})`}
                    value={selectedSku}
                    onChange={(e, newValue) => {
                      setSelectedSku(newValue);
                      setForm(prev => ({ ...prev, sku: newValue?._id || '' }));
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Select SKU" required />
                    )}
                  />
                </FormControl>
              </Grid>

              {selectedSku && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Stock Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography color="textSecondary">Current Stock</Typography>
                          <Typography variant="h6">{selectedSku.currentStock}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography color="textSecondary">After Adjustment</Typography>
                          <Typography variant="h6" color={newStock < 0 ? 'error' : 'success'}>
                            {newStock}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography color="textSecondary">Change</Typography>
                          <Typography variant="h6" color={form.adjustmentType === 'increase' ? 'success' : 'error'}>
                            {form.adjustmentType === 'increase' ? '+' : '-'}{form.quantity || 0}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Adjustment Type</InputLabel>
                  <Select
                    name="adjustmentType"
                    value={form.adjustmentType}
                    onChange={handleChange}
                    required
                    label="Adjustment Type"
                  >
                    {adjustmentTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Reason</InputLabel>
                  <Select
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    required
                    label="Reason"
                  >
                    {reasons.map((reason) => (
                      <MenuItem key={reason} value={reason}>
                        {reason.replace('_', ' ').toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={!selectedSku || !form.quantity || newStock < 0}
            >
              Submit Adjustment
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Bulk Adjustment Dialog */}
      <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Stock Adjustment</DialogTitle>
        <form onSubmit={handleBulkSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={skus}
                  getOptionLabel={(option) => `${option.name} (${option.sku})`}
                  value={selectedSkus}
                  onChange={(e, newValue) => setSelectedSkus(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select SKUs" />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Adjustment Type</InputLabel>
                  <Select
                    value={bulkForm.adjustmentType}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, adjustmentType: e.target.value }))}
                    required
                    label="Adjustment Type"
                  >
                    {adjustmentTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Reason</InputLabel>
                  <Select
                    value={bulkForm.reason}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, reason: e.target.value }))}
                    required
                    label="Reason"
                  >
                    {reasons.map((reason) => (
                      <MenuItem key={reason} value={reason}>
                        {reason.replace('_', ' ').toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {selectedSkus.length > 0 && (
                <Grid item xs={12}>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>SKU</TableCell>
                          <TableCell>Current Stock</TableCell>
                          <TableCell>Adjustment</TableCell>
                          <TableCell>New Stock</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedSkus.map((sku) => {
                          const adjustmentQty = sku.adjustmentQuantity || 0;
                          const newStock = bulkForm.adjustmentType === 'increase' 
                            ? sku.currentStock + adjustmentQty 
                            : sku.currentStock - adjustmentQty;
                          
                          return (
                            <TableRow key={sku._id}>
                              <TableCell>{sku.name}</TableCell>
                              <TableCell>{sku.currentStock}</TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={adjustmentQty}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    setSelectedSkus(prev =>
                                      prev.map(s =>
                                        s._id === sku._id
                                          ? { ...s, adjustmentQuantity: value }
                                          : s
                                      )
                                    );
                                  }}
                                  inputProps={{ min: 0 }}
                                />
                              </TableCell>
                              <TableCell>{newStock}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={bulkForm.notes}
                  onChange={(e) => setBulkForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBulkDialog(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={selectedSkus.length === 0 || !bulkForm.reason}
            >
              Submit Bulk Adjustment
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default StockAdjustment;