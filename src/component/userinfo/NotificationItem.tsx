import React from 'react';
import { CheckCircle, AlertCircle, XCircle, X } from 'lucide-react';
import { Notification } from '@/app/user/page';

export const NotificationItem: React.FC<{
  notification: Notification;
  remove: (id: string) => void;
}> = ({ notification, remove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className={`mb-3 rounded-lg border p-4 shadow-lg ${getBgColor()}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="flex-grow">
          <h4 className={`text-sm font-semibold ${getTextColor()}`}>{notification.title}</h4>
          <p className={`mt-1 text-sm ${getTextColor()}`}>{notification.message}</p>
        </div>
        <button
          onClick={() => remove(notification.id)}
          className={`p-1 hover:bg-black/10 rounded-lg ${getTextColor()}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
