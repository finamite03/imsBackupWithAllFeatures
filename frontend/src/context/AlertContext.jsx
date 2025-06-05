
import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert, AlertTitle, Slide } from '@mui/material';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (message, severity = 'info', title = null, duration = 6000) => {
    const id = Date.now();
    const newAlert = {
      id,
      message,
      severity,
      title,
      open: true,
      duration
    };

    setAlerts(prev => [...prev, newAlert]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const showSuccess = (message, title = 'Success') => {
    showAlert(message, 'success', title);
  };

  const showError = (message, title = 'Error') => {
    showAlert(message, 'error', title);
  };

  const showWarning = (message, title = 'Warning') => {
    showAlert(message, 'warning', title);
  };

  const showInfo = (message, title = 'Info') => {
    showAlert(message, 'info', title);
  };

  const value = {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeAlert
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      {alerts.map((alert) => (
        <Snackbar
          key={alert.id}
          open={alert.open}
          autoHideDuration={alert.duration}
          onClose={() => removeAlert(alert.id)}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ 
            top: `${60 + (alerts.indexOf(alert) * 80)}px !important`,
            zIndex: 9999
          }}
        >
          <Alert 
            onClose={() => removeAlert(alert.id)} 
            severity={alert.severity}
            variant="filled"
            sx={{ minWidth: '300px' }}
          >
            {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
            {alert.message}
          </Alert>
        </Snackbar>
      ))}
    </AlertContext.Provider>
  );
};
