// src/component/admin/mentor_booking/BookingTab.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/component/Button';
import {
    Search,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    Mail,
    Phone,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    User,
    Star,
    Save,
    X,
    Video,
    Coffee,
    MapPin,
    RotateCcw,
    Download
} from 'lucide-react';
import Image from 'next/image';
import {
    MentorBooking,
    BookingFilters,
    PaginationState,
    CSVExportField,
    CSVExportOptions
} from '@/types/mentor_booking_admin';

interface BookingTabProps {
    bookings: MentorBooking[];
    loading: boolean;
    filters: BookingFilters;
    pagination: PaginationState;
    onFiltersChange: (filters: Partial<BookingFilters>) => void;
    onPageChange: (page: number) => void;
    onRefresh: () => void;
    onShowNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

const DEFAULT_CSV_FIELDS: CSVExportField[] = [
    // Booking Information
    { key: 'id', label: 'Booking ID', enabled: false, category: 'booking' },
    { key: 'created_at', label: 'Ngày tạo booking', enabled: true, category: 'booking' },
    { key: 'scheduled_date', label: 'Ngày hẹn', enabled: true, category: 'booking' },
    { key: 'duration', label: 'Thời lượng (phút)', enabled: true, category: 'booking' },
    { key: 'session_type', label: 'Hình thức', enabled: true, category: 'booking' },
    { key: 'status', label: 'Trạng thái', enabled: true, category: 'booking' },
    { key: 'contact_email', label: 'Email liên hệ', enabled: true, category: 'booking' },
    { key: 'contact_phone', label: 'SĐT liên hệ', enabled: true, category: 'booking' },
    { key: 'completed_at', label: 'Ngày hoàn thành', enabled: false, category: 'booking' },
    { key: 'user_notes', label: 'Ghi chú từ user', enabled: false, category: 'booking' },
    { key: 'mentor_notes', label: 'Ghi chú từ mentor', enabled: false, category: 'booking' },
    { key: 'admin_notes', label: 'Ghi chú admin', enabled: false, category: 'booking' },

    // User Information
    { key: 'user_id', label: 'User ID', enabled: false, category: 'user' },
    { key: 'user_name', label: 'Tên người đặt', enabled: true, category: 'user' },
    { key: 'user_phone', label: 'SĐT người đặt', enabled: false, category: 'user' },
    { key: 'user_gender', label: 'Giới tính', enabled: false, category: 'user' },
    { key: 'user_birthdate', label: 'Ngày sinh', enabled: false, category: 'user' },
    { key: 'user_university', label: 'Trường đại học', enabled: true, category: 'user' },
    { key: 'user_major', label: 'Ngành học', enabled: true, category: 'user' },
    { key: 'user_linkedin', label: 'LinkedIn', enabled: false, category: 'user' },
    { key: 'user_github', label: 'Github', enabled: false, category: 'user' },

    // Mentor Information
    { key: 'mentor_id', label: 'Mentor ID', enabled: false, category: 'mentor' },
    { key: 'mentor_name', label: 'Tên Mentor', enabled: true, category: 'mentor' },
    { key: 'mentor_email', label: 'Email Mentor', enabled: false, category: 'mentor' },
    { key: 'mentor_phone', label: 'SĐT Mentor', enabled: false, category: 'mentor' },
    { key: 'mentor_headline', label: 'Tiêu đề Mentor', enabled: true, category: 'mentor' },

    // Review Information
    { key: 'has_review', label: 'Có đánh giá', enabled: true, category: 'review' },
    { key: 'rating', label: 'Số sao', enabled: true, category: 'review' },
    { key: 'review_comment', label: 'Nhận xét', enabled: false, category: 'review' },
    { key: 'review_published', label: 'Đánh giá công khai', enabled: false, category: 'review' },
    { key: 'review_created_at', label: 'Ngày đánh giá', enabled: false, category: 'review' }
];

export const BookingTab: React.FC<BookingTabProps> = ({
                                                          bookings,
                                                          loading,
                                                          filters,
                                                          pagination,
                                                          onFiltersChange,
                                                          onPageChange,
                                                          onRefresh,
                                                          onShowNotification
                                                      }) => {
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const [editingBooking, setEditingBooking] = useState<MentorBooking | null>(null);
    const [editingReview, setEditingReview] = useState<any>(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [bookingFormData, setBookingFormData] = useState<Partial<MentorBooking>>({});
    const [reviewFormData, setReviewFormData] = useState<any>({});

    // CSV Export states
    const [showCSVModal, setShowCSVModal] = useState(false);
    const [csvFields, setCsvFields] = useState<CSVExportField[]>(DEFAULT_CSV_FIELDS);
    const [csvOptions, setCsvOptions] = useState<CSVExportOptions>({
        exportAll: false,
        limit: 100,
        applyFilters: true
    });

    // Scroll lock effect for modals
    useEffect(() => {
        const isAnyModalOpen = showEditForm || showReviewForm || showCSVModal;

        if (isAnyModalOpen) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
        } else {
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';

            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        }

        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
        };
    }, [showEditForm, showReviewForm, showCSVModal]);

    // Get booking value for CSV with extended user/mentor info
    const getBookingValue = (booking: MentorBooking, key: string): string => {
        const profile = booking.profiles;
        const subProfile = profile?.sub_profiles;
        const universityMajor = subProfile?.university_majors;
        const mentor = booking.mentors;
        const review = booking.mentor_reviews?.[0];

        switch (key) {
            case 'id': return booking.id;
            case 'created_at': return new Date(booking.created_at).toLocaleString('vi-VN');
            case 'scheduled_date':
                return booking.scheduled_date ? new Date(booking.scheduled_date).toLocaleString('vi-VN') : '';
            case 'duration': return booking.duration.toString();
            case 'session_type': return booking.session_type;
            case 'status': return booking.status;
            case 'contact_email': return booking.contact_email;
            case 'contact_phone': return booking.contact_phone || '';
            case 'completed_at':
                return booking.completed_at ? new Date(booking.completed_at).toLocaleString('vi-VN') : '';
            case 'user_notes': return booking.user_notes || '';
            case 'mentor_notes': return booking.mentor_notes || '';
            case 'admin_notes': return booking.admin_notes || '';

            case 'user_id': return booking.user_id;
            case 'user_name': return profile?.full_name || '';
            case 'user_phone': return profile?.phone_number || '';
            case 'user_gender': return profile?.gender || '';
            case 'user_birthdate':
                return profile?.birthdate ? new Date(profile.birthdate).toLocaleDateString('vi-VN') : '';
            case 'user_university': return universityMajor?.universities?.name || '';
            case 'user_major': return universityMajor?.majors?.name || '';
            case 'user_linkedin': return subProfile?.linkedin_url || '';
            case 'user_github': return subProfile?.github_url || '';

            case 'mentor_id': return booking.mentor_id;
            case 'mentor_name': return mentor?.full_name || '';
            case 'mentor_email': return mentor?.email || '';
            case 'mentor_phone': return mentor?.phone_number || '';
            case 'mentor_headline': return mentor?.headline || '';

            case 'has_review': return review ? 'Có' : 'Không';
            case 'rating': return review?.rating?.toString() || '';
            case 'review_comment': return review?.comment || '';
            case 'review_published': return review?.is_published ? 'Công khai' : 'Riêng tư';
            case 'review_created_at':
                return review?.created_at ? new Date(review.created_at).toLocaleString('vi-VN') : '';

            default: return '';
        }
    };

// Export to CSV
    const exportToCSV = async () => {
        try {
            let dataToExport = bookings;

            if (csvOptions.exportAll && csvOptions.applyFilters) {
                const { data, error } = await supabase.rpc('mentor_booking_admin_get_list', {
                    p_search_term: filters.searchTerm || null,
                    p_status: filters.statusFilter === 'all' ? null : filters.statusFilter,
                    p_session_type: filters.sessionTypeFilter === 'all' ? null : filters.sessionTypeFilter,
                    p_date_from: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : null,
                    p_date_to: filters.dateTo ? new Date(filters.dateTo + 'T23:59:59').toISOString() : null,
                    p_limit: csvOptions.limit || 10000,
                    p_offset: 0
                });
                if (error) throw error;
                dataToExport = data?.bookings || [];
            } else if (!csvOptions.applyFilters) {
                const { data, error } = await supabase.rpc('mentor_booking_admin_get_list', {
                    p_search_term: null,
                    p_status: null,
                    p_session_type: null,
                    p_date_from: null,
                    p_date_to: null,
                    p_limit: csvOptions.limit || 10000,
                    p_offset: 0
                });
                if (error) throw error;
                dataToExport = data?.bookings || [];
            }

            const enabledFields = csvFields.filter(f => f.enabled);
            const headers = enabledFields.map(f => f.label);
            const rows = dataToExport.map(booking =>
                enabledFields.map(field => getBookingValue(booking, field.key))
            );

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => {
                    const cellStr = String(cell).replace(/"/g, '""');
                    return /[",\n]/.test(cellStr) ? `"${cellStr}"` : cellStr;
                }).join(','))
            ].join('\n');

            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `mentor_bookings_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();

            onShowNotification('success', `Đã xuất ${dataToExport.length} booking`);
            setShowCSVModal(false);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            onShowNotification('error', 'Lỗi khi xuất file CSV');
        }
    };

    const toggleCSVField = (key: string) => {
        setCsvFields(prev => prev.map(field =>
            field.key === key ? { ...field, enabled: !field.enabled } : field
        ));
    };

    const selectFieldsByCategory = (category: string) => {
        setCsvFields(prev => prev.map(field =>
            field.category === category ? { ...field, enabled: true } : field
        ));
    };

    const deselectFieldsByCategory = (category: string) => {
        setCsvFields(prev => prev.map(field =>
            field.category === category ? { ...field, enabled: false } : field
        ));
    };

    const selectAllCSVFields = () => {
        setCsvFields(prev => prev.map(field => ({ ...field, enabled: true })));
    };

    const deselectAllCSVFields = () => {
        setCsvFields(prev => prev.map(field => ({ ...field, enabled: false })));
    };

    const updateBookingStatus = async (bookingId: string, status: string, adminNotes?: string) => {
        try {
            setSubmitting(true);
            const { data, error } = await supabase.rpc('mentor_booking_admin_update_status', {
                p_booking_id: bookingId,
                p_status: status,
                p_admin_notes: adminNotes
            });
            if (error) throw error;
            onShowNotification('success', 'Trạng thái đã được cập nhật');
            onRefresh();
        } catch (error) {
            console.error('Error updating booking status:', error);
            onShowNotification('error', 'Lỗi khi cập nhật trạng thái');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteBooking = async (bookingId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đặt lịch này? Thao tác này không thể hoàn tác.')) return;
        try {
            setSubmitting(true);
            const { error } = await supabase.rpc('mentor_booking_admin_delete', {
                p_booking_id: bookingId
            });
            if (error) throw error;
            onShowNotification('success', 'Đặt lịch đã được xóa');
            onRefresh();
        } catch (error) {
            console.error('Error deleting booking:', error);
            onShowNotification('error', 'Lỗi khi xóa đặt lịch');
        } finally {
            setSubmitting(false);
        }
    };

    const editBooking = (booking: MentorBooking) => {
        setEditingBooking(booking);
        setBookingFormData({
            ...booking,
            scheduled_date: booking.scheduled_date ?
                new Date(booking.scheduled_date).toISOString().slice(0, 16) : ''
        });
        setShowEditForm(true);
    };

    const saveBookingChanges = async () => {
        if (!editingBooking || !bookingFormData) return;
        try {
            setSubmitting(true);
            const { error } = await supabase.rpc('mentor_booking_admin_update', {
                p_booking_id: editingBooking.id,
                p_scheduled_date: bookingFormData.scheduled_date ? new Date(bookingFormData.scheduled_date).toISOString() : null,
                p_status: bookingFormData.status,
                p_admin_notes: bookingFormData.admin_notes,
                p_mentor_notes: bookingFormData.mentor_notes
            });
            if (error) throw error;
            onShowNotification('success', 'Đặt lịch đã được cập nhật');
            setShowEditForm(false);
            setEditingBooking(null);
            onRefresh();
        } catch (error) {
            console.error('Error saving booking changes:', error);
            onShowNotification('error', 'Lỗi khi lưu thay đổi');
        } finally {
            setSubmitting(false);
        }
    };

    const editReview = (review: any, booking: MentorBooking) => {
        setEditingReview(review);
        setEditingBooking(booking);
        setReviewFormData(review);
        setShowReviewForm(true);
    };

    const saveReviewChanges = async () => {
        if (!editingReview || !reviewFormData) return;
        try {
            setSubmitting(true);
            const { error } = await supabase.rpc('mentor_booking_admin_update_review', {
                p_review_id: editingReview.id,
                p_rating: reviewFormData.rating,
                p_comment: reviewFormData.comment,
                p_is_published: reviewFormData.is_published
            });
            if (error) throw error;
            onShowNotification('success', 'Đánh giá đã được cập nhật');
            setShowReviewForm(false);
            setEditingReview(null);
            onRefresh();
        } catch (error) {
            console.error('Error saving review changes:', error);
            onShowNotification('error', 'Lỗi khi lưu thay đổi đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteReview = async (reviewId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
        try {
            setSubmitting(true);
            const { error } = await supabase.rpc('mentor_booking_admin_delete_review', {
                p_review_id: reviewId
            });
            if (error) throw error;
            onShowNotification('success', 'Đánh giá đã được xóa');
            onRefresh();
        } catch (error) {
            console.error('Error deleting review:', error);
            onShowNotification('error', 'Lỗi khi xóa đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleReviewPublished = async (reviewId: string, isPublished: boolean) => {
        try {
            setSubmitting(true);
            const { error } = await supabase.rpc('mentor_booking_admin_update_review', {
                p_review_id: reviewId,
                p_is_published: !isPublished
            });
            if (error) throw error;
            onShowNotification('success', 'Trạng thái đánh giá đã được cập nhật');
            onRefresh();
        } catch (error) {
            console.error('Error toggling review:', error);
            onShowNotification('error', 'Lỗi khi cập nhật trạng thái đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    const cancelEdit = () => {
        setShowEditForm(false);
        setShowReviewForm(false);
        setEditingBooking(null);
        setEditingReview(null);
        setBookingFormData({});
        setReviewFormData({});
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'confirmed': return <CheckCircle className="w-4 h-4" />;
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const getSessionTypeIcon = (type: string) => {
        switch (type) {
            case 'online': return <Video className="w-4 h-4" />;
            case 'offline': return <Coffee className="w-4 h-4" />;
            case 'hybrid': return <MapPin className="w-4 h-4" />;
            default: return <Video className="w-4 h-4" />;
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 7;
        const sidePages = 2;

        if (pagination.totalPages <= maxVisiblePages) {
            for (let i = 1; i <= pagination.totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (pagination.currentPage <= sidePages + 2) {
                for (let i = 1; i <= sidePages + 3; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(pagination.totalPages);
            } else if (pagination.currentPage >= pagination.totalPages - sidePages - 1) {
                pages.push(1);
                pages.push('...');
                for (let i = pagination.totalPages - sidePages - 2; i <= pagination.totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = pagination.currentPage - 1; i <= pagination.currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(pagination.totalPages);
            }
        }
        return pages;
    };

    return (
        <>
            {/* Filters */}
            <div className="p-6 bg-white rounded-xl shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm booking..."
                            value={filters.searchTerm}
                            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <select
                        value={filters.statusFilter}
                        onChange={(e) => onFiltersChange({ statusFilter: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">Chờ xác nhận</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>

                    <select
                        value={filters.sessionTypeFilter}
                        onChange={(e) => onFiltersChange({ sessionTypeFilter: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả hình thức</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="hybrid">Hybrid</option>
                    </select>

                    <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => onFiltersChange({
                            searchTerm: '',
                            statusFilter: 'all',
                            sessionTypeFilter: 'all',
                            dateFrom: '',
                            dateTo: ''
                        })}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Xóa bộ lọc
                    </button>

                    <button
                        onClick={() => setShowCSVModal(true)}
                        disabled={bookings.length === 0 && pagination.totalCount === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Xuất CSV
                    </button>
                </div>
            </div>

            {/* Pagination Info */}
            {pagination.totalCount > 0 && (
                <div className="mb-4 text-sm text-gray-600">
                    Hiển thị {Math.min((pagination.currentPage - 1) * pagination.itemsPerPage + 1, pagination.totalCount)} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalCount)} trong tổng số {pagination.totalCount} kết quả
                </div>
            )}

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Đang tải...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="p-8 text-center">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Không có booking nào
                        </h3>
                        <p className="text-gray-600">
                            Không tìm thấy booking phù hợp với bộ lọc.
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

                                        {/* Review Section */}
                                        {booking.mentor_reviews && booking.mentor_reviews.length > 0 && (
                                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Star className="w-4 h-4 text-yellow-600" />
                                                        <strong className="text-sm text-yellow-800">Đánh giá</strong>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`w-4 h-4 ${
                                                                    star <= booking.mentor_reviews![0].rating
                                                                        ? 'text-yellow-400 fill-current'
                                                                        : 'text-gray-300'
                                                                }`}
                                                            />
                                                        ))}
                                                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                                            booking.mentor_reviews[0].is_published
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {booking.mentor_reviews[0].is_published ? 'Công khai' : 'Riêng tư'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {booking.mentor_reviews[0].comment && (
                                                    <p className="text-sm text-gray-700 mb-2">
                                                        {booking.mentor_reviews[0].comment}
                                                    </p>
                                                )}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => editReview(booking.mentor_reviews![0], booking)}
                                                        className="text-xs text-blue-600 hover:text-blue-800"
                                                        disabled={submitting}
                                                    >
                                                        Chỉnh sửa
                                                    </button>
                                                    <button
                                                        onClick={() => toggleReviewPublished(booking.mentor_reviews![0].id, booking.mentor_reviews![0].is_published)}
                                                        className="text-xs text-green-600 hover:text-green-800"
                                                        disabled={submitting}
                                                    >
                                                        {booking.mentor_reviews[0].is_published ? 'Ẩn' : 'Công khai'}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteReview(booking.mentor_reviews![0].id)}
                                                        className="text-xs text-red-600 hover:text-red-800"
                                                        disabled={submitting}
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
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
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-700">
                                Trang {pagination.currentPage} / {pagination.totalPages} (Tổng {pagination.totalCount} kết quả)
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => onPageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1 || loading}
                                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                                        pagination.currentPage === 1 || loading
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
                                                    onClick={() => onPageChange(pageNum as number)}
                                                    disabled={loading}
                                                    className={`px-3 py-2 rounded-lg transition-colors ${
                                                        pagination.currentPage === pageNum
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
                                    onClick={() => onPageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages || loading}
                                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                                        pagination.currentPage === pagination.totalPages || loading
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

            {/* CSV Export Modal */}
            {showCSVModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                        onClick={() => setShowCSVModal(false)}
                    />

                    <div className="relative bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">Xuất file CSV</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Chọn các trường và tùy chọn để xuất file CSV
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCSVModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Export Options */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900">Tùy chọn xuất</h4>

                                <div className="flex items-start">
                                    <input
                                        type="checkbox"
                                        id="applyFilters"
                                        checked={csvOptions.applyFilters}
                                        onChange={(e) => setCsvOptions(prev => ({
                                            ...prev,
                                            applyFilters: e.target.checked
                                        }))}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                                    />
                                    <label htmlFor="applyFilters" className="ml-2">
                                        <span className="text-sm font-medium text-gray-700">Áp dụng bộ lọc hiện tại</span>
                                        <p className="text-xs text-gray-500">
                                            Xuất chỉ các booking phù hợp với bộ lọc đang áp dụng
                                        </p>
                                    </label>
                                </div>

                                <div className="flex items-start">
                                    <input
                                        type="checkbox"
                                        id="exportAll"
                                        checked={csvOptions.exportAll}
                                        onChange={(e) => setCsvOptions(prev => ({
                                            ...prev,
                                            exportAll: e.target.checked
                                        }))}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                                    />
                                    <label htmlFor="exportAll" className="ml-2">
                                        <span className="text-sm font-medium text-gray-700">Xuất tất cả</span>
                                        <p className="text-xs text-gray-500">
                                            Xuất tất cả booking (không chỉ trang hiện tại)
                                        </p>
                                    </label>
                                </div>

                                {csvOptions.exportAll && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Giới hạn số lượng
                                        </label>
                                        <input
                                            type="number"
                                            value={csvOptions.limit}
                                            onChange={(e) => setCsvOptions(prev => ({
                                                ...prev,
                                                limit: parseInt(e.target.value) || 100
                                            }))}
                                            min="1"
                                            max="10000"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Tối đa: 10,000 booking
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Fields Selection by Category */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-gray-900">Chọn trường xuất</h4>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={selectAllCSVFields}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            Chọn tất cả
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button
                                            onClick={deselectAllCSVFields}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            Bỏ chọn tất cả
                                        </button>
                                    </div>
                                </div>

                                {/* Booking Fields */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-gray-800">📅 Thông tin Booking</h5>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => selectFieldsByCategory('booking')}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Chọn tất cả
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                onClick={() => deselectFieldsByCategory('booking')}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Bỏ chọn
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {csvFields.filter(f => f.category === 'booking').map((field) => (
                                            <div key={field.key} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`field-${field.key}`}
                                                    checked={field.enabled}
                                                    onChange={() => toggleCSVField(field.key)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label
                                                    htmlFor={`field-${field.key}`}
                                                    className="ml-2 text-sm text-gray-700 cursor-pointer"
                                                >
                                                    {field.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* User Fields */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-gray-800">👤 Thông tin User</h5>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => selectFieldsByCategory('user')}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Chọn tất cả
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                onClick={() => deselectFieldsByCategory('user')}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Bỏ chọn
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {csvFields.filter(f => f.category === 'user').map((field) => (
                                            <div key={field.key} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`field-${field.key}`}
                                                    checked={field.enabled}
                                                    onChange={() => toggleCSVField(field.key)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label
                                                    htmlFor={`field-${field.key}`}
                                                    className="ml-2 text-sm text-gray-700 cursor-pointer"
                                                >
                                                    {field.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Mentor Fields */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-gray-800">🎓 Thông tin Mentor</h5>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => selectFieldsByCategory('mentor')}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Chọn tất cả
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                onClick={() => deselectFieldsByCategory('mentor')}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Bỏ chọn
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {csvFields.filter(f => f.category === 'mentor').map((field) => (
                                            <div key={field.key} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`field-${field.key}`}
                                                    checked={field.enabled}
                                                    onChange={() => toggleCSVField(field.key)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label
                                                    htmlFor={`field-${field.key}`}
                                                    className="ml-2 text-sm text-gray-700 cursor-pointer"
                                                >
                                                    {field.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Review Fields */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-gray-800">⭐ Thông tin Đánh giá</h5>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => selectFieldsByCategory('review')}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Chọn tất cả
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                onClick={() => deselectFieldsByCategory('review')}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Bỏ chọn
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {csvFields.filter(f => f.category === 'review').map((field) => (
                                            <div key={field.key} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`field-${field.key}`}
                                                    checked={field.enabled}
                                                    onChange={() => toggleCSVField(field.key)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label
                                                    htmlFor={`field-${field.key}`}
                                                    className="ml-2 text-sm text-gray-700 cursor-pointer"
                                                >
                                                    {field.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                    Đã chọn: <strong>{csvFields.filter(f => f.enabled).length}</strong> / {csvFields.length} trường
                                    <div className="mt-1 text-xs">
                                        <span className="mr-3">📅 Booking: {csvFields.filter(f => f.category === 'booking' && f.enabled).length}</span>
                                        <span className="mr-3">👤 User: {csvFields.filter(f => f.category === 'user' && f.enabled).length}</span>
                                        <span className="mr-3">🎓 Mentor: {csvFields.filter(f => f.category === 'mentor' && f.enabled).length}</span>
                                        <span>⭐ Review: {csvFields.filter(f => f.category === 'review' && f.enabled).length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>
                                        • Sẽ xuất: <strong>
                                        {csvOptions.exportAll
                                            ? `${Math.min(csvOptions.limit || 100, pagination.totalCount)} booking`
                                            : `${bookings.length} booking (trang hiện tại)`}
                                    </strong>
                                    </li>
                                    <li>
                                        • Bộ lọc: <strong>{csvOptions.applyFilters ? 'Có áp dụng' : 'Không áp dụng'}</strong>
                                    </li>
                                    <li>
                                        • Số trường: <strong>{csvFields.filter(f => f.enabled).length} trường</strong>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="p-6 border-t border-gray-200 flex gap-4 justify-end sticky bottom-0 bg-white">
                            <Button
                                variant="outline"
                                onClick={() => setShowCSVModal(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={exportToCSV}
                                disabled={csvFields.filter(f => f.enabled).length === 0}
                                className="flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Xuất CSV ({csvFields.filter(f => f.enabled).length} trường)
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Booking Modal */}
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

            {/* Edit Review Modal */}
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
                                        <strong>Người đánh giá:</strong> {editingBooking?.profiles?.full_name}
                                    </div>
                                    <div>
                                        <strong>Mentor:</strong> {editingBooking?.mentors?.full_name}
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
                                                onClick={() => setReviewFormData((prev: any) => ({ ...prev, rating: star }))}                                                className={`text-2xl transition-colors ${
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
                                        onChange={(e) => setReviewFormData((prev: any) => ({ ...prev, comment: e.target.value }))}
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
                                        onChange={(e) => setReviewFormData((prev: any) => ({ ...prev, is_published: e.target.checked }))}
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
        </>
    );
};