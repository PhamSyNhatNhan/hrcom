// src/app/admin/mentor_booking_modify/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { SectionHeader } from '@/component/SectionHeader';
import { CheckCircle, XCircle, AlertCircle, X, Calendar, BarChart3, Settings } from 'lucide-react';
import { BookingTab } from '@/component/admin/mentor_booking/BookingTab';
import {
    MentorBooking,
    BookingFilters,
    PaginationState,
    NotificationState,
    TabType
} from '@/types/mentor_booking_admin';

const ITEMS_PER_PAGE = 20;

const AdminMentorBookingPage = () => {
    const { user } = useAuthStore();

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>('bookings');

    // States
    const [bookings, setBookings] = useState<MentorBooking[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [filters, setFilters] = useState<BookingFilters>({
        searchTerm: '',
        statusFilter: 'all',
        sessionTypeFilter: 'all',
        dateFrom: '',
        dateTo: ''
    });

    // Pagination states
    const [pagination, setPagination] = useState<PaginationState>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        itemsPerPage: ITEMS_PER_PAGE
    });

    // Notification
    const [notification, setNotification] = useState<NotificationState | null>(null);

    // Load data
    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'superadmin')) {
            if (activeTab === 'bookings') {
                loadBookings();
            }
            // Add other tab loading logic here in the future
        }
    }, [user, activeTab, pagination.currentPage, filters]);

    // Reset page when filters change
    useEffect(() => {
        if (pagination.currentPage !== 1) {
            setPagination(prev => ({ ...prev, currentPage: 1 }));
        }
    }, [filters.searchTerm, filters.statusFilter, filters.sessionTypeFilter, filters.dateFrom, filters.dateTo]);

    // Load bookings via RPC
    const loadBookings = async () => {
        try {
            setLoading(true);

            // Calculate pagination
            const from = (pagination.currentPage - 1) * ITEMS_PER_PAGE;

            // Prepare date filters
            const dateFromFilter = filters.dateFrom ? new Date(filters.dateFrom).toISOString() : null;
            const dateToFilter = filters.dateTo ? new Date(filters.dateTo + 'T23:59:59').toISOString() : null;

            const { data, error } = await supabase.rpc('mentor_booking_admin_get_list', {
                p_search_term: filters.searchTerm || null,
                p_status: filters.statusFilter === 'all' ? null : filters.statusFilter,
                p_session_type: filters.sessionTypeFilter === 'all' ? null : filters.sessionTypeFilter,
                p_date_from: dateFromFilter,
                p_date_to: dateToFilter,
                p_limit: ITEMS_PER_PAGE,
                p_offset: from
            });

            if (error) throw error;

            // Extract bookings and count from RPC result
            const bookingsData = data?.bookings || [];
            const totalCount = data?.total_count || 0;

            setBookings(bookingsData);
            setPagination(prev => ({
                ...prev,
                totalCount,
                totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE)
            }));
        } catch (error) {
            console.error('Error loading bookings:', error);
            showNotification('error', 'Không thể tải danh sách đặt lịch');
        } finally {
            setLoading(false);
        }
    };

    // Show notification
    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // Handle filters change
    const handleFiltersChange = (newFilters: Partial<BookingFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle tab change
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        // Reset filters when changing tabs if needed
        if (tab !== 'bookings') {
            setFilters({
                searchTerm: '',
                statusFilter: 'all',
                sessionTypeFilter: 'all',
                dateFrom: '',
                dateTo: ''
            });
        }
    };

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h2>
                    <p className="text-gray-600">Bạn cần quyền admin để truy cập trang này.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                    notification.type === 'success' ? 'bg-green-100 text-green-800' :
                        notification.type === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                }`}>
                    <div className="flex items-center">
                        {notification.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
                        {notification.type === 'error' && <XCircle className="w-5 h-5 mr-2" />}
                        {notification.type === 'warning' && <AlertCircle className="w-5 h-5 mr-2" />}
                        <span>{notification.message}</span>
                        <button
                            onClick={() => setNotification(null)}
                            className="ml-4 text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <SectionHeader
                    title="QUẢN LÝ BOOKING MENTOR"
                    subtitle="Quản lý tất cả booking mentor và đánh giá từ người dùng"
                />

                {/* Tab Navigation */}
                <div className="mb-6 bg-white rounded-xl shadow-sm">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                onClick={() => handleTabChange('bookings')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'bookings'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Quản lý Booking
                                </div>
                            </button>

                            <button
                                onClick={() => handleTabChange('events')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'events'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                                disabled
                            >
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Events
                                    <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                        Sắp ra mắt
                                    </span>
                                </div>
                            </button>

                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'bookings' && (
                    <BookingTab
                        bookings={bookings}
                        loading={loading}
                        filters={filters}
                        pagination={pagination}
                        onFiltersChange={handleFiltersChange}
                        onPageChange={handlePageChange}
                        onRefresh={loadBookings}
                        onShowNotification={showNotification}
                    />
                )}

                {activeTab === 'events' && (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Thống kê & Báo cáo
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Tính năng này đang được phát triển và sẽ sớm ra mắt.
                        </p>
                        <p className="text-sm text-gray-500">
                            Bạn sẽ có thể xem biểu đồ thống kê, báo cáo chi tiết về booking và đánh giá mentor.
                        </p>
                    </div>
                )}


            </div>
        </div>
    );
};

export default AdminMentorBookingPage;