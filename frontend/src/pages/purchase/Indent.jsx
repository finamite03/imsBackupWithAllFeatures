import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, TextField, IconButton, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function Indent() {
  const [skus, setSkus] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ departmentName: '', requestedBy: '', expectedNeededDate: '', items: [] });
  const [error, setError] = useState(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [skuRes, vendorRes, indentRes] = await Promise.all([
        axios.get('/api/skus'),
        axios.get('/api/suppliers'),
        axios.get('/api/purchase-indents'),
      ]);
      setSkus(skuRes.data.skus || skuRes.data);
      setVendors(vendorRes.data.suppliers || vendorRes.data);
      setIndents(indentRes.data || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    // Reset form when closing dialog
    setForm({ departmentName: '', requestedBy: '', expectedNeededDate: '', items: [] });
    setError(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleAddItem = () => {
    setForm(f => ({ ...f, items: [...(f.items || []), { sku: '', quantity: 1, vendor: '' }] }));
  };

  const handleItemChange = (idx, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[idx][field] = value;
      if (field === 'sku') items[idx].vendor = ''; // Reset vendor if SKU changes
      return { ...f, items };
    });
  };

  const handleRemoveItem = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // Basic validation
      if (!form.departmentName || !form.requestedBy || !form.expectedNeededDate || form.items.length === 0) {
        setError("Please fill all main indent fields and add at least one item.");
        return;
      }

      // Validate items for vendor selection
      for (const item of form.items) {
        if (!item.sku || !item.quantity) {
          setError("All items must have an SKU and quantity.");
          return;
        }
        const skuObj = skus.find(s => s._id === item.sku);
        const mappedVendors = skuObj?.alternateSuppliers?.length
          ? vendors.filter(v => skuObj.alternateSuppliers.includes(v._id))
          : [];
        if (mappedVendors.length > 0 && !item.vendor) {
          setError(`Please select a vendor for SKU: ${skuObj.name}.`);
          return;
        }
      }

      // Get user ID from localStorage (adjust if you use context or another method)
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user._id) {
        setError('User not found. Please log in again.');
        return;
      }
      const payload = { ...form, createdBy: user._id };
      await axios.post('/api/purchase-indents', payload);
      fetchData(); // Refresh indent list
      handleCloseCreateDialog(); // Close dialog and reset form
      // TODO: Show success message with indent number
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create indent');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Indents</Typography>
        <Button variant="contained" onClick={handleOpenCreateDialog}>Create New Indent</Button>
      </Box>

      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} maxWidth="md" fullWidth>
        <DialogTitle>Create New Indent</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Please fill in the details for the new indent.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              name="departmentName"
              label="Department Name"
              type="text"
              fullWidth
              variant="outlined"
              value={form.departmentName}
              onChange={handleFormChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="requestedBy"
              label="Requested By"
              type="text"
              fullWidth
              variant="outlined"
              value={form.requestedBy}
              onChange={handleFormChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="expectedNeededDate"
              label="Expected Needed Date"
              type="date"
              fullWidth
              variant="outlined"
              value={form.expectedNeededDate}
              onChange={handleFormChange}
              required
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Items</Typography>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>SKU</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(form.items || []).map((item, idx) => {
                    const skuObj = skus.find(s => s._id === item.sku);
                    const mappedVendors = skuObj?.alternateSuppliers?.length
                      ? vendors.filter(v => skuObj.alternateSuppliers.includes(v._id))
                      : [];
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select
                            value={item.sku}
                            onChange={e => handleItemChange(idx, 'sku', e.target.value)}
                            displayEmpty
                            size="small"
                            fullWidth
                            sx={{ minWidth: 180 }}
                          >
                            <MenuItem value="" disabled>Select SKU</MenuItem>
                            {skus.map(sku => (
                              <MenuItem key={sku._id} value={sku._id}>{sku.name} ({sku.sku})</MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.vendor}
                            onChange={e => handleItemChange(idx, 'vendor', e.target.value)}
                            displayEmpty
                            size="small"
                            fullWidth
                            sx={{ minWidth: 160 }}
                            disabled={!item.sku || mappedVendors.length === 0}
                          >
                            <MenuItem value="" disabled>{mappedVendors.length > 0 ? "Select Vendor (Required)" : "Select Vendor"}</MenuItem>
                            {mappedVendors.length > 0 ? mappedVendors.map(v => (
                              <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
                            )) : <MenuItem disabled>{item.sku ? 'No vendors mapped' : 'Select SKU first'}</MenuItem>}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity}
                            onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                            inputProps={{ min: 1 }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleRemoveItem(idx)} size="small"><DeleteIcon /></IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Button onClick={handleAddItem} variant="outlined" size="small">Add Item</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          </DialogContent>
          <DialogActions sx={{ p: '16px 24px' }}>
            <Button onClick={handleCloseCreateDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                form.items.length === 0 ||
                !form.departmentName ||
                !form.requestedBy ||
                !form.expectedNeededDate ||
                form.items.some(item => {
                  const skuObj = skus.find(s => s._id === item.sku);
                  const mappedVendors = skuObj?.alternateSuppliers?.length
                    ? vendors.filter(v => skuObj.alternateSuppliers.includes(v._id))
                    : [];
                  return mappedVendors.length > 0 && !item.vendor;
                })
              }
            >
              Save Indent
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">All Indents</Typography>
        {loading ? <CircularProgress /> : (
          indents.length === 0 ? <Typography>No Data available</Typography> : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Indent ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Items</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {indents.map(indent => (
                    <TableRow key={indent._id}>
                      <TableCell>{indent._id}</TableCell>
                      <TableCell>{indent.status}</TableCell>
                      <TableCell>{new Date(indent.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        {(indent.items || []).map((it, i) => {
                          const sku = skus.find(s => s._id === it.sku);
                          const vendor = vendors.find(v => v._id === it.vendor);
                          return <div key={i}>{sku?.name} ({sku?.sku}) - {vendor?.name || 'No Vendor'} x {it.quantity}</div>;
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}
      </Box>
      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
}

export default Indent;
