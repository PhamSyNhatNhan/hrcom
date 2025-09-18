'use client';
import React, { useState } from 'react';
import { SectionHeader } from '@/component/SectionHeader';
import {
    Users,
    Settings,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';

// Import tab components
import UserManagementTab from '@/component/admin/modify/UserManagementTab';

type TabType = 'users' | 'settings'; // Có thể mở rộng thêm tab khác

export default function AdminModifyPage() {
    const [activeTab, setActiveTab] = useState<TabType>('users');
    const [refreshKey, setRefreshKey] = useState(0);

    // Notification state
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
    } | null>(null);

    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // Handle tab refresh
    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            {/* Notification */}
            {notification && (
                <div
                    className={`fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg max-w-sm w-full ${
                        notification.type === 'success'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : notification.type === 'error'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}
                >
                    <div className="flex items-center">
                        {notification.type === 'success' && <div className="w-5 h-5 mr-2 flex-shrink-0 rounded-full bg-green-500 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>}
                        {notification.type === 'error' && <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />}
                        {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />}
                        <span className="flex-1">{notification.message}</span>
                        <button
                            onClick={() => setNotification(null)}
                            className="ml-4 text-gray-500 hover:text-gray-700 flex-shrink-0"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <SectionHeader
                        title="QUẢN LÝ HỆ THỐNG"
                        subtitle="Trang quản lý đặc biệt dành cho Super Admin - Thực hiện các thao tác quan trọng với hệ thống"
                    />

                    {/* Warning Banner */}
                    <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <strong>Cảnh báo:</strong> Các thao tác trên trang này có thể ảnh hưởng nghiêm trọng đến hệ thống.
                                    Vui lòng thực hiện cẩn thận.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="mb-8 bg-white rounded-xl shadow-sm">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`${
                                    activeTab === 'users'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                            >
                                <Users className="w-4 h-4" />
                                Quản lý User
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`${
                                    activeTab === 'settings'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                                disabled
                            >
                                <Settings className="w-4 h-4" />
                                Cài đặt hệ thống
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                    Sắp có
                                </span>
                            </button>
                        </nav>
                    </div>

                    {/* Tab Controls */}
                    <div className="p-6 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Đang hoạt động với quyền: <span className="font-semibold text-red-600">Super Admin</span>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Làm mới
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {activeTab === 'users' && (
                        <UserManagementTab
                            key={refreshKey}
                            showNotification={showNotification}
                        />
                    )}

                    {activeTab === 'settings' && (
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Settings className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Cài đặt hệ thống
                            </h3>
                            <p className="text-gray-600">
                                Tab này sẽ được phát triển trong tương lai để quản lý các cài đặt hệ thống.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}