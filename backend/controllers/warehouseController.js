
import asyncHandler from 'express-async-handler';
import Warehouse from '../models/warehouseModel.js';

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Private
export const getWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await Warehouse.find({});
  res.json(warehouses);
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

// @desc    Create a warehouse
// @route   POST /api/warehouses
// @access  Private
export const createWarehouse = asyncHandler(async (req, res) => {
  const warehouse = new Warehouse(req.body);
  const createdWarehouse = await warehouse.save();
  res.status(201).json(createdWarehouse);
});

// @desc    Update a warehouse
// @route   PUT /api/warehouses/:id
// @access  Private
export const updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);

  if (warehouse) {
    Object.assign(warehouse, req.body);
    const updatedWarehouse = await warehouse.save();
    res.json(updatedWarehouse);
  } else {
    res.status(404);
    throw new Error('Warehouse not found');
  }
});

// @desc    Delete a warehouse
// @route   DELETE /api/warehouses/:id
// @access  Private
export const deleteWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);

  if (warehouse) {
    await warehouse.deleteOne();
    res.json({ message: 'Warehouse removed' });
  } else {
    res.status(404);
    throw new Error('Warehouse not found');
  }
});
