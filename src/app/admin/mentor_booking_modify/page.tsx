'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
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
    Plus,
    Minus,
    Save,
    X
} from 'lucide-react';
import Image from 'next/image';

const supabase = createClient();
const BOOKINGS_PER_PAGE = 10;

// Interfaces
interface Mentor {
    id: string;
    full_name: string;
    headline?: string;
    avatar?: string;
    skill?: string[];
}

interface MentorBooking {
    id: string;
    user_id: string;
    organization_name: string;
    contact_email: string;
    contact_phone?: string;
    desired_mentor_ids: string[];
    requested_date?: string;
    scheduled_date?: string;
    duration: number;
    session_type: 'online' | 'offline' | 'hybrid';
    registered_count: number;
    actual_count: number;
    required_skills: string[];
    published: boolean;
    status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'rejected';
    is_completed: boolean;
    notes?: string;
    admin_notes?: string;
    created_at: string;
    updated_at: string;
    profiles?: {
        full_name: string;
        image_url?: string;
    };
}

const MentorBookingModifyPage = () => {
    const { user } = useAuthStore();

    // States
    const [bookings, setBookings] = useState<MentorBooking[]>([]);
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sessionTypeFilter, setSessionTypeFilter] = useState<string>('all');
    const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
    const [editingBooking, setEditingBooking] = useState<MentorBooking | null>(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Notification
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
    } | null>(null);

    // Form data for editing
    const [formData, setFormData] = useState<Partial<MentorBooking>>({});

    // Load data
    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'superadmin')) {
            loadBookings();
            loadMentors();
        }
    }, [user, currentPage, searchTerm, statusFilter, sessionTypeFilter]);

    // Load bookings (only published ones)
    const loadBookings = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('mentor_bookings')
                .select(`
                    *,
                    profiles (
                        full_name,
                        image_url
                    )
                `, { count: 'exact' })
                .eq('published', true) // Only show published bookings
                .order('created_at', { ascending: false });

            // Apply filters
            if (searchTerm.trim()) {
                query = query.or(`organization_name.ilike.%${searchTerm}%,contact_email.ilike.%${searchTerm}%`);
            }

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            if (sessionTypeFilter !== 'all') {
                query = query.eq('session_type', sessionTypeFilter);
            }

            // Apply pagination
            const from = (currentPage - 1) * BOOKINGS_PER_PAGE;
            const to = from + BOOKINGS_PER_PAGE - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            setBookings(data || []);
            setTotalPages(Math.ceil((count || 0) / BOOKINGS_PER_PAGE));
        } catch (error) {
            console.error('Error loading bookings:', error);
            showNotification('error', 'Không thể tải danh sách đặt lịch');
        } finally {
            setLoading(false);
        }
    };

    // Load mentors
    const loadMentors = async () => {
        try {
            const { data, error } = await supabase
                .from('mentors')
                .select('id, full_name, headline, avatar, skill')
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

            // If status is completed, mark as completed
            if (status === 'completed') {
                updateData.is_completed = true;
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

    // Delete booking
    const deleteBooking = async (bookingId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đặt lịch này?')) return;

        try {
            setSubmitting(true);
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

    // Edit booking
    const editBooking = (booking: MentorBooking) => {
        setEditingBooking(booking);
        setFormData({
            ...booking,
            scheduled_date: booking.scheduled_date ?
                new Date(booking.scheduled_date).toISOString().slice(0, 16) : ''
        });
        setShowEditForm(true);
    };

    // Save booking changes
    const saveBookingChanges = async () => {
        if (!editingBooking || !formData) return;

        try {
            setSubmitting(true);

            const updateData = {
                scheduled_date: formData.scheduled_date ?
                    new Date(formData.scheduled_date).toISOString() : null,
                actual_count: formData.actual_count || 0,
                status: formData.status,
                admin_notes: formData.admin_notes,
                is_completed: formData.status === 'completed',
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

    // Cancel edit
    const cancelEdit = () => {
        setShowEditForm(false);
        setEditingBooking(null);
        setFormData({});
    };

    // Get mentor names
    const getMentorNames = (mentorIds: string[]) => {
        if (!Array.isArray(mentorIds)) return '';
        return mentors
            .filter(m => mentorIds.includes(m.id))
            .map(m => m.full_name)
            .join(', ');
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'approved': return <CheckCircle className="w-4 h-4" />;
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            case 'rejected': return <XCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
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
                    title="QUẢN LÝ ĐẶT LỊCH MENTOR"
                    subtitle="Quản lý và xử lý các yêu cầu đặt lịch mentor từ người dùng"
                />

                {/* Filters */}
                <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">Chờ duyệt</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="cancelled">Đã hủy</option>
                            <option value="rejected">Từ chối</option>
                        </select>

                        {/* Session Type Filter */}
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

                        {/* Reset Filters */}
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setSessionTypeFilter('all');
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>

                {/* Bookings List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Đang tải...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="p-8 text-center">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Không có đặt lịch nào
                            </h3>
                            <p className="text-gray-600">
                                Chưa có yêu cầu đặt lịch mentor nào được gửi lên.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {bookings.map((booking) => (
                                <div key={booking.id} className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-3">
                                                <h4 className="text-lg font-semibold text-gray-900">
                                                    {booking.organization_name}
                                                </h4>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                                                    {getStatusIcon(booking.status)}
                                                    {booking.status === 'pending' && 'Chờ duyệt'}
                                                    {booking.status === 'approved' && 'Đã duyệt'}
                                                    {booking.status === 'completed' && 'Hoàn thành'}
                                                    {booking.status === 'cancelled' && 'Đã hủy'}
                                                    {booking.status === 'rejected' && 'Từ chối'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span>{booking.contact_email}</span>
                                                </div>
                                                {booking.contact_phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        <span>{booking.contact_phone}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span>{booking.registered_count} người đăng ký</span>
                                                    {booking.actual_count > 0 && (
                                                        <span className="text-green-600">({booking.actual_count} tham gia)</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-4 h-4 text-gray-400" />
                                                    <span className="capitalize">{booking.session_type}</span>
                                                </div>
                                            </div>

                                            {booking.requested_date && (
                                                <div className="flex items-center gap-2 text-sm mb-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span>
                                                        <strong>Ngày mong muốn:</strong> {new Date(booking.requested_date).toLocaleString('vi-VN')}
                                                    </span>
                                                </div>
                                            )}

                                            {booking.scheduled_date && (
                                                <div className="flex items-center gap-2 text-sm mb-2">
                                                    <Calendar className="w-4 h-4 text-green-600" />
                                                    <span className="text-green-600">
                                                        <strong>Đã lên lịch:</strong> {new Date(booking.scheduled_date).toLocaleString('vi-VN')}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="text-sm mb-2">
                                                <strong>Mentor mong muốn:</strong> {getMentorNames(booking.desired_mentor_ids) || 'Chưa chọn'}
                                            </div>

                                            {booking.required_skills.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {booking.required_skills.map((skill, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {booking.notes && (
                                                <div className="text-sm text-gray-600 mb-2">
                                                    <strong>Ghi chú:</strong> {booking.notes}
                                                </div>
                                            )}

                                            {booking.admin_notes && (
                                                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-2">
                                                    <strong>Phản hồi admin:</strong> {booking.admin_notes}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => setExpandedBooking(
                                                    expandedBooking === booking.id ? null : booking.id
                                                )}
                                                className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50"
                                                title="Xem chi tiết"
                                            >
                                                {expandedBooking === booking.id ? (
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
                                    {expandedBooking === booking.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex flex-wrap gap-2">
                                                {booking.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateBookingStatus(booking.id, 'approved')}
                                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                                            disabled={submitting}
                                                        >
                                                            Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt('Lý do từ chối:');
                                                                if (reason !== null) {
                                                                    updateBookingStatus(booking.id, 'rejected', reason);
                                                                }
                                                            }}
                                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                                                            disabled={submitting}
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </>
                                                )}

                                                {booking.status === 'approved' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                                            disabled={submitting}
                                                        >
                                                            Hoàn thành
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt('Lý do hủy:');
                                                                if (reason !== null) {
                                                                    updateBookingStatus(booking.id, 'cancelled', reason);
                                                                }
                                                            }}
                                                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                                                            disabled={submitting}
                                                        >
                                                            Hủy
                                                        </button>
                                                    </>
                                                )}

                                                {booking.status !== 'pending' && booking.status !== 'approved' && (
                                                    <button
                                                        onClick={() => updateBookingStatus(booking.id, 'pending')}
                                                        className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                                                        disabled={submitting}
                                                    >
                                                        Đặt lại chờ duyệt
                                                    </button>
                                                )}
                                            </div>

                                            {/* User Info */}
                                            {booking.profiles && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        {booking.profiles.image_url ? (
                                                            <Image
                                                                src={booking.profiles.image_url}
                                                                alt={booking.profiles.full_name}
                                                                width={32}
                                                                height={32}
                                                                className="rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                                <User className="w-4 h-4 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-gray-900">{booking.profiles.full_name}</p>
                                                            <p className="text-sm text-gray-500">Người đặt lịch</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-center space-x-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                                        currentPage === 1
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
                                                    className={`px-3 py-2 rounded-lg transition-colors ${
                                                        currentPage === pageNum
                                                            ? 'bg-blue-600 text-white'
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
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                                        currentPage === totalPages
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    Sau
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit Form Modal */}
                {showEditForm && editingBooking && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Chỉnh sửa đặt lịch</h3>
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
                                            <strong>Tổ chức:</strong> {editingBooking.organization_name}
                                        </div>
                                        <div>
                                            <strong>Email:</strong> {editingBooking.contact_email}
                                        </div>
                                        <div>
                                            <strong>Số lượng đăng ký:</strong> {editingBooking.registered_count}
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

                                    {editingBooking.requested_date && (
                                        <div className="mt-3 text-sm">
                                            <strong>Ngày mong muốn:</strong> {new Date(editingBooking.requested_date).toLocaleString('vi-VN')}
                                        </div>
                                    )}

                                    <div className="mt-3 text-sm">
                                        <strong>Mentor mong muốn:</strong> {getMentorNames(editingBooking.desired_mentor_ids) || 'Chưa chọn'}
                                    </div>

                                    {editingBooking.required_skills.length > 0 && (
                                        <div className="mt-3">
                                            <strong className="text-sm">Kỹ năng yêu cầu:</strong>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {editingBooking.required_skills.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {editingBooking.notes && (
                                        <div className="mt-3 text-sm">
                                            <strong>Ghi chú từ user:</strong>
                                            <p className="mt-1 text-gray-600">{editingBooking.notes}</p>
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
                                            value={formData.status || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            disabled={submitting}
                                        >
                                            <option value="pending">Chờ duyệt</option>
                                            <option value="approved">Đã duyệt</option>
                                            <option value="completed">Hoàn thành</option>
                                            <option value="cancelled">Đã hủy</option>
                                            <option value="rejected">Từ chối</option>
                                        </select>
                                    </div>

                                    {/* Scheduled Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ngày đã lên lịch
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formData.scheduled_date || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            disabled={submitting}
                                        />
                                    </div>

                                    {/* Actual Count */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Số lượng tham gia thực tế
                                        </label>
                                        <div className="flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const current = formData.actual_count || 0;
                                                    if (current > 0) {
                                                        setFormData(prev => ({ ...prev, actual_count: current - 1 }));
                                                    }
                                                }}
                                                className="px-3 py-2 border border-gray-300 rounded-l-lg hover:bg-gray-50"
                                                disabled={submitting || (formData.actual_count || 0) <= 0}
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                max="999"
                                                value={formData.actual_count || 0}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    actual_count: Math.max(0, Math.min(999, parseInt(e.target.value) || 0))
                                                }))}
                                                className="w-full px-4 py-2 border-t border-b border-gray-300 text-center focus:ring-2 focus:ring-blue-500"
                                                disabled={submitting}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const current = formData.actual_count || 0;
                                                    if (current < 999) {
                                                        setFormData(prev => ({ ...prev, actual_count: current + 1 }));
                                                    }
                                                }}
                                                className="px-3 py-2 border border-gray-300 rounded-r-lg hover:bg-gray-50"
                                                disabled={submitting || (formData.actual_count || 0) >= 999}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="mt-1">
                                            <p className="text-xs text-gray-500">
                                                Đã đăng ký: {editingBooking.registered_count} người
                                            </p>
                                            {(formData.actual_count || 0) > editingBooking.registered_count && (
                                                <p className="text-xs text-green-600 font-medium">
                                                    ✓ Có thêm {(formData.actual_count || 0) - editingBooking.registered_count} người tham gia ngoài dự kiến
                                                </p>
                                            )}
                                            {(formData.actual_count || 0) < editingBooking.registered_count && formData.actual_count !== undefined && formData.actual_count > 0 && (
                                                <p className="text-xs text-orange-600">
                                                    ⚠ Có {editingBooking.registered_count - (formData.actual_count || 0)} người đăng ký không tham gia
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Admin Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ghi chú của admin
                                        </label>
                                        <textarea
                                            value={formData.admin_notes || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nhập ghi chú, phản hồi cho người dùng..."
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
            </div>
        </div>
    );
};

export default MentorBookingModifyPage;