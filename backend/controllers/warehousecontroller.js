import asyncHandler from 'express-async-handler';
import Warehouse from '../models/warehouseModel.js';

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Private
export const getWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await Warehouse.find({});
  res.json(warehouses);
});

// @desc    Create a new warehouse
// @route   POST /api/warehouses
// @access  Private
export const createWarehouse = asyncHandler(async (req, res) => {
  const { name, code, manager, email, phone, capacity, status, address, notes } = req.body;

  // Check if code already exists
  const exists = await Warehouse.findOne({ code });
  if (exists) {
    res.status(400);
    throw new Error('Warehouse code already exists');
  }

  const warehouse = await Warehouse.create({
    name,
    code,
    manager,
    email,
    phone,
    capacity,
    status,
    address,
    notes,
    user: req.user._id,
  });

  res.status(201).json(warehouse);
});

// @desc    Get warehouse by ID
// @route   GET /api/warehouses/:id
// @access  Private
export const getWarehouseById = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);
  if (warehouse) {
    res.json(warehouse);
  } else {
    res.status(404);
    throw new Error('Warehouse not found');
  }
});

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
// @access  Private
export const updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);
  if (!warehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }

  Object.assign(warehouse, req.body);
  await warehouse.save();
  res.json(warehouse);
});

// @desc    Delete warehouse
// @route   DELETE /api/warehouses/:id
// @access  Private
export const deleteWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);
  if (!warehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }
  try {
    await warehouse.deleteOne();
    res.json({ message: 'Warehouse removed' });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({ message: error.message });
  }
});