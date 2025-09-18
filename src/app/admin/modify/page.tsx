'use client';
import React, { useState } from 'react';
import { SectionHeader } from '@/component/SectionHeader';
import {
    Users,
    AlertTriangle
} from 'lucide-react';

// Import tab components
import UserManagementTab from '@/component/admin/modify/UserManagementTab';

type TabType = 'users'; // Chỉ còn một tab

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

                {/* Simple Tab Navigation */}
                <div className="mb-8 bg-white rounded-xl shadow-sm">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex px-6">
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
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <UserManagementTab
                        key={refreshKey}
                        showNotification={showNotification}
                    />
                </div>
            </div>
        </div>
    );
}