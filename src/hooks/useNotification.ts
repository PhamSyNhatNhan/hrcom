'use client';
import { useState, useCallback } from 'react';

// Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationData {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    duration?: number; // milliseconds, 0 = no auto dismiss
    dismissible?: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export interface NotificationOptions {
    duration?: number;
    dismissible?: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
}

// Main hook for managing notifications
export const useNotification = (maxNotifications: number = 5, defaultDuration: number = 5000) => {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);

    const addNotification = useCallback((
        type: NotificationType,
        title: string,
        message: string,
        options: NotificationOptions = {}
    ): string => {
        const notification: NotificationData = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            title,
            message,
            duration: options.duration ?? defaultDuration,
            dismissible: options.dismissible ?? true,
            action: options.action
        };

        setNotifications(prev => {
            const newNotifications = [notification, ...prev];
            return newNotifications.slice(0, maxNotifications);
        });

        return notification.id;
    }, [defaultDuration, maxNotifications]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const updateNotification = useCallback((id: string, updates: Partial<NotificationData>) => {
        setNotifications(prev => prev.map(notification =>
            notification.id === id
                ? { ...notification, ...updates }
                : notification
        ));
    }, []);

    // Convenience methods
    const showSuccess = useCallback((title: string, message: string, options?: NotificationOptions) =>
        addNotification('success', title, message, options), [addNotification]);

    const showError = useCallback((title: string, message: string, options?: NotificationOptions) =>
        addNotification('error', title, message, options), [addNotification]);

    const showWarning = useCallback((title: string, message: string, options?: NotificationOptions) =>
        addNotification('warning', title, message, options), [addNotification]);

    const showInfo = useCallback((title: string, message: string, options?: NotificationOptions) =>
        addNotification('info', title, message, options), [addNotification]);

    return {
        notifications,
        addNotification,
        removeNotification,
        updateNotification,
        clearAll,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };
};

// Utility functions for common notification patterns
export const notificationUtils = {
    // API Error notifications
    apiError: (error: any, customTitle?: string) => {
        const title = customTitle || 'Lỗi API';
        let message = 'Đã xảy ra lỗi không xác định';

        if (typeof error === 'string') {
            message = error;
        } else if (error?.message) {
            message = error.message;
        } else if (error?.error?.message) {
            message = error.error.message;
        } else if (error?.response?.data?.message) {
            message = error.response.data.message;
        }

        return { type: 'error' as const, title, message };
    },

    // Network Error
    networkError: (customMessage?: string) => ({
        type: 'error' as const,
        title: 'Lỗi kết nối',
        message: customMessage || 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.'
    }),

    // Validation Error
    validationError: (field: string, customMessage?: string) => ({
        type: 'warning' as const,
        title: 'Dữ liệu không hợp lệ',
        message: customMessage || `${field} không được để trống hoặc không đúng định dạng.`
    }),

    // Permission Error
    permissionError: (action?: string) => ({
        type: 'warning' as const,
        title: 'Không đủ quyền',
        message: `Bạn không có quyền ${action || 'thực hiện hành động này'}. Vui lòng liên hệ quản trị viên.`
    }),

    // Success operations
    saveSuccess: (item?: string) => ({
        type: 'success' as const,
        title: 'Lưu thành công',
        message: `${item || 'Dữ liệu'} đã được lưu thành công.`
    }),

    deleteSuccess: (item?: string) => ({
        type: 'success' as const,
        title: 'Xóa thành công',
        message: `${item || 'Dữ liệu'} đã được xóa thành công.`
    }),

    updateSuccess: (item?: string) => ({
        type: 'success' as const,
        title: 'Cập nhật thành công',
        message: `${item || 'Dữ liệu'} đã được cập nhật thành công.`
    }),

    createSuccess: (item?: string) => ({
        type: 'success' as const,
        title: 'Tạo thành công',
        message: `${item || 'Dữ liệu'} đã được tạo thành công.`
    }),

    // Loading states
    uploadProgress: (progress: number) => ({
        type: 'info' as const,
        title: 'Đang tải lên...',
        message: `Tiến độ: ${progress}%`,
        duration: 0, // Don't auto dismiss
        dismissible: false
    }),

    // Login/Auth related
    loginSuccess: (userName?: string) => ({
        type: 'success' as const,
        title: 'Đăng nhập thành công',
        message: `Chào mừng ${userName || 'bạn'} đã quay trở lại!`
    }),

    logoutSuccess: () => ({
        type: 'info' as const,
        title: 'Đã đăng xuất',
        message: 'Bạn đã đăng xuất thành công.'
    }),

    // Generic info
    info: (title: string, message: string) => ({
        type: 'info' as const,
        title,
        message
    })
};

// Hook with pre-built utility functions
export const useNotificationWithUtils = (maxNotifications?: number, defaultDuration?: number) => {
    const notification = useNotification(maxNotifications, defaultDuration);

    // API Error handler
    const showApiError = useCallback((error: any, customTitle?: string, options?: NotificationOptions) => {
        const { type, title, message } = notificationUtils.apiError(error, customTitle);
        return notification.addNotification(type, title, message, options);
    }, [notification]);

    // Network Error handler
    const showNetworkError = useCallback((customMessage?: string, options?: NotificationOptions) => {
        const { type, title, message } = notificationUtils.networkError(customMessage);
        return notification.addNotification(type, title, message, options);
    }, [notification]);

    // Validation Error handler
    const showValidationError = useCallback((field: string, customMessage?: string, options?: NotificationOptions) => {
        const { type, title, message } = notificationUtils.validationError(field, customMessage);
        return notification.addNotification(type, title, message, options);
    }, [notification]);

    // Permission Error handler
    const showPermissionError = useCallback((action?: string, options?: NotificationOptions) => {
        const { type, title, message } = notificationUtils.permissionError(action);
        return notification.addNotification(type, title, message, options);
    }, [notification]);

    // Success handlers
    const showSaveSuccess = useCallback((item?: string, options?: NotificationOptions) => {
        const { type, title, message } = notificationUtils.saveSuccess(item);
        return notification.addNotification(type, title, message, options);
    }, [notification]);

    const showDeleteSuccess = useCallback((item?: string, options?: NotificationOptions) => {
        const { type, title, message } = notificationUtils.deleteSuccess(item);
        return notification.addNotification(type, title, message, options);
    }, [notification]);

    const showUpdateSuccess = useCallback((item?: string, options?: NotificationOptions) => {
        const { type, title, message } = notificationUtils.updateSuccess(item);
        return notification.addNotification(type, title, message, options);
    }, [notification]);

    const showCreateSuccess = useCallback((item?: string, options?: NotificationOptions) => {
        const { type, title, message } = notificationUtils.createSuccess(item);
        return notification.addNotification(type, title, message, options);
    }, [notification]);

    const showLoginSuccess = useCallback((userName?: string, options?: NotificationOptions) => {
        const { type, title, message } = notificationUtils.loginSuccess(userName);
        return notification.addNotification(type, title, message, options);
    }, [notification]);

    const showLogoutSuccess = useCallback((options?: NotificationOptions) => {
        const { type, title, message } = notificationUtils.logoutSuccess();
        return notification.addNotification(type, title, message, options);
    }, [notification]);

    // Progress handler for uploads, etc.
    const showProgress = useCallback((progress: number, options?: NotificationOptions) => {
        const { type, title, message, duration, dismissible } = notificationUtils.uploadProgress(progress);
        return notification.addNotification(type, title, message, {
            duration,
            dismissible,
            ...options
        });
    }, [notification]);

    return {
        ...notification,
        // Utility methods
        showApiError,
        showNetworkError,
        showValidationError,
        showPermissionError,
        showSaveSuccess,
        showDeleteSuccess,
        showUpdateSuccess,
        showCreateSuccess,
        showLoginSuccess,
        showLogoutSuccess,
        showProgress
    };
};

// Simple toast hook (minimal, for quick usage)
export const useToast = () => {
    const { showSuccess, showError, showWarning, showInfo } = useNotification();

    return {
        success: (message: string, title: string = 'Thành công') =>
            showSuccess(title, message, { duration: 3000 }),
        error: (message: string, title: string = 'Lỗi') =>
            showError(title, message, { duration: 5000 }),
        warning: (message: string, title: string = 'Cảnh báo') =>
            showWarning(title, message, { duration: 4000 }),
        info: (message: string, title: string = 'Thông tin') =>
            showInfo(title, message, { duration: 4000 })
    };
};