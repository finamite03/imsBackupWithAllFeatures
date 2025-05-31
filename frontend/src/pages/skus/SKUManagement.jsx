import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Pagination,
  Alert,
  Skeleton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
  Paper,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Archive as ArchiveIcon,
  Sort as SortIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

import SKUCard from '../../components/skus/SKUCard';
import SKUTableView from '../../components/skus/SKUTableView';
import SKUFilterDialog from '../../components/skus/SKUFilterDialog';

function SKUManagement() {
  const navigate = useNavigate();
  const [skus, setSkUs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0); // Changed to 0-based for TablePagination
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [viewMode, setViewMode] = useState('grid');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [filters, setFilters] = useState({
    category: [],
    warehouse: [],
    minStock: '',
    maxStock: '',
    supplier: []
  });
  const [selectedSku, setSelectedSku] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Sort options
  const sortOptions = [
    { value: 'name', label: 'Product Name' },
    { value: 'sku', label: 'SKU Code' },
    { value: 'category', label: 'Category' },
    { value: 'sellingPrice', label: 'Selling Price' },
    { value: 'costPrice', label: 'Cost Price' },
    { value: 'currentStock', label: 'Current Stock' },
    { value: 'lastUpdated', label: 'Last Updated' }
  ];

  useEffect(() => {
    fetchSKUs();
    fetchWarehouses();
    fetchSuppliers();
    fetchCategories();
  }, [page, rowsPerPage, filters, sortBy, sortOrder]);

  // This is a mock function that would normally fetch data from the API
  const fetchSKUs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/skus', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          sortBy,
          sortOrder,
          ...filters
        }
      });
      let fetchedSkus = response.data.skus;

      // Frontend sorting fallback if backend doesn't sort
      if (!response.data.sorted) { // Assume backend can set this flag if sorted
        fetchedSkus = [...fetchedSkus].sort((a, b) => {
          let aValue = a[sortBy];
          let bValue = b[sortBy];
          if (typeof aValue === 'string') aValue = aValue.toLowerCase();
          if (typeof bValue === 'string') bValue = bValue.toLowerCase();
          if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }

      setSkUs(fetchedSkus);
      setTotalPages(response.data.pages);
      setTotalCount(response.data.total);
      setLoading(false);
    } catch (err) {
      setError('Failed to load SKUs. Please try again later.');
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get('/api/warehouses');
      setWarehouses(res.data.warehouses || []);
    } catch (err) {
      setWarehouses([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get('/api/suppliers');
      setSuppliers(res.data.suppliers || []);
    } catch (err) {
      setSuppliers([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      setCategories([]);
    }
  };

  const handleSearch = () => {
    setPage(0); // Reset to first page
    fetchSKUs();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters);
    setPage(0);
    setFilterDialogOpen(false);
  };

  const handleFilterReset = () => {
    setFilters({
      category: [],
      warehouse: [],
      minStock: '',
      maxStock: '',
      supplier: []
    });
    setPage(0);
    setFilterDialogOpen(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setSortMenuAnchor(null);
    setPage(0);
  };

  const handleDeleteSKU = async () => {
    if (!selectedSku) return;
    try {
      await axios.delete(`/api/skus/${selectedSku._id}`);
      toast.success(`SKU ${selectedSku.sku} deleted successfully`);
      // Remove from state using _id
      setSkUs((prevSkus) => prevSkus.filter(sku => sku._id !== selectedSku._id));
      setDeleteDialogOpen(false);
      setSelectedSku(null);
      // Optionally, re-fetch to ensure pagination is correct
      fetchSKUs();
    } catch (error) {
      toast.error('Failed to delete SKU. Please try again.');
    }
  };

  const handleMenuOpen = (event, sku) => {
    setAnchorEl(event.currentTarget);
    setSelectedSku(sku);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditSKU = () => {
    handleMenuClose();
    navigate(`/skus/edit/${selectedSku.id}`);
  };

  const handleViewSKU = () => {
    handleMenuClose();
    navigate(`/skus/${selectedSku.id}`);
  };

  const handleOpenDeleteDialog = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  // Calculate displayed entries
  const startEntry = page * rowsPerPage + 1;
  const endEntry = Math.min((page + 1) * rowsPerPage, totalCount);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
          SKU Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/skus/add')}
          sx={{ py: 1.2 }}
        >
          Add New SKU
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} lg={6}>
            <TextField
              fullWidth
              placeholder="Search by SKU, name, or barcode..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={6}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<FilterListIcon />}
                onClick={() => setFilterDialogOpen(true)}
              >
                Filters
                {Object.values(filters).some(f => 
                  Array.isArray(f) ? f.length > 0 : f !== ''
                ) && (
                  <Chip 
                    label={Object.values(filters).flat().filter(Boolean).length} 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Button>
              <Button
                variant="outlined"
                startIcon={<SortIcon />}
                endIcon={sortOrder === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
              >
                Sort: {sortOptions.find(opt => opt.value === sortBy)?.label}
              </Button>
              <Button
                variant="outlined"
                color={viewMode === 'grid' ? 'primary' : 'inherit'}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant="outlined"
                color={viewMode === 'table' ? 'primary' : 'inherit'}
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Results Summary */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 2, 
          bgcolor: 'grey.50',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {loading ? (
            <Skeleton width={200} />
          ) : (
            `Showing ${startEntry} to ${endEntry} of ${totalCount} entries`
          )}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Rows per page:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              variant="outlined"
            >
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={200}>200</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>
      
      {viewMode === 'grid' ? (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Grid container spacing={3}>
              {loading ? (
                // Skeleton loading - show based on rowsPerPage
                Array(Math.min(rowsPerPage, 12)).fill(0).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${index}`}>
                    <motion.div variants={itemVariants}>
                      <Card sx={{ height: '100%', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)' }}>
                        <Skeleton variant="rectangular" width="100%" height={140} />
                        <CardContent>
                          <Skeleton variant="text" width="80%" height={28} />
                          <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                            <Skeleton variant="text" width="30%" height={24} />
                            <Skeleton variant="circular" width={32} height={32} />
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))
              ) : (
                skus.map((sku) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={sku._id}>
                    <motion.div variants={itemVariants}>
                      <SKUCard 
                        sku={sku} 
                        onEdit={() => navigate(`/skus/edit/${sku._id}`)}
                        onView={() => navigate(`/skus/${sku._id}`)}
                        onDelete={() => {
                          setSelectedSku(sku);
                          setDeleteDialogOpen(true);
                        }}
                      />
                    </motion.div>
                  </Grid>
                ))
              )}
            </Grid>
          </motion.div>
        </>
      ) : (
        <Box>
          {loading ? (
            <>
              <Skeleton variant="rectangular" width="100%" height={56} />
              {Array(Math.min(rowsPerPage, 10)).fill(0).map((_, index) => (
                <Skeleton key={index} variant="rectangular" width="100%" height={52} sx={{ mt: 0.5 }} />
              ))}
            </>
          ) : (
            <SKUTableView
              skus={skus}
              onEdit={(id) => navigate(`/skus/edit/${id}`)}
              onView={(id) => navigate(`/skus/${id}`)}
              onDelete={(sku) => {
                setSelectedSku(sku);
                setDeleteDialogOpen(true);
              }}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSortChange}
            />
          )}
        </Box>
      )}

      {/* Enhanced Pagination */}
      <Paper elevation={0} sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {loading ? (
              <Skeleton width={150} />
            ) : (
              `Showing ${startEntry} to ${endEntry} of ${totalCount} entries`
            )}
          </Typography>
          
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[50, 100, 200]}
            showFirstButton
            showLastButton
            sx={{
              '& .MuiTablePagination-toolbar': {
                minHeight: 'auto',
                paddingLeft: 0,
                paddingRight: 0,
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                margin: 0,
              }
            }}
          />
        </Box>
      </Paper>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        {sortOptions.map((option) => (
          <MenuItem 
            key={option.value}
            onClick={() => handleSortChange(option.value)}
            selected={sortBy === option.value}
          >
            <ListItemText>{option.label}</ListItemText>
            {sortBy === option.value && (
              <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                {sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
              </ListItemIcon>
            )}
          </MenuItem>
        ))}
      </Menu>

      {/* Filter Dialog */}
      <SKUFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filters={filters}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
        warehouses={warehouses}
        suppliers={suppliers}
        categories={categories}
        onCreateCategory={() => setCategoryDialogOpen(true)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete SKU <strong>{selectedSku?.sku}</strong> - {selectedSku?.name}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteSKU} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewSKU}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditSKU}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit SKU</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenDeleteDialog}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>

      {/* Add Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)}>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              try {
                await axios.post('/api/categories', { name: newCategory });
                setCategoryDialogOpen(false);
                setNewCategory('');
                fetchCategories();
                toast.success('Category created!');
              } catch {
                toast.error('Failed to create category');
              }
            }}
            variant="contained"
            disabled={!newCategory.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SKUManagement;