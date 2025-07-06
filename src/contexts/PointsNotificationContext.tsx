import React, { createContext, useContext, useState, useCallback } from 'react';

interface PointNotification {
  id: string;
  points: number;
  type: 'learning' | 'influence';
  source: string;
  icon?: string;
  timestamp: Date;
}

interface PointsNotificationContextType {
  notifications: PointNotification[];
  addNotification: (notification: Omit<PointNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const PointsNotificationContext = createContext<PointsNotificationContextType | undefined>(undefined);

export const PointsNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<PointNotification[]>([]);

  const addNotification = useCallback((notification: Omit<PointNotification, 'id' | 'timestamp'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newNotification = { ...notification, id, timestamp: new Date() };
    
    console.log('🎯 新しいポイント通知を追加:', newNotification);
    
    setNotifications(prev => [...prev, newNotification]);
    
    // 5秒後に自動削除
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <PointsNotificationContext.Provider value={{ 
      notifications, 
      addNotification, 
      removeNotification, 
      clearAllNotifications 
    }}>
      {children}
    </PointsNotificationContext.Provider>
  );
};

export const usePointsNotification = () => {
  const context = useContext(PointsNotificationContext);
  if (!context) {
    throw new Error('usePointsNotification must be used within PointsNotificationProvider');
  }
  return context;
};