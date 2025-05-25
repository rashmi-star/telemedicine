import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  type: NotificationType;
  message: string;
  duration?: number;
  onClose?: () => void;
  show: boolean;
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  duration = 5000,
  onClose,
  show
}) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
    
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch(type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-500',
          text: 'text-green-800',
          icon: <CheckCircle className="h-5 w-5 text-green-500" />
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          text: 'text-red-800',
          icon: <XCircle className="h-5 w-5 text-red-500" />
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-500',
          text: 'text-yellow-800',
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          text: 'text-blue-800',
          icon: <Info className="h-5 w-5 text-blue-500" />
        };
    }
  };

  const styles = getTypeStyles();

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full shadow-lg transition-opacity duration-300 ease-in-out">
      <div className={`${styles.bg} border-l-4 ${styles.border} p-4 rounded flex items-start`}>
        <div className="flex-shrink-0 mr-3">
          {styles.icon}
        </div>
        <div className={`mr-2 flex-1 ${styles.text}`}>
          <p className="font-medium">{message}</p>
        </div>
        <button 
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// Create a notification context to manage notifications across the app
import { createContext, useContext } from 'react';

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, duration?: number) => void;
  hideNotification: () => void;
}

export const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
  hideNotification: () => {}
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
    duration: number;
    show: boolean;
  }>({
    type: 'info',
    message: '',
    duration: 5000,
    show: false
  });

  const showNotification = (type: NotificationType, message: string, duration = 5000) => {
    setNotification({
      type,
      message,
      duration,
      show: true
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      <Notification 
        type={notification.type}
        message={notification.message}
        duration={notification.duration}
        onClose={hideNotification}
        show={notification.show}
      />
    </NotificationContext.Provider>
  );
}; 