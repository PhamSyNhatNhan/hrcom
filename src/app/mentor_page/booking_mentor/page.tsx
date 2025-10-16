'use client';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { SectionHeader } from '@/component/SectionHeader';
import { Button } from '@/component/Button';
import { supabase } from '@/utils/supabase/client';
import {
    Calendar,
    Clock,
    Users,
    User,
    Mail,
    AlertCircle,
    CheckCircle,
    XCircle,
    Edit,
    MessageSquare,
    Video,
    Coffee,
    MapPin,
    Eye,
    Search,
    X,
    Send,
    Save,
    RefreshCw,
    GraduationCap,
    Globe
} from 'lucide-react';
import Image from 'next/image';
import type {
    MentorBooking,
    MentorProfile,
    Notification
} from '@/types/mentor_booking_mentor';

const BookingMentorPage = () => {
    const { user } = useAuthStore();
    const [bookings, setBookings] = useState<MentorBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [mentorProfile, setMentorProfile] = useState<MentorProfile | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sessionTypeFilter, setSessionTypeFilter] = useState<string>('all');

    // Modal states
    const [selectedBooking, setSelectedBooking] = useState<MentorBooking | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);

    // Form states
    const [newStatus, setNewStatus] = useState<string>('');
    const [mentorNotes, setMentorNotes] = useState('');
    const [newScheduledDate, setNewScheduledDate] = useState('');

    const [notification, setNotification] = useState<Notification | null>(null);

    useEffect(() => {
        if (user) {
            loadMentorProfile();
        }
    }, [user]);

    useEffect(() => {
        if (mentorProfile?.id) {
            loadBookings();
        }
    }, [mentorProfile]);

    useEffect(() => {
        const isAnyModalOpen = showDetailModal || showStatusModal || showNotesModal;
        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '15px';
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        };
    }, [showDetailModal, showStatusModal, showNotesModal]);

    const loadMentorProfile = async () => {
        try {
            const { data, error } = await supabase
                .rpc('mentor_booking_mentor_s_get_mentor_id', {
                    p_mentor_email: user?.email
                });

            if (error) throw error;
            if (data && data.length > 0) {
                setMentorProfile({ id: data[0].mentor_id } as MentorProfile);
            }
        } catch (error) {
            console.error('Error loading mentor profile:', error);
            showNotification('error', 'Không thể tải thông tin mentor');
        }
    };

    const loadBookings = async () => {
        if (!mentorProfile?.id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .rpc('mentor_booking_mentor_s_get_bookings', {
                    p_mentor_id: mentorProfile.id
                });

            if (error) throw error;

            // Transform flat data to nested structure
            const transformedBookings: MentorBooking[] = (data || []).map((row: any) => ({
                id: row.booking_id,
                user_id: row.user_id,
                mentor_id: row.mentor_id,
                scheduled_date: row.scheduled_date,
                duration: row.duration,
                session_type: row.session_type,
                contact_email: row.contact_email,
                contact_phone: row.contact_phone,
                user_notes: row.user_notes,
                mentor_notes: row.mentor_notes,
                admin_notes: row.admin_notes,
                status: row.status,
                created_at: row.created_at,
                updated_at: row.updated_at,
                completed_at: row.completed_at,
                profiles: row.profile_id ? {
                    id: row.profile_id,
                    full_name: row.full_name,
                    image_url: row.image_url,
                    phone_number: row.phone_number,
                    birthdate: row.birthdate,
                    gender: row.gender,
                    sub_profiles: row.sub_profile_id ? {
                        id: row.sub_profile_id,
                        cv: row.cv,
                        linkedin_url: row.linkedin_url,
                        github_url: row.github_url,
                        portfolio_url: row.portfolio_url,
                        description: row.description,
                        university_majors: (row.university_name || row.major_name) ? {
                            universities: row.university_name ? {
                                name: row.university_name,
                                code: row.university_code
                            } : undefined,
                            majors: row.major_name ? {
                                name: row.major_name
                            } : undefined
                        } : undefined
                    } : undefined
                } : undefined
            }));

            setBookings(transformedBookings);
        } catch (error) {
            console.error('Error loading bookings:', error);
            showNotification('error', 'Không thể tải danh sách đặt lịch');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const updateBookingStatus = async () => {
        if (!selectedBooking || !newStatus) return;

        try {
            const { data, error } = await supabase
                .rpc('mentor_booking_mentor_s_update_status', {
                    p_booking_id: selectedBooking.id,
                    p_new_status: newStatus,
                    p_scheduled_date: newStatus === 'confirmed' && newScheduledDate
                        ? new Date(newScheduledDate).toISOString()
                        : null
                });

            if (error) throw error;

            if (data && data[0]?.success) {
                showNotification('success', data[0].message);
                loadBookings();
                setShowStatusModal(false);
                resetModalStates();
            } else {
                showNotification('error', data?.[0]?.message || 'Lỗi khi cập nhật');
            }
        } catch (error) {
            console.error('Error updating booking status:', error);
            showNotification('error', 'Lỗi khi cập nhật trạng thái');
        }
    };

    const updateMentorNotes = async () => {
        if (!selectedBooking) return;

        try {
            const { data, error } = await supabase
                .rpc('mentor_booking_mentor_s_update_notes', {
                    p_booking_id: selectedBooking.id,
                    p_new_mentor_notes: mentorNotes
                });

            if (error) throw error;

            if (data && data[0]?.success) {
                showNotification('success', data[0].message);
                loadBookings();
                setShowNotesModal(false);
                resetModalStates();
            } else {
                showNotification('error', data?.[0]?.message || 'Lỗi khi cập nhật');
            }
        } catch (error) {
            console.error('Error updating notes:', error);
            showNotification('error', 'Lỗi khi cập nhật ghi chú');
        }
    };

    const resetModalStates = () => {
        setSelectedBooking(null);
        setNewStatus('');
        setMentorNotes('');
        setNewScheduledDate('');
    };

    const openStatusModal = (booking: MentorBooking) => {
        setSelectedBooking(booking);
        setNewStatus(booking.status);
        setNewScheduledDate(booking.scheduled_date ?
            new Date(booking.scheduled_date).toISOString().slice(0, 16) : '');
        setShowStatusModal(true);
    };

    const openNotesModal = (booking: MentorBooking) => {
        setSelectedBooking(booking);
        setMentorNotes(booking.mentor_notes || '');
        setShowNotesModal(true);
    };

    const openDetailModal = (booking: MentorBooking) => {
        setSelectedBooking(booking);
        setShowDetailModal(true);
    };

    // Filter bookings
    const filteredBookings = bookings.filter(booking => {
        const matchesSearch = searchTerm === '' ||
            booking.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.user_notes?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        const matchesSessionType = sessionTypeFilter === 'all' || booking.session_type === sessionTypeFilter;

        return matchesSearch && matchesStatus && matchesSessionType;
    });

    // Status display functions
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
            case 'pending': return <Clock className="w-4 h-4 sm:w-5 sm:h-5" />;
            case 'confirmed': return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
            case 'completed': return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
            case 'cancelled': return <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
            default: return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Chờ xác nhận';
            case 'confirmed': return 'Đã xác nhận';
            case 'completed': return 'Hoàn thành';
            case 'cancelled': return 'Đã hủy';
            default: return 'Không xác định';
        }
    };

    const getSessionTypeIcon = (type: string) => {
        switch (type) {
            case 'online': return <Video className="w-5 h-5" />;
            case 'offline': return <Coffee className="w-5 h-5" />;
            case 'hybrid': return <MapPin className="w-5 h-5" />;
            default: return <Video className="w-5 h-5" />;
        }
    };

    const getSessionTypeText = (type: string) => {
        switch (type) {
            case 'online': return 'Online';
            case 'offline': return 'Offline';
            case 'hybrid': return 'Hybrid';
            default: return 'Online';
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Vui lòng đăng nhập</h2>
                    <p className="text-gray-600">Bạn cần đăng nhập để quản lý booking.</p>
                </div>
            </div>
        );
    }

    if (!mentorProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h2>
                    <p className="text-gray-600">Bạn cần là mentor để truy cập trang này.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 left-4 sm:left-auto z-50 p-4 rounded-lg shadow-lg max-w-sm ${
                    notification.type === 'success' ? 'bg-green-100 text-green-800' :
                        notification.type === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                }`}>
                    <div className="flex items-start gap-2">
                        {notification.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                        {notification.type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                        {notification.type === 'warning' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                        <span className="text-sm flex-1">{notification.message}</span>
                        <button
                            onClick={() => setNotification(null)}
                            className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-6 sm:mb-8">
                    <SectionHeader
                        title="QUẢN LÝ BOOKING"
                        subtitle="Quản lý các lịch đặt tư vấn từ học viên"
                    />
                </div>

                {/* Filters - Mobile Optimized */}
                <div className="mb-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Search */}
                        <div className="relative sm:col-span-2 lg:col-span-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">Chờ xác nhận</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>

                        {/* Session Type Filter */}
                        <select
                            value={sessionTypeFilter}
                            onChange={(e) => setSessionTypeFilter(e.target.value)}
                            className="px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả hình thức</option>
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                            <option value="hybrid">Hybrid</option>
                        </select>

                        {/* Reset Button */}
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setSessionTypeFilter('all');
                            }}
                            className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 active:bg-gray-700 flex items-center justify-center gap-2 font-medium transition-colors"
                        >
                            <RefreshCw className="w-5 h-5" />
                            <span>Xóa bộ lọc</span>
                        </button>
                    </div>
                </div>

                {/* Bookings List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Đang tải...</p>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {bookings.length === 0 ? 'Chưa có booking nào' : 'Không tìm thấy booking'}
                            </h3>
                            <p className="text-gray-600">
                                {bookings.length === 0
                                    ? 'Chưa có học viên nào đặt lịch tư vấn với bạn.'
                                    : 'Không có booking nào khớp với tiêu chí tìm kiếm.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredBookings.map((booking) => (
                                <div key={booking.id} className="p-5 sm:p-6 hover:bg-gray-50 transition-colors">
                                    <div className="space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start gap-3">
                                            {booking.profiles?.image_url ? (
                                                <Image
                                                    src={booking.profiles.image_url}
                                                    alt={booking.profiles.full_name}
                                                    width={56}
                                                    height={56}
                                                    className="rounded-full object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="w-7 h-7 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {booking.profiles?.full_name || 'Người dùng ẩn danh'}
                                                </h4>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    Đặt: {new Date(booking.created_at).toLocaleDateString('vi-VN')}
                                                </p>
                                                <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium items-center gap-1.5 ${getStatusColor(booking.status)}`}>
                                                    {getStatusIcon(booking.status)}
                                                    <span>{getStatusText(booking.status)}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-gray-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                <span className="text-gray-700">
                                                    {booking.scheduled_date ?
                                                        new Date(booking.scheduled_date).toLocaleString('vi-VN', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) :
                                                        'Chưa xác định'
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                <span className="text-gray-700">{booking.duration} phút</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getSessionTypeIcon(booking.session_type)}
                                                <span className="text-gray-700">{getSessionTypeText(booking.session_type)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                <span className="text-gray-700 truncate">{booking.contact_email}</span>
                                            </div>
                                        </div>

                                        {/* Student Info */}
                                        {booking.profiles?.sub_profiles && (
                                            <div className="bg-blue-50 rounded-lg p-4">
                                                <div className="text-sm">
                                                    <strong className="text-blue-800 block mb-2">Thông tin học viên:</strong>
                                                    <div className="space-y-2 text-blue-700">
                                                        {booking.profiles.sub_profiles.university_majors && (
                                                            <div className="flex items-center gap-2">
                                                                <GraduationCap className="w-4 h-4 flex-shrink-0" />
                                                                <span className="text-sm">
                                                                    {booking.profiles.sub_profiles.university_majors.universities?.name}
                                                                    {booking.profiles.sub_profiles.university_majors.majors?.name &&
                                                                        ` - ${booking.profiles.sub_profiles.university_majors.majors.name}`
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                        {booking.profiles.sub_profiles.description && (
                                                            <p className="text-sm line-clamp-2">{booking.profiles.sub_profiles.description}</p>
                                                        )}
                                                        <div className="flex gap-3 flex-wrap">
                                                            {booking.profiles.sub_profiles.linkedin_url && (
                                                                <a href={booking.profiles.sub_profiles.linkedin_url}
                                                                   target="_blank"
                                                                   rel="noopener noreferrer"
                                                                   className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                                                    <Globe className="w-4 h-4" />LinkedIn
                                                                </a>
                                                            )}
                                                            {booking.profiles.sub_profiles.github_url && (
                                                                <a href={booking.profiles.sub_profiles.github_url}
                                                                   target="_blank"
                                                                   rel="noopener noreferrer"
                                                                   className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                                                    <Globe className="w-4 h-4" />GitHub
                                                                </a>
                                                            )}
                                                            {booking.profiles.sub_profiles.portfolio_url && (
                                                                <a href={booking.profiles.sub_profiles.portfolio_url}
                                                                   target="_blank"
                                                                   rel="noopener noreferrer"
                                                                   className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                                                    <Globe className="w-4 h-4" />Portfolio
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {booking.user_notes && (
                                            <div className="bg-yellow-50 rounded-lg p-4">
                                                <strong className="text-sm text-yellow-800 block mb-1">Ghi chú từ học viên:</strong>
                                                <p className="text-sm text-yellow-700 line-clamp-3">{booking.user_notes}</p>
                                            </div>
                                        )}

                                        {booking.mentor_notes && (
                                            <div className="bg-green-50 rounded-lg p-4">
                                                <strong className="text-sm text-green-800 block mb-1">Ghi chú của bạn:</strong>
                                                <p className="text-sm text-green-700 line-clamp-3">{booking.mentor_notes}</p>
                                            </div>
                                        )}

                                        {/* Action Buttons - Mobile Optimized with Larger Touch Targets */}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-200">
                                            <button
                                                onClick={() => openDetailModal(booking)}
                                                className="flex-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                                            >
                                                <Eye className="w-5 h-5" />
                                                <span>Chi tiết</span>
                                            </button>

                                            {booking.status !== 'completed' && (
                                                <>
                                                    <button
                                                        onClick={() => openStatusModal(booking)}
                                                        className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                        <span>Cập nhật</span>
                                                    </button>

                                                    <button
                                                        onClick={() => openNotesModal(booking)}
                                                        className="flex-1 bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                                                    >
                                                        <MessageSquare className="w-5 h-5" />
                                                        <span>Ghi chú</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Summary Stats */}
                <div className="mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Tổng cộng', count: bookings.length, color: 'bg-blue-100 text-blue-800', icon: <Users className="w-5 h-5" /> },
                        { label: 'Chờ xác nhận', count: bookings.filter(b => b.status === 'pending').length, color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-5 h-5" /> },
                        { label: 'Đã xác nhận', count: bookings.filter(b => b.status === 'confirmed').length, color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-5 h-5" /> },
                        { label: 'Hoàn thành', count: bookings.filter(b => b.status === 'completed').length, color: 'bg-purple-100 text-purple-800', icon: <CheckCircle className="w-5 h-5" /> }
                    ].map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                            <div className={`inline-flex px-3 py-2 rounded-full text-sm font-medium ${stat.color} mb-3 items-center gap-2`}>
                                {stat.icon}
                                <span>{stat.label}</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.count}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                        onClick={() => setShowDetailModal(false)}
                    />

                    <div className="relative bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200 z-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg sm:text-xl font-bold">Chi tiết booking</h3>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 space-y-6">
                            {/* User Info */}
                            <div className="flex items-start gap-4">
                                {selectedBooking.profiles?.image_url ? (
                                    <Image
                                        src={selectedBooking.profiles.image_url}
                                        alt={selectedBooking.profiles.full_name}
                                        width={80}
                                        height={80}
                                        className="rounded-full object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="w-10 h-10 text-gray-400" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xl font-semibold mb-2">{selectedBooking.profiles?.full_name}</h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p className="flex items-center gap-2 break-all">
                                            <Mail className="w-4 h-4 flex-shrink-0" />
                                            {selectedBooking.contact_email}
                                        </p>
                                        {selectedBooking.contact_phone && (
                                            <p className="flex items-center gap-2">
                                                <span className="w-4 h-4 flex-shrink-0">📱</span>
                                                {selectedBooking.contact_phone}
                                            </p>
                                        )}
                                    </div>

                                    {selectedBooking.profiles?.sub_profiles && (
                                        <div className="mt-4 space-y-2">
                                            {selectedBooking.profiles.sub_profiles.university_majors && (
                                                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                                                    <GraduationCap className="w-5 h-5 flex-shrink-0" />
                                                    <span className="break-words">
                                                        {selectedBooking.profiles.sub_profiles.university_majors.universities?.name}
                                                        {selectedBooking.profiles.sub_profiles.university_majors.majors?.name &&
                                                            ` - ${selectedBooking.profiles.sub_profiles.university_majors.majors.name}`
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {selectedBooking.profiles.sub_profiles.description && (
                                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                    {selectedBooking.profiles.sub_profiles.description}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                                {selectedBooking.profiles.sub_profiles.linkedin_url && (
                                                    <a href={selectedBooking.profiles.sub_profiles.linkedin_url}
                                                       target="_blank"
                                                       rel="noopener noreferrer"
                                                       className="text-sm text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg">
                                                        <Globe className="w-4 h-4" />LinkedIn
                                                    </a>
                                                )}
                                                {selectedBooking.profiles.sub_profiles.github_url && (
                                                    <a href={selectedBooking.profiles.sub_profiles.github_url}
                                                       target="_blank"
                                                       rel="noopener noreferrer"
                                                       className="text-sm text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg">
                                                        <Globe className="w-4 h-4" />GitHub
                                                    </a>
                                                )}
                                                {selectedBooking.profiles.sub_profiles.portfolio_url && (
                                                    <a href={selectedBooking.profiles.sub_profiles.portfolio_url}
                                                       target="_blank"
                                                       rel="noopener noreferrer"
                                                       className="text-sm text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg">
                                                        <Globe className="w-4 h-4" />Portfolio
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Booking Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <strong className="text-gray-700 block mb-1">Thời gian đặt:</strong>
                                    <p className="text-gray-900">{new Date(selectedBooking.created_at).toLocaleString('vi-VN')}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <strong className="text-gray-700 block mb-1">Thời gian mong muốn:</strong>
                                    <p className="text-gray-900">{selectedBooking.scheduled_date ?
                                        new Date(selectedBooking.scheduled_date).toLocaleString('vi-VN') :
                                        'Chưa xác định'
                                    }</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <strong className="text-gray-700 block mb-1">Thời lượng:</strong>
                                    <p className="text-gray-900">{selectedBooking.duration} phút</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <strong className="text-gray-700 block mb-1">Hình thức:</strong>
                                    <p className="text-gray-900 flex items-center gap-2">
                                        {getSessionTypeIcon(selectedBooking.session_type)}
                                        {getSessionTypeText(selectedBooking.session_type)}
                                    </p>
                                </div>
                                <div className="sm:col-span-2 bg-gray-50 p-4 rounded-lg">
                                    <strong className="text-gray-700 block mb-2">Trạng thái:</strong>
                                    <span className={`inline-flex px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                                        {getStatusIcon(selectedBooking.status)}
                                        <span className="ml-1">{getStatusText(selectedBooking.status)}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedBooking.user_notes && (
                                <div>
                                    <strong className="text-gray-700 block mb-2">Ghi chú từ học viên:</strong>
                                    <p className="p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800">{selectedBooking.user_notes}</p>
                                </div>
                            )}

                            {selectedBooking.mentor_notes && (
                                <div>
                                    <strong className="text-gray-700 block mb-2">Ghi chú của bạn:</strong>
                                    <p className="p-4 bg-green-50 rounded-lg text-sm text-green-800">{selectedBooking.mentor_notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {showStatusModal && selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                        onClick={() => setShowStatusModal(false)}
                    />

                    <div className="relative bg-white rounded-xl max-w-md w-full">
                        <div className="p-4 sm:p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg sm:text-xl font-bold">Cập nhật trạng thái</h3>
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trạng thái mới
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="pending">Chờ xác nhận</option>
                                    <option value="confirmed">Xác nhận</option>
                                    <option value="completed">Hoàn thành</option>
                                    <option value="cancelled">Hủy</option>
                                </select>
                            </div>

                            {newStatus === 'confirmed' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Thời gian xác nhận
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={newScheduledDate}
                                        onChange={(e) => setNewScheduledDate(e.target.value)}
                                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 font-medium transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={updateBookingStatus}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                            >
                                <Save className="w-5 h-5" />
                                Cập nhật
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Modal */}
            {showNotesModal && selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                        onClick={() => setShowNotesModal(false)}
                    />

                    <div className="relative bg-white rounded-xl max-w-md w-full">
                        <div className="p-4 sm:p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg sm:text-xl font-bold">Ghi chú mentor</h3>
                                <button
                                    onClick={() => setShowNotesModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi chú của bạn
                                </label>
                                <textarea
                                    value={mentorNotes}
                                    onChange={(e) => setMentorNotes(e.target.value)}
                                    rows={5}
                                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Thêm ghi chú về buổi tư vấn, phản hồi cho học viên..."
                                />
                                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                                    Ghi chú này sẽ được hiển thị cho học viên
                                </p>
                            </div>

                            {selectedBooking.user_notes && (
                                <div>
                                    <strong className="text-sm text-gray-700 block mb-2">Ghi chú từ học viên:</strong>
                                    <p className="text-sm text-gray-600 p-3 bg-yellow-50 rounded-lg">
                                        {selectedBooking.user_notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setShowNotesModal(false)}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 font-medium transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={updateMentorNotes}
                                className="flex-1 bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                            >
                                <Send className="w-5 h-5" />
                                Lưu ghi chú
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingMentorPage;