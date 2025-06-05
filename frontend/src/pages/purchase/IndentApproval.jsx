import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Select, MenuItem, CircularProgress, IconButton, TextField, InputAdornment, Tabs, Tab
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';

function IndentApproval() {
  const [indents, setIndents] = useState([]);
  const [skus, setSkus] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // indent id
  const [editItems, setEditItems] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [indentRes, skuRes, vendorRes] = await Promise.all([
        axios.get('/api/purchase-indents'),
        axios.get('/api/skus'),
        axios.get('/api/suppliers'),
      ]);
      setIndents(indentRes.data || []);
      setSkus(skuRes.data.skus || skuRes.data);
      setVendors(vendorRes.data.suppliers || vendorRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleEdit = (indent) => {
    setEditing(indent._id);
    setEditItems(indent.items.map(it => ({ ...it })));
  };

  const handleItemChange = (idx, field, value) => {
    setEditItems(items => {
      const arr = [...items];
      arr[idx][field] = value;
      if (field === 'sku') arr[idx].vendor = '';
      return arr;
    });
  };

  const handleSave = async () => {
    try {
      await axios.put(`/api/purchase-indents/${editing}`, { items: editItems });
      setEditing(null);
      setEditItems([]);
      fetchData();
    } catch {
      setError('Failed to update indent');
    }
  };

  const handleApprove = async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user._id) {
        setError('User not found. Please log in again.');
        return;
      }
      await axios.post(`/api/purchase-indents/${id}/approve`, { userId: user._id });
      fetchData();
    } catch {
      setError('Failed to approve indent');
    }
  };

  // Filter indents by search (by indent ID or SKU name)
  const filteredIndents = indents.filter(i => {
    if (!search) return true;
    const idMatch = i._id.toLowerCase().includes(search.toLowerCase());
    const skuMatch = (i.items || []).some(it => {
      const sku = skus.find(s => s._id === it.sku);
      return sku?.name?.toLowerCase().includes(search.toLowerCase());
    });
    return idMatch || skuMatch;
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const displayedIndents = filteredIndents.filter(indent => {
    if (activeTab === 0) { // Pending for Approval
      return indent.status === 'Pending';
    }
    if (activeTab === 1) { // Master (Approved & Pending)
      return indent.status === 'Pending' || indent.status === 'Approved';
    }
    return true; // Should not happen if tabs are handled correctly
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Indent Approval</Typography>
      <TextField
        placeholder="Search by Indent ID or SKU name"
        value={search}
        onChange={e => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 2, width: 320 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="indent status tabs">
          <Tab label="Pending for Approval" />
          <Tab label="Master (Approved & Pending)" />
        </Tabs>
      </Box>

      {loading ? <CircularProgress /> : (
        displayedIndents.length === 0 ? (
          <Typography sx={{ mt: 2, textAlign: 'center' }}>No Data available for the selected tab.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small" aria-label="indent approval table">
              <TableHead>
                <TableRow>
                  <TableCell>Indent ID</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedIndents.map(indent => (
                  <TableRow key={indent._id}>
                    <TableCell component="th" scope="row">
                      {indent._id}
                    </TableCell>
                    <TableCell>{new Date(indent.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {editing === indent._id ? (
                        <Table size="small" sx={{ width: '100%' }}>
                          <TableBody>
                            {editItems.map((item, idx) => {
                              const skuObj = skus.find(s => s._id === item.sku);
                              const mappedVendors = skuObj?.alternateSuppliers?.length
                                ? vendors.filter(v => skuObj.alternateSuppliers.includes(v._id))
                                : [];
                              return (
                                <TableRow key={idx}>
                                  <TableCell sx={{ border: 'none', p: 0.5 }}>
                                    <Select
                                      value={item.sku}
                                      onChange={e => handleItemChange(idx, 'sku', e.target.value)}
                                      size="small"
                                      fullWidth
                                    >
                                      {skus.map(sku => (
                                        <MenuItem key={sku._id} value={sku._id}>{sku.name} ({sku.sku})</MenuItem>
                                      ))}
                                    </Select>
                                  </TableCell>
                                  <TableCell sx={{ border: 'none', p: 0.5 }}>
                                    <Select
                                      value={item.vendor}
                                      onChange={e => handleItemChange(idx, 'vendor', e.target.value)}
                                      size="small"
                                      fullWidth
                                      disabled={!item.sku || mappedVendors.length === 0}
                                    >
                                      {mappedVendors.length > 0 ? mappedVendors.map(v => (
                                        <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
                                      )) : <MenuItem disabled>{item.sku ? "No vendors mapped" : "Select SKU first"}</MenuItem>}
                                    </Select>
                                  </TableCell>
                                  {/* Quantity could be displayed or made editable here if needed */}
                                  <TableCell sx={{ border: 'none', p: 0.5, whiteSpace: 'nowrap' }}>
                                    Qty: {item.quantity}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        (indent.items || []).map((it, i) => {
                          const sku = skus.find(s => s._id === it.sku);
                          const vendor = vendors.find(v => v._id === it.vendor);
                          return <div key={i}>{sku?.name || 'N/A'} ({sku?.sku || 'N/A'}) - {vendor?.name || 'No Vendor'} x {it.quantity}</div>;
                        })
                      )}
                    </TableCell>
                    <TableCell>{indent.status}</TableCell>
                    <TableCell>
                      {editing === indent._id ? (
                        <>
                          <Button onClick={handleSave} size="small" variant="contained" color="primary">Save</Button>
                          <Button onClick={() => setEditing(null)} size="small" sx={{ ml: 1 }}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <IconButton onClick={() => handleEdit(indent)} size="small" aria-label="edit indent">
                            <EditIcon />
                          </IconButton>
                          {indent.status === 'Pending' && (
                            <Button onClick={() => handleApprove(indent._id)} size="small" variant="outlined" color="success" sx={{ ml: 1 }}>
                              Approve
                            </Button>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}
      {error && <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>{error}</Typography>}
    </Box>
  );
}

export default IndentApproval;
