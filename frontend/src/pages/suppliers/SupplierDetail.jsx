import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";

function SupplierDetail() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const { data } = await axios.get(`/api/suppliers/${id}`);
        setSupplier(data);
      } catch (err) {
        setError("Failed to load supplier details");
      } finally {
        setLoading(false);
      }
    };
    fetchSupplier();
  }, [id]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!supplier) return null;

  return (
    <Box>
      <Typography variant="h4">{supplier.name}</Typography>
      <Typography>Contact: {supplier.contactPerson}</Typography>
      <Typography>Email: {supplier.email}</Typography>
      <Typography>Phone: {supplier.phone}</Typography>
      <Typography>
        Alternate Contact Number: {supplier.alternatePhone || 'N/A'}
      </Typography>
      <Typography>
        Address: {supplier.address?.street}, {supplier.address?.city}, {supplier.address?.state} - {supplier.address?.pincode}
      </Typography>
      {/* Add more fields as needed */}
    </Box>
  );
}

export default SupplierDetail;