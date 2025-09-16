'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { SectionHeader } from '@/component/SectionHeader';
import { Button } from '@/component/Button';
import {
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Users,
    Calendar,
    Building,
    Mail,
    Phone,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    FileText,
    User,
    Star,
    MessageSquare,
    Save,
    X,
    Video,
    Coffee,
    MapPin,
    RotateCcw
} from 'lucide-react';
import Image from 'next/image';

const ITEMS_PER_PAGE = 20;

// Interfaces
interface Mentor {
    id: string;
    full_name: string;
    headline?: string;
    avatar?: string;
    email: string;
}

interface MentorBooking {
    id: string;
    user_id: string;
    mentor_id: string;
    scheduled_date?: string;
    duration: number;
    session_type: 'online' | 'offline' | 'hybrid';
    contact_email: string;
    contact_phone?: string;
    user_notes?: string;
    mentor_notes?: string;
    admin_notes?: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string;
    completed_at?: string;
    profiles?: {
        id: string;
        full_name: string;
        image_url?: string;
    };
    mentors?: Mentor;
}

interface MentorReview {
    id: string;
    booking_id: string;
    user_id: string;
    mentor_id: string;
    rating: number;
    comment?: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    mentor_bookings?: {
        profiles?: {
            full_name: string;
            image_url?: string;
        };
        mentors?: {
            full_name: string;
            avatar?: string;
        };
    };
}

const AdminMentorBookingPage = () => {
    const { user } = useAuthStore();

    // States
    const [activeTab, setActiveTab] = useState<'bookings' | 'reviews'>('bookings');
    const [bookings, setBookings] = useState<MentorBooking[]>([]);
    const [reviews, setReviews] = useState<MentorReview[]>([]);
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sessionTypeFilter, setSessionTypeFilter] = useState<string>('all');
    const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all');

    // UI states
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const [editingBooking, setEditingBooking] = useState<MentorBooking | null>(null);
    const [editingReview, setEditingReview] = useState<MentorReview | null>(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Server-side pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Notification
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
    } | null>(null);

    // Form data
    const [bookingFormData, setBookingFormData] = useState<Partial<MentorBooking>>({});
    const [reviewFormData, setReviewFormData] = useState<Partial<MentorReview>>({});

    // Scroll lock effect for modals
    useEffect(() => {
        const isAnyModalOpen = showEditForm || showReviewForm;

        if (isAnyModalOpen) {
            // Lock body scroll khi modal mở
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '15px'; // Compensate for scrollbar
        } else {
            // Unlock body scroll khi modal đóng
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        }

        // Cleanup khi component unmount
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        };
    }, [showEditForm, showReviewForm]);

    // Load data with server-side pagination
    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'superadmin')) {
            if (activeTab === 'bookings') {
                loadBookings();
            } else {
                loadReviews();
            }
            loadMentors();
        }
    }, [user, activeTab, currentPage, searchTerm, statusFilter, sessionTypeFilter, reviewStatusFilter]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, sessionTypeFilter, reviewStatusFilter]);

    // Load bookings with server-side pagination
    const loadBookings = async () => {
        try {
            setLoading(true);

            // Calculate pagination
            const from = (currentPage - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from('mentor_bookings')
                .select(`
                    *,
                    profiles (
                        id,
                        full_name,
                        image_url
                    ),
                    mentors (
                        id,
                        full_name,
                        headline,
                        avatar,
                        email
                    )
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            // Apply filters
            if (searchTerm.trim()) {
                query = query.or(`contact_email.ilike.%${searchTerm}%,user_notes.ilike.%${searchTerm}%,mentor_notes.ilike.%${searchTerm}%,admin_notes.ilike.%${searchTerm}%`);
            }

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            if (sessionTypeFilter !== 'all') {
                query = query.eq('session_type', sessionTypeFilter);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            setBookings(data || []);
            setTotalCount(count || 0);
            setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
        } catch (error) {
            console.error('Error loading bookings:', error);
            showNotification('error', 'Không thể tải danh sách đặt lịch');
        } finally {
            setLoading(false);
        }
    };

    // Load reviews with server-side pagination
    const loadReviews = async () => {
        try {
            setLoading(true);

            // Calculate pagination
            const from = (currentPage - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from('mentor_reviews')
                .select(`
                    *,
                    mentor_bookings!inner (
                        profiles (
                            full_name,
                            image_url
                        ),
                        mentors (
                            full_name,
                            avatar
                        )
                    )
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            // Apply filters
            if (searchTerm.trim()) {
                query = query.or(`comment.ilike.%${searchTerm}%`);
            }

            if (reviewStatusFilter !== 'all') {
                query = query.eq('is_published', reviewStatusFilter === 'published');
            }

            const { data, error, count } = await query;

            if (error) throw error;

            setReviews(data || []);
            setTotalCount(count || 0);
            setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
        } catch (error) {
            console.error('Error loading reviews:', error);
            showNotification('error', 'Không thể tải danh sách đánh giá');
        } finally {
            setLoading(false);
        }
    };

    // Load mentors
    const loadMentors = async () => {
        try {
            const { data, error } = await supabase
                .from('mentors')
                .select('id, full_name, headline, avatar, email')
                .eq('published', true)
                .order('full_name');

            if (error) throw error;
            setMentors(data || []);
        } catch (error) {
            console.error('Error loading mentors:', error);
        }
    };

    // Show notification
    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // Update booking status
    const updateBookingStatus = async (bookingId: string, status: string, adminNotes?: string) => {
        try {
            setSubmitting(true);

            const updateData: any = {
                status,
                updated_at: new Date().toISOString()
            };

            if (adminNotes) {
                updateData.admin_notes = adminNotes;
            }

            if (status === 'completed') {
                updateData.completed_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('mentor_bookings')
                .update(updateData)
                .eq('id', bookingId);

            if (error) throw error;

            showNotification('success', 'Trạng thái đã được cập nhật');
            loadBookings();
        } catch (error) {
            console.error('Error updating booking status:', error);
            showNotification('error', 'Lỗi khi cập nhật trạng thái');
        } finally {
            setSubmitting(false);
        }
    };

    // Update review status
    const updateReviewStatus = async (reviewId: string, isPublished: boolean) => {
        try {
            setSubmitting(true);

            const { error } = await supabase
                .from('mentor_reviews')
                .update({
                    is_published: isPublished,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reviewId);

            if (error) throw error;

            showNotification('success', 'Trạng thái đánh giá đã được cập nhật');
            loadReviews();
        } catch (error) {
            console.error('Error updating review status:', error);
            showNotification('error', 'Lỗi khi cập nhật trạng thái đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete booking
    const deleteBooking = async (bookingId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đặt lịch này? Thao tác này không thể hoàn tác.')) return;

        try {
            setSubmitting(true);

            // First delete related reviews
            await supabase
                .from('mentor_reviews')
                .delete()
                .eq('booking_id', bookingId);

            // Then delete the booking
            const { error } = await supabase
                .from('mentor_bookings')
                .delete()
                .eq('id', bookingId);

            if (error) throw error;

            showNotification('success', 'Đặt lịch đã được xóa');
            loadBookings();
        } catch (error) {
            console.error('Error deleting booking:', error);
            showNotification('error', 'Lỗi khi xóa đặt lịch');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete review
    const deleteReview = async (reviewId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này? Thao tác này không thể hoàn tác.')) return;

        try {
            setSubmitting(true);
            const { error } = await supabase
                .from('mentor_reviews')
                .delete()
                .eq('id', reviewId);

            if (error) throw error;

            showNotification('success', 'Đánh giá đã được xóa');
            loadReviews();
        } catch (error) {
            console.error('Error deleting review:', error);
            showNotification('error', 'Lỗi khi xóa đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    // Edit booking
    const editBooking = (booking: MentorBooking) => {
        setEditingBooking(booking);
        setBookingFormData({
            ...booking,
            scheduled_date: booking.scheduled_date ?
                new Date(booking.scheduled_date).toISOString().slice(0, 16) : ''
        });
        setShowEditForm(true);
    };

    // Edit review
    const editReview = (review: MentorReview) => {
        setEditingReview(review);
        setReviewFormData(review);
        setShowReviewForm(true);
    };

    // Save booking changes
    const saveBookingChanges = async () => {
        if (!editingBooking || !bookingFormData) return;

        try {
            setSubmitting(true);

            const updateData = {
                scheduled_date: bookingFormData.scheduled_date ?
                    new Date(bookingFormData.scheduled_date).toISOString() : null,
                status: bookingFormData.status,
                admin_notes: bookingFormData.admin_notes,
                mentor_notes: bookingFormData.mentor_notes,
                completed_at: bookingFormData.status === 'completed' ?
                    (editingBooking.completed_at || new Date().toISOString()) : null,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('mentor_bookings')
                .update(updateData)
                .eq('id', editingBooking.id);

            if (error) throw error;

            showNotification('success', 'Đặt lịch đã được cập nhật');
            setShowEditForm(false);
            setEditingBooking(null);
            loadBookings();
        } catch (error) {
            console.error('Error saving booking changes:', error);
            showNotification('error', 'Lỗi khi lưu thay đổi');
        } finally {
            setSubmitting(false);
        }
    };

    // Save review changes
    const saveReviewChanges = async () => {
        if (!editingReview || !reviewFormData) return;

        try {
            setSubmitting(true);

            const updateData = {
                rating: reviewFormData.rating,
                comment: reviewFormData.comment,
                is_published: reviewFormData.is_published,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('mentor_reviews')
                .update(updateData)
                .eq('id', editingReview.id);

            if (error) throw error;

            showNotification('success', 'Đánh giá đã được cập nhật');
            setShowReviewForm(false);
            setEditingReview(null);
            loadReviews();
        } catch (error) {
            console.error('Error saving review changes:', error);
            showNotification('error', 'Lỗi khi lưu thay đổi đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    // Cancel edit
    const cancelEdit = () => {
        setShowEditForm(false);
        setShowReviewForm(false);
        setEditingBooking(null);
        setEditingReview(null);
        setBookingFormData({});
        setReviewFormData({});
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'confirmed': return <CheckCircle className="w-4 h-4" />;
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    // Get session type icon
    const getSessionTypeIcon = (type: string) => {
        switch (type) {
            case 'online': return <Video className="w-4 h-4" />;
            case 'offline': return <Coffee className="w-4 h-4" />;
            case 'hybrid': return <MapPin className="w-4 h-4" />;
            default: return <Video className="w-4 h-4" />;
        }
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setExpandedItem(null); // Close any expanded items
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle tab change
    const handleTabChange = (tab: 'bookings' | 'reviews') => {
        setActiveTab(tab);
        setCurrentPage(1);
        setSearchTerm('');
        setStatusFilter('all');
        setSessionTypeFilter('all');
        setReviewStatusFilter('all');
        setExpandedItem(null);
    };

    // Reset filters
    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSessionTypeFilter('all');
        setReviewStatusFilter('all');
        setCurrentPage(1);
        setExpandedItem(null);
    };

    // Generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 7;
        const sidePages = 2;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= sidePages + 2) {
                for (let i = 1; i <= sidePages + 3; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - sidePages - 1) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - sidePages - 2; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
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
                    title="QUẢN LÝ BOOKING & ĐÁNH GIÁ MENTOR"
                    subtitle="Quản lý tất cả booking mentor và đánh giá từ người dùng"
                />

                {/* Tabs */}
                <div className="mb-8 bg-white rounded-xl shadow-sm">
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
                                    Booking
                                </div>
                            </button>
                            <button
                                onClick={() => handleTabChange('reviews')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'reviews'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4" />
                                    Đánh giá
                                </div>
                            </button>
                        </nav>
                    </div>

                    {/* Filters */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder={activeTab === 'bookings' ? "Tìm kiếm booking..." : "Tìm kiếm đánh giá..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Status Filter */}
                            {activeTab === 'bookings' ? (
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="pending">Chờ xác nhận</option>
                                    <option value="confirmed">Đã xác nhận</option>
                                    <option value="completed">Hoàn thành</option>
                                    <option value="cancelled">Đã hủy</option>
                                </select>
                            ) : (
                                <select
                                    value={reviewStatusFilter}
                                    onChange={(e) => setReviewStatusFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả đánh giá</option>
                                    <option value="published">Đã công khai</option>
                                    <option value="unpublished">Chưa công khai</option>
                                </select>
                            )}

                            {/* Session Type Filter (only for bookings) */}
                            {activeTab === 'bookings' ? (
                                <select
                                    value={sessionTypeFilter}
                                    onChange={(e) => setSessionTypeFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả hình thức</option>
                                    <option value="online">Online</option>
                                    <option value="offline">Offline</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            ) : (
                                <div></div>
                            )}

                            {/* Reset Filters */}
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pagination Info */}
                {totalCount > 0 && (
                    <div className="mb-4 text-sm text-gray-600">
                        Hiển thị {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} trong tổng số {totalCount} kết quả
                    </div>
                )}

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Đang tải...</p>
                        </div>
                    ) : activeTab === 'bookings' ? (
                        bookings.length === 0 ? (
                            <div className="p-8 text-center">
                                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Không có booking nào
                                </h3>
                                <p className="text-gray-600">
                                    {searchTerm || statusFilter !== 'all' || sessionTypeFilter !== 'all'
                                        ? 'Không tìm thấy booking phù hợp với bộ lọc.'
                                        : 'Chưa có booking mentor nào trong hệ thống.'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {bookings.map((booking) => (
                                    <div key={booking.id} className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        {booking.profiles?.image_url ? (
                                                            <Image
                                                                src={booking.profiles.image_url}
                                                                alt={booking.profiles.full_name}
                                                                width={40}
                                                                height={40}
                                                                className="rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                                <User className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h4 className="text-lg font-semibold text-gray-900">
                                                                {booking.profiles?.full_name || 'Người dùng ẩn danh'}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                Mentor: {booking.mentors?.full_name || 'Chưa xác định'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                                                        {getStatusIcon(booking.status)}
                                                        {booking.status === 'pending' && 'Chờ xác nhận'}
                                                        {booking.status === 'confirmed' && 'Đã xác nhận'}
                                                        {booking.status === 'completed' && 'Hoàn thành'}
                                                        {booking.status === 'cancelled' && 'Đã hủy'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-gray-400" />
                                                        <span className="truncate">{booking.contact_email}</span>
                                                    </div>
                                                    {booking.contact_phone && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="w-4 h-4 text-gray-400" />
                                                            <span>{booking.contact_phone}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        <span>{booking.duration} phút</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getSessionTypeIcon(booking.session_type)}
                                                        <span className="capitalize">{booking.session_type}</span>
                                                    </div>
                                                </div>

                                                {booking.scheduled_date && (
                                                    <div className="flex items-center gap-2 text-sm mb-2">
                                                        <Calendar className="w-4 h-4 text-green-600" />
                                                        <span className="text-green-600">
                                                            <strong>Lịch hẹn:</strong> {new Date(booking.scheduled_date).toLocaleString('vi-VN')}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="text-sm mb-2">
                                                    <strong>Ngày tạo:</strong> {new Date(booking.created_at).toLocaleString('vi-VN')}
                                                </div>

                                                {booking.user_notes && (
                                                    <div className="text-sm text-gray-600 mb-2">
                                                        <strong>Ghi chú từ user:</strong> {booking.user_notes}
                                                    </div>
                                                )}

                                                {booking.mentor_notes && (
                                                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg mb-2">
                                                        <strong>Phản hồi từ mentor:</strong> {booking.mentor_notes}
                                                    </div>
                                                )}

                                                {booking.admin_notes && (
                                                    <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-2">
                                                        <strong>Ghi chú admin:</strong> {booking.admin_notes}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => setExpandedItem(
                                                        expandedItem === booking.id ? null : booking.id
                                                    )}
                                                    className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50"
                                                    title="Xem chi tiết"
                                                >
                                                    {expandedItem === booking.id ? (
                                                        <ChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => editBooking(booking)}
                                                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                                                    title="Chỉnh sửa"
                                                    disabled={submitting}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => deleteBooking(booking.id)}
                                                    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                                                    title="Xóa"
                                                    disabled={submitting}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Quick Status Actions */}
                                        {expandedItem === booking.id && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {booking.status === 'pending' && (
                                                        <button
                                                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                                            disabled={submitting}
                                                        >
                                                            Xác nhận
                                                        </button>
                                                    )}

                                                    {booking.status === 'confirmed' && (
                                                        <button
                                                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                                            disabled={submitting}
                                                        >
                                                            Hoàn thành
                                                        </button>
                                                    )}

                                                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt('Lý do hủy:');
                                                                if (reason !== null) {
                                                                    updateBookingStatus(booking.id, 'cancelled', reason);
                                                                }
                                                            }}
                                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                                                            disabled={submitting}
                                                        >
                                                            Hủy
                                                        </button>
                                                    )}

                                                    {(booking.status === 'cancelled' || booking.status === 'completed') && (
                                                        <button
                                                            onClick={() => updateBookingStatus(booking.id, 'pending')}
                                                            className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                                                            disabled={submitting}
                                                        >
                                                            Đặt lại chờ xác nhận
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        // Reviews Tab
                        reviews.length === 0 ? (
                            <div className="p-8 text-center">
                                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Không có đánh giá nào
                                </h3>
                                <p className="text-gray-600">
                                    {searchTerm || reviewStatusFilter !== 'all'
                                        ? 'Không tìm thấy đánh giá phù hợp với bộ lọc.'
                                        : 'Chưa có đánh giá mentor nào trong hệ thống.'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {reviews.map((review) => (
                                    <div key={review.id} className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        {review.mentor_bookings?.profiles?.image_url ? (
                                                            <Image
                                                                src={review.mentor_bookings.profiles.image_url}
                                                                alt={review.mentor_bookings.profiles.full_name}
                                                                width={40}
                                                                height={40}
                                                                className="rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                                <User className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h4 className="text-lg font-semibold text-gray-900">
                                                                {review.mentor_bookings?.profiles?.full_name || 'Người dùng ẩn danh'}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                Mentor: {review.mentor_bookings?.mentors?.full_name || 'Chưa xác định'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {/* Rating Stars */}
                                                        <div className="flex items-center">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star
                                                                    key={star}
                                                                    className={`w-4 h-4 ${
                                                                        star <= review.rating
                                                                            ? 'text-yellow-400 fill-current'
                                                                            : 'text-gray-300'
                                                                    }`}
                                                                />
                                                            ))}
                                                            <span className="ml-2 text-sm text-gray-600">
                                                                ({review.rating}/5)
                                                            </span>
                                                        </div>

                                                        {/* Published Status */}
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                            review.is_published
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {review.is_published ? 'Công khai' : 'Riêng tư'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-sm mb-2">
                                                    <strong>Ngày đánh giá:</strong> {new Date(review.created_at).toLocaleString('vi-VN')}
                                                </div>

                                                {review.comment && (
                                                    <div className="bg-gray-50 p-3 rounded-lg mb-2">
                                                        <strong className="text-sm">Nhận xét:</strong>
                                                        <p className="text-sm text-gray-700 mt-1">{review.comment}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => setExpandedItem(
                                                        expandedItem === review.id ? null : review.id
                                                    )}
                                                    className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50"
                                                    title="Xem chi tiết"
                                                >
                                                    {expandedItem === review.id ? (
                                                        <ChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => editReview(review)}
                                                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                                                    title="Chỉnh sửa"
                                                    disabled={submitting}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => deleteReview(review.id)}
                                                    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                                                    title="Xóa"
                                                    disabled={submitting}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Quick Review Actions */}
                                        {expandedItem === review.id && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => updateReviewStatus(review.id, !review.is_published)}
                                                        className={`px-3 py-1 text-white text-sm rounded-lg ${
                                                            review.is_published
                                                                ? 'bg-gray-600 hover:bg-gray-700'
                                                                : 'bg-green-600 hover:bg-green-700'
                                                        }`}
                                                        disabled={submitting}
                                                    >
                                                        {review.is_published ? 'Ẩn đánh giá' : 'Công khai đánh giá'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* Server-side Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-700">
                                    Trang {currentPage} / {totalPages} (Tổng {totalCount} kết quả)
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1 || loading}
                                        className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                                            currentPage === 1 || loading
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Trước
                                    </button>

                                    <div className="flex items-center space-x-1">
                                        {getPageNumbers().map((pageNum, index) => (
                                            <React.Fragment key={index}>
                                                {pageNum === '...' ? (
                                                    <span className="px-3 py-2 text-gray-400">...</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handlePageChange(pageNum as number)}
                                                        disabled={loading}
                                                        className={`px-3 py-2 rounded-lg transition-colors ${
                                                            currentPage === pageNum
                                                                ? 'bg-blue-600 text-white'
                                                                : loading
                                                                    ? 'text-gray-400 cursor-not-allowed'
                                                                    : 'text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages || loading}
                                        className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                                            currentPage === totalPages || loading
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        Sau
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit Booking Form Modal */}
                {showEditForm && editingBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={cancelEdit}
                        />

                        <div className="relative bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Chỉnh sửa booking</h3>
                                    <button
                                        onClick={cancelEdit}
                                        className="text-gray-400 hover:text-gray-600"
                                        disabled={submitting}
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Basic Info (Read-only) */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3">Thông tin cơ bản</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <strong>Người đặt:</strong> {editingBooking.profiles?.full_name}
                                        </div>
                                        <div>
                                            <strong>Email:</strong> {editingBooking.contact_email}
                                        </div>
                                        <div>
                                            <strong>Mentor:</strong> {editingBooking.mentors?.full_name}
                                        </div>
                                        <div>
                                            <strong>Hình thức:</strong> <span className="capitalize">{editingBooking.session_type}</span>
                                        </div>
                                        <div>
                                            <strong>Thời lượng:</strong> {editingBooking.duration} phút
                                        </div>
                                        <div>
                                            <strong>Ngày tạo:</strong> {new Date(editingBooking.created_at).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>

                                    {editingBooking.user_notes && (
                                        <div className="mt-3 text-sm">
                                            <strong>Ghi chú từ user:</strong>
                                            <p className="mt-1 text-gray-600">{editingBooking.user_notes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Editable Fields */}
                                <div className="space-y-4">
                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Trạng thái *
                                        </label>
                                        <select
                                            value={bookingFormData.status || ''}
                                            onChange={(e) => setBookingFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            disabled={submitting}
                                        >
                                            <option value="pending">Chờ xác nhận</option>
                                            <option value="confirmed">Đã xác nhận</option>
                                            <option value="completed">Hoàn thành</option>
                                            <option value="cancelled">Đã hủy</option>
                                        </select>
                                    </div>

                                    {/* Scheduled Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Thời gian lên lịch
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={bookingFormData.scheduled_date || ''}
                                            onChange={(e) => setBookingFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            disabled={submitting}
                                        />
                                    </div>

                                    {/* Mentor Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ghi chú của mentor
                                        </label>
                                        <textarea
                                            value={bookingFormData.mentor_notes || ''}
                                            onChange={(e) => setBookingFormData(prev => ({ ...prev, mentor_notes: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ghi chú từ mentor..."
                                            disabled={submitting}
                                        />
                                    </div>

                                    {/* Admin Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ghi chú admin
                                        </label>
                                        <textarea
                                            value={bookingFormData.admin_notes || ''}
                                            onChange={(e) => setBookingFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nhập ghi chú admin..."
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={cancelEdit}
                                    disabled={submitting}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={saveBookingChanges}
                                    disabled={submitting}
                                    className="flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Lưu thay đổi
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Review Form Modal */}
                {showReviewForm && editingReview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={cancelEdit}
                        />

                        <div className="relative bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Chỉnh sửa đánh giá</h3>
                                    <button
                                        onClick={cancelEdit}
                                        className="text-gray-400 hover:text-gray-600"
                                        disabled={submitting}
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Review Info (Read-only) */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3">Thông tin đánh giá</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <strong>Người đánh giá:</strong> {editingReview.mentor_bookings?.profiles?.full_name}
                                        </div>
                                        <div>
                                            <strong>Mentor:</strong> {editingReview.mentor_bookings?.mentors?.full_name}
                                        </div>
                                        <div>
                                            <strong>Ngày tạo:</strong> {new Date(editingReview.created_at).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div>
                                            <strong>Lần cập nhật cuối:</strong> {new Date(editingReview.updated_at).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                </div>

                                {/* Editable Fields */}
                                <div className="space-y-4">
                                    {/* Rating */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Số sao đánh giá *
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewFormData(prev => ({ ...prev, rating: star }))}
                                                    className={`text-2xl transition-colors ${
                                                        star <= (reviewFormData.rating || 0)
                                                            ? 'text-yellow-400 hover:text-yellow-500'
                                                            : 'text-gray-300 hover:text-yellow-300'
                                                    }`}
                                                    disabled={submitting}
                                                >
                                                    <Star className={`w-8 h-8 ${star <= (reviewFormData.rating || 0) ? 'fill-current' : ''}`} />
                                                </button>
                                            ))}
                                            <span className="ml-3 text-sm text-gray-600">
                                                {reviewFormData.rating > 0 ? `${reviewFormData.rating}/5 sao` : 'Chọn số sao'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Comment */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nội dung đánh giá
                                        </label>
                                        <textarea
                                            value={reviewFormData.comment || ''}
                                            onChange={(e) => setReviewFormData(prev => ({ ...prev, comment: e.target.value }))}
                                            rows={5}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nội dung đánh giá..."
                                            disabled={submitting}
                                        />
                                    </div>

                                    {/* Published Status */}
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="is_published"
                                            checked={reviewFormData.is_published || false}
                                            onChange={(e) => setReviewFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            disabled={submitting}
                                        />
                                        <label htmlFor="is_published" className="ml-2 text-sm text-gray-700">
                                            Công khai đánh giá này
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={cancelEdit}
                                    disabled={submitting}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={saveReviewChanges}
                                    disabled={submitting || !reviewFormData.rating}
                                    className="flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Lưu thay đổi
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Statistics */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Tổng Booking</p>
                                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Trang hiện tại</p>
                                <p className="text-2xl font-bold text-gray-900">{currentPage}</p>
                                <p className="text-xs text-gray-500">/ {totalPages} trang</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <FileText className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Items/trang</p>
                                <p className="text-2xl font-bold text-gray-900">{ITEMS_PER_PAGE}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <Eye className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Tab hiện tại</p>
                                <p className="text-lg font-bold text-gray-900 capitalize">
                                    {activeTab === 'bookings' ? 'Booking' : 'Đánh giá'}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                {activeTab === 'bookings' ? (
                                    <Calendar className="w-6 h-6 text-purple-600" />
                                ) : (
                                    <Star className="w-6 h-6 text-purple-600" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Footer */}
                <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    Đang tải dữ liệu...
                                </span>
                            ) : (
                                <span>
                                    Đã tải {activeTab === 'bookings' ? bookings.length : reviews.length}
                                    {activeTab === 'bookings' ? ' booking' : ' đánh giá'}
                                    trong trang này
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setCurrentPage(1);
                                    if (activeTab === 'bookings') {
                                        loadBookings();
                                    } else {
                                        loadReviews();
                                    }
                                }}
                                disabled={loading}
                                className="flex items-center gap-2"
                            >
                                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Tải lại
                            </Button>

                            {totalPages > 1 && (
                                <Button
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1 || loading}
                                    variant="outline"
                                >
                                    Về trang đầu
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMentorBookingPage;