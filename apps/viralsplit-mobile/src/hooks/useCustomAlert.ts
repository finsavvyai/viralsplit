import { useState } from 'react';

interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  primaryButton?: {
    text: string;
    onPress?: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress?: () => void;
  };
}

interface AlertState extends AlertOptions {
  visible: boolean;
}

export const useCustomAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (options: AlertOptions) => {
    setAlertState({
      ...options,
      visible: true,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({
      ...prev,
      visible: false,
    }));
  };

  // Convenience methods for different alert types
  const showSuccess = (title: string, message: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'success',
      primaryButton: { text: 'Great!', onPress },
    });
  };

  const showError = (title: string, message: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'error',
      primaryButton: { text: 'Try Again', onPress },
    });
  };

  const showWarning = (title: string, message: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'warning',
      primaryButton: { text: 'OK', onPress },
    });
  };

  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    showAlert({
      title,
      message,
      type: 'warning',
      primaryButton: { text: 'Confirm', onPress: onConfirm },
      secondaryButton: { text: 'Cancel', onPress: onCancel },
    });
  };

  return {
    alertState,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
  };
};