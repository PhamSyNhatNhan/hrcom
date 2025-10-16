// src/app/admin/mentor_booking_modify/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { SectionHeader } from '@/component/SectionHeader';
import { CheckCircle, XCircle, AlertCircle, X, Calendar, BarChart3 } from 'lucide-react';
import { BookingTab } from '@/component/admin/mentor_booking/BookingTab';
import { EventsTab } from '@/component/admin/mentor_booking/EventsTab';
import {
    MentorBooking,
    BookingFilters,
    PaginationState as BookingPaginationState,
    NotificationState,
    TabType
} from '@/types/mentor_booking_admin';
import {
    EventRegistration,
    EventFilters,
    PaginationState as EventPaginationState
} from '@/types/events_admin';

const ITEMS_PER_PAGE = 20;

const AdminMentorBookingPage = () => {
    const { user } = useAuthStore();

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>('bookings');

    // Booking states
    const [bookings, setBookings] = useState<MentorBooking[]>([]);
    const [bookingLoading, setBookingLoading] = useState(true);
    const [bookingFilters, setBookingFilters] = useState<BookingFilters>({
        searchTerm: '',
        statusFilter: 'all',
        sessionTypeFilter: 'all',
        dateFrom: '',
        dateTo: ''
    });
    const [bookingPagination, setBookingPagination] = useState<BookingPaginationState>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        itemsPerPage: ITEMS_PER_PAGE
    });

    // Event registration states
    const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
    const [eventLoading, setEventLoading] = useState(true);
    const [eventFilters, setEventFilters] = useState<EventFilters>({
        searchTerm: '',
        statusFilter: 'all',
        eventTypeFilter: 'all',
        dateFrom: '',
        dateTo: ''
    });
    const [eventPagination, setEventPagination] = useState<EventPaginationState>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        itemsPerPage: ITEMS_PER_PAGE
    });

    // Notification
    const [notification, setNotification] = useState<NotificationState | null>(null);

    // Load data based on active tab
    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'superadmin')) {
            if (activeTab === 'bookings') {
                loadBookings();
            } else if (activeTab === 'events') {
                loadRegistrations();
            }
        }
    }, [user, activeTab, bookingPagination.currentPage, bookingFilters, eventPagination.currentPage, eventFilters]);

    // Reset page when filters change for bookings
    useEffect(() => {
        if (activeTab === 'bookings' && bookingPagination.currentPage !== 1) {
            setBookingPagination(prev => ({ ...prev, currentPage: 1 }));
        }
    }, [bookingFilters.searchTerm, bookingFilters.statusFilter, bookingFilters.sessionTypeFilter, bookingFilters.dateFrom, bookingFilters.dateTo]);

    // Reset page when filters change for events
    useEffect(() => {
        if (activeTab === 'events' && eventPagination.currentPage !== 1) {
            setEventPagination(prev => ({ ...prev, currentPage: 1 }));
        }
    }, [eventFilters.searchTerm, eventFilters.statusFilter, eventFilters.eventTypeFilter, eventFilters.dateFrom, eventFilters.dateTo]);

    // Load bookings via RPC
    const loadBookings = async () => {
        try {
            setBookingLoading(true);

            const from = (bookingPagination.currentPage - 1) * ITEMS_PER_PAGE;
            const dateFromFilter = bookingFilters.dateFrom ? new Date(bookingFilters.dateFrom).toISOString() : null;
            const dateToFilter = bookingFilters.dateTo ? new Date(bookingFilters.dateTo + 'T23:59:59').toISOString() : null;

            const { data, error } = await supabase.rpc('mentor_booking_admin_get_list', {
                p_search_term: bookingFilters.searchTerm || null,
                p_status: bookingFilters.statusFilter === 'all' ? null : bookingFilters.statusFilter,
                p_session_type: bookingFilters.sessionTypeFilter === 'all' ? null : bookingFilters.sessionTypeFilter,
                p_date_from: dateFromFilter,
                p_date_to: dateToFilter,
                p_limit: ITEMS_PER_PAGE,
                p_offset: from
            });

            if (error) throw error;

            const bookingsData = data?.bookings || [];
            const totalCount = data?.total_count || 0;

            setBookings(bookingsData);
            setBookingPagination(prev => ({
                ...prev,
                totalCount,
                totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE)
            }));
        } catch (error) {
            console.error('Error loading bookings:', error);
            showNotification('error', 'Không thể tải danh sách đặt lịch');
        } finally {
            setBookingLoading(false);
        }
    };

    // Load event registrations via RPC
    const loadRegistrations = async () => {
        try {
            setEventLoading(true);

            const from = (eventPagination.currentPage - 1) * ITEMS_PER_PAGE;
            const dateFromFilter = eventFilters.dateFrom ? new Date(eventFilters.dateFrom).toISOString() : null;
            const dateToFilter = eventFilters.dateTo ? new Date(eventFilters.dateTo + 'T23:59:59').toISOString() : null;

            const { data, error } = await supabase.rpc('events_admin_get_list', {
                p_search_term: eventFilters.searchTerm || null,
                p_status: eventFilters.statusFilter === 'all' ? null : eventFilters.statusFilter,
                p_event_type: eventFilters.eventTypeFilter === 'all' ? null : eventFilters.eventTypeFilter,
                p_date_from: dateFromFilter,
                p_date_to: dateToFilter,
                p_limit: ITEMS_PER_PAGE,
                p_offset: from
            });

            if (error) throw error;

            const registrationsData = data?.registrations || [];
            const totalCount = data?.total_count || 0;

            setRegistrations(registrationsData);
            setEventPagination(prev => ({
                ...prev,
                totalCount,
                totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE)
            }));
        } catch (error) {
            console.error('Error loading registrations:', error);
            showNotification('error', 'Không thể tải danh sách đăng ký');
        } finally {
            setEventLoading(false);
        }
    };

    // Show notification
    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // Handle filters change
    const handleBookingFiltersChange = (newFilters: Partial<BookingFilters>) => {
        setBookingFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleEventFiltersChange = (newFilters: Partial<EventFilters>) => {
        setEventFilters(prev => ({ ...prev, ...newFilters }));
    };

    // Handle page change
    const handleBookingPageChange = (page: number) => {
        setBookingPagination(prev => ({ ...prev, currentPage: page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEventPageChange = (page: number) => {
        setEventPagination(prev => ({ ...prev, currentPage: page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle tab change
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);

        // Reset pagination for the new tab
        if (tab === 'bookings') {
            setBookingPagination(prev => ({ ...prev, currentPage: 1 }));
        } else if (tab === 'events') {
            setEventPagination(prev => ({ ...prev, currentPage: 1 }));
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
                    title="QUẢN LÝ BOOKING & EVENTS"
                    subtitle="Quản lý tất cả booking mentor và đăng ký sự kiện từ người dùng"
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
                                    Quản lý Booking Mentor
                                </div>
                            </button>

                            <button
                                onClick={() => handleTabChange('events')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'events'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Quản lý Events
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'bookings' && (
                    <BookingTab
                        bookings={bookings}
                        loading={bookingLoading}
                        filters={bookingFilters}
                        pagination={bookingPagination}
                        onFiltersChange={handleBookingFiltersChange}
                        onPageChange={handleBookingPageChange}
                        onRefresh={loadBookings}
                        onShowNotification={showNotification}
                    />
                )}

                {activeTab === 'events' && (
                    <EventsTab
                        registrations={registrations}
                        loading={eventLoading}
                        filters={eventFilters}
                        pagination={eventPagination}
                        onFiltersChange={handleEventFiltersChange}
                        onPageChange={handleEventPageChange}
                        onRefresh={loadRegistrations}
                        onShowNotification={showNotification}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminMentorBookingPage;