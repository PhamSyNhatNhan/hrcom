'use client';
import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X, AlertTriangle } from 'lucide-react';
import { NotificationData } from '@/hooks/useNotification';

interface NotificationProps {
    notifications: NotificationData[];
    onRemove: (id: string) => void;
    maxVisible?: number;
}

const Notification: React.FC<NotificationProps> = ({
                                                       notifications,
                                                       onRemove,
                                                       maxVisible = 3
                                                   }) => {
    const visibleNotifications = notifications.slice(0, maxVisible);

    const NotificationItem: React.FC<{
        notification: NotificationData;
        index: number;
        onRemove: (id: string) => void;
    }> = ({ notification, index, onRemove }) => {
        const [isVisible, setIsVisible] = useState(false);
        const [isLeaving, setIsLeaving] = useState(false);

        useEffect(() => {
            // Enter animation
            const timer = setTimeout(() => setIsVisible(true), 50);

            // Auto dismiss
            if (notification.duration && notification.duration > 0) {
                const autoRemoveTimer = setTimeout(() => {
                    handleRemove();
                }, notification.duration);

                return () => {
                    clearTimeout(timer);
                    clearTimeout(autoRemoveTimer);
                };
            }

            return () => clearTimeout(timer);
        }, [notification.duration]);

        const handleRemove = () => {
            setIsLeaving(true);
            setTimeout(() => {
                onRemove(notification.id);
            }, 300);
        };

        const getIcon = () => {
            const iconClass = "w-5 h-5 flex-shrink-0";

            switch (notification.type) {
                case 'success':
                    return <CheckCircle className={`${iconClass} text-green-600`} />;
                case 'error':
                    return <XCircle className={`${iconClass} text-red-600`} />;
                case 'warning':
                    return <AlertTriangle className={`${iconClass} text-yellow-600`} />;
                case 'info':
                    return <Info className={`${iconClass} text-blue-600`} />;
                default:
                    return <AlertCircle className={`${iconClass} text-blue-600`} />;
            }
        };

        const getStyles = () => {
            const baseStyles = "border shadow-lg backdrop-blur-sm rounded-xl";

            switch (notification.type) {
                case 'success':
                    return `${baseStyles} bg-green-50/95 border-green-200 text-green-800`;
                case 'error':
                    return `${baseStyles} bg-red-50/95 border-red-200 text-red-800`;
                case 'warning':
                    return `${baseStyles} bg-yellow-50/95 border-yellow-200 text-yellow-800`;
                case 'info':
                    return `${baseStyles} bg-blue-50/95 border-blue-200 text-blue-800`;
                default:
                    return `${baseStyles} bg-white border-gray-200 text-gray-800`;
            }
        };

        const getProgressBarColor = () => {
            switch (notification.type) {
                case 'success':
                    return 'bg-green-500';
                case 'error':
                    return 'bg-red-500';
                case 'warning':
                    return 'bg-yellow-500';
                case 'info':
                    return 'bg-blue-500';
                default:
                    return 'bg-gray-500';
            }
        };

        const animationClasses = isLeaving
            ? 'opacity-0 scale-90 translate-y-2'
            : isVisible
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 -translate-y-2';

        return (
            <div
                className={`
                    fixed z-50 w-full px-4 transition-all duration-300 ease-out
                    top-4 left-0 right-0
                    ${animationClasses}
                `}
                style={{
                    zIndex: 9999 - index,
                    transform: `translateY(${index * 80}px)`
                }}
            >
                <div className={`max-w-sm mx-auto sm:max-w-md md:max-w-lg relative p-4 ${getStyles()}`}>
                    {/* Progress bar */}
                    {notification.duration && notification.duration > 0 && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 rounded-t-xl overflow-hidden">
                            <div
                                className={`h-full ${getProgressBarColor()} transition-all ease-linear`}
                                style={{
                                    width: '100%',
                                    animation: `shrink ${notification.duration}ms linear forwards`
                                }}
                            />
                        </div>
                    )}

                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="mt-0.5">
                            {getIcon()}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-2">
                            <h4 className="text-sm font-semibold mb-1 leading-tight">
                                {notification.title}
                            </h4>
                            <p className="text-sm leading-relaxed opacity-90 break-words">
                                {notification.message}
                            </p>

                            {/* Action button */}
                            {notification.action && (
                                <button
                                    onClick={notification.action.onClick}
                                    className="mt-3 text-sm font-medium underline hover:no-underline transition-all duration-200"
                                >
                                    {notification.action.label}
                                </button>
                            )}
                        </div>

                        {/* Close button */}
                        {notification.dismissible !== false && (
                            <button
                                onClick={handleRemove}
                                className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors duration-200 ml-2"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* CSS Animation */}
                <style jsx>{`
                    @keyframes shrink {
                        from { width: 100%; }
                        to { width: 0%; }
                    }
                `}</style>
            </div>
        );
    };

    return (
        <>
            {visibleNotifications.map((notification, index) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    index={index}
                    onRemove={onRemove}
                />
            ))}
        </>
    );
};

export default Notification;