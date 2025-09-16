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
    Phone,
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
    EyeOff,
    Filter,
    Search,
    X,
    Send,
    Save,
    RefreshCw,
    GraduationCap,
    Building,
    Globe
} from 'lucide-react';
import Image from 'next/image';

// Interfaces
interface UserProfile {
    id: string;
    full_name: string;
    image_url?: string;
    phone_number?: string;
    birthdate?: string;
    gender?: string;
}

interface SubProfile {
    id: string;
    cv?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    description?: string;
    university_majors?: {
        universities?: {
            name: string;
            code: string;
        };
        majors?: {
            name: string;
        };
    };
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
    profiles?: UserProfile & {
        sub_profiles?: SubProfile;
    };
}

const BookingMentorPage = () => {
    const { user } = useAuthStore();
    const [bookings, setBookings] = useState<MentorBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [mentorProfile, setMentorProfile] = useState<any>(null);

    // Filter and search states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Modal states
    const [selectedBooking, setSelectedBooking] = useState<MentorBooking | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);

    // Form states
    const [newStatus, setNewStatus] = useState<string>('');
    const [mentorNotes, setMentorNotes] = useState('');
    const [newScheduledDate, setNewScheduledDate] = useState('');

    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
    } | null>(null);

    useEffect(() => {
        if (user) {
            loadMentorProfile();
            loadBookings();
        }
    }, [user]);

    useEffect(() => {
        const isAnyModalOpen = showDetailModal || showStatusModal || showNotesModal;

        if (isAnyModalOpen) {
            // Lock body scroll khi modal mở
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '15px';
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
    }, [showDetailModal, showStatusModal, showNotesModal]);

    const loadMentorProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('mentors')
                .select('*')
                .eq('email', user?.email)
                .single();

            if (error) throw error;
            setMentorProfile(data);
        } catch (error) {
            console.error('Error loading mentor profile:', error);
            showNotification('error', 'Không thể tải thông tin mentor');
        }
    };

    const loadBookings = async () => {
        try {
            setLoading(true);

            // First get mentor profile to get mentor_id
            const { data: mentorData, error: mentorError } = await supabase
                .from('mentors')
                .select('id')
                .eq('email', user?.email)
                .single();

            if (mentorError) throw mentorError;

            const { data, error } = await supabase
                .from('mentor_bookings')
                .select(`
                    *,
                    profiles (
                        id,
                        full_name,
                        image_url,
                        phone_number,
                        birthdate,
                        gender,
                        sub_profiles (
                            id,
                            cv,
                            linkedin_url,
                            github_url,
                            portfolio_url,
                            description,
                            university_majors (
                                universities (
                                    name,
                                    code
                                ),
                                majors (
                                    name
                                )
                            )
                        )
                    )
                `)
                .eq('mentor_id', mentorData.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBookings(data || []);
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
            const updateData: any = {
                status: newStatus,
                updated_at: new Date().toISOString()
            };

            if (newStatus === 'confirmed' && newScheduledDate) {
                updateData.scheduled_date = new Date(newScheduledDate).toISOString();
            }

            if (newStatus === 'completed') {
                updateData.completed_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('mentor_bookings')
                .update(updateData)
                .eq('id', selectedBooking.id);

            if (error) throw error;

            showNotification('success', 'Cập nhật trạng thái thành công');
            loadBookings();
            setShowStatusModal(false);
            resetModalStates();
        } catch (error) {
            console.error('Error updating booking status:', error);
            showNotification('error', 'Lỗi khi cập nhật trạng thái');
        }
    };

    const updateMentorNotes = async () => {
        if (!selectedBooking) return;

        try {
            const { error } = await supabase
                .from('mentor_bookings')
                .update({
                    mentor_notes: mentorNotes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedBooking.id);

            if (error) throw error;

            showNotification('success', 'Cập nhật ghi chú thành công');
            loadBookings();
            setShowNotesModal(false);
            resetModalStates();
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
            booking.contact_email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

        return matchesSearch && matchesStatus;
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
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'confirmed': return <CheckCircle className="w-4 h-4" />;
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
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
            case 'online': return <Video className="w-4 h-4" />;
            case 'offline': return <Coffee className="w-4 h-4" />;
            case 'hybrid': return <MapPin className="w-4 h-4" />;
            default: return <Video className="w-4 h-4" />;
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
                <div className={`fixed top-4 right-4 z-50 p-3 sm:p-4 rounded-lg shadow-lg max-w-sm ${
                    notification.type === 'success' ? 'bg-green-100 text-green-800' :
                        notification.type === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                }`}>
                    <div className="flex items-start">
                        {notification.type === 'success' && <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />}
                        {notification.type === 'error' && <XCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />}
                        {notification.type === 'warning' && <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />}
                        <span className="text-sm flex-1">{notification.message}</span>
                        <button
                            onClick={() => setNotification(null)}
                            className="ml-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                    <SectionHeader
                        title="QUẢN LÝ BOOKING"
                        subtitle="Quản lý các lịch đặt tư vấn từ học viên"
                    />
                </div>

                {/* Controls */}
                <div className="mb-6 sm:mb-8 bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                            />
                        </div>

                        {/* Filters and Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="pending">Chờ xác nhận</option>
                                <option value="confirmed">Đã xác nhận</option>
                                <option value="completed">Hoàn thành</option>
                                <option value="cancelled">Đã hủy</option>
                            </select>

                            <Button
                                variant="outline"
                                onClick={loadBookings}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Tải lại</span>
                                <span className="sm:hidden">Tải lại</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bookings List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600 text-sm sm:text-base">Đang tải...</p>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center">
                            <Users className="w-10 sm:w-12 h-10 sm:h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {bookings.length === 0 ? 'Chưa có booking nào' : 'Không tìm thấy booking'}
                            </h3>
                            <p className="text-gray-600 text-sm sm:text-base">
                                {bookings.length === 0
                                    ? 'Chưa có học viên nào đặt lịch tư vấn với bạn.'
                                    : 'Không có booking nào khớp với tiêu chí tìm kiếm.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredBookings.map((booking) => (
                                <div key={booking.id} className="p-4 sm:p-6">
                                    <div className="space-y-4">
                                        {/* Header - Mobile Stacked */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                {booking.profiles?.image_url ? (
                                                    <Image
                                                        src={booking.profiles.image_url}
                                                        alt={booking.profiles.full_name}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-full object-cover flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <User className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                                        {booking.profiles?.full_name || 'Người dùng ẩn danh'}
                                                    </h4>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                                        <p className="text-xs sm:text-sm text-gray-600">
                                                            Đặt: {new Date(booking.created_at).toLocaleDateString('vi-VN')}
                                                        </p>
                                                        {/* University info */}
                                                        {booking.profiles?.sub_profiles?.university_majors && (
                                                            <div className="flex items-center gap-1 text-xs text-blue-600">
                                                                <GraduationCap className="w-3 h-3" />
                                                                <span className="truncate">
                                                                    {booking.profiles.sub_profiles.university_majors.universities?.name ||
                                                                        booking.profiles.sub_profiles.university_majors.majors?.name}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`self-start sm:self-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 whitespace-nowrap ${getStatusColor(booking.status)}`}>
                                                {getStatusIcon(booking.status)}
                                                <span className="hidden sm:inline">{getStatusText(booking.status)}</span>
                                                <span className="sm:hidden">
                                                    {booking.status === 'pending' && 'Chờ'}
                                                    {booking.status === 'confirmed' && 'OK'}
                                                    {booking.status === 'completed' && 'Xong'}
                                                    {booking.status === 'cancelled' && 'Hủy'}
                                                </span>
                                            </span>
                                        </div>

                                        {/* Info Grid - Mobile Stacked */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400 flex-shrink-0" />
                                                <span className="min-w-0">
                                                    <strong className="hidden sm:inline">Thời gian: </strong>
                                                    <span className="truncate">
                                                        {booking.scheduled_date ?
                                                            new Date(booking.scheduled_date).toLocaleString('vi-VN', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }) :
                                                            'Chưa xác định'
                                                        }
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400 flex-shrink-0" />
                                                <span><strong className="hidden sm:inline">Thời lượng: </strong>{booking.duration}p</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getSessionTypeIcon(booking.session_type)}
                                                <span><strong className="hidden sm:inline">Hình thức: </strong>{getSessionTypeText(booking.session_type)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Mail className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400 flex-shrink-0" />
                                                <span className="truncate">
                                                    <strong className="hidden sm:inline">Email: </strong>
                                                    <span className="sm:hidden">@</span>{booking.contact_email}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Additional Student Info */}
                                        {booking.profiles?.sub_profiles && (
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <div className="text-xs sm:text-sm">
                                                    <strong className="text-blue-800">Thông tin học viên:</strong>
                                                    <div className="mt-1 space-y-1 text-blue-700">
                                                        {booking.profiles.sub_profiles.university_majors && (
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <GraduationCap className="w-3 h-3 flex-shrink-0" />
                                                                <span className="text-xs">
                                                                    {booking.profiles.sub_profiles.university_majors.universities?.name}
                                                                    {booking.profiles.sub_profiles.university_majors.majors?.name &&
                                                                        ` - ${booking.profiles.sub_profiles.university_majors.majors.name}`
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                        {booking.profiles.sub_profiles.description && (
                                                            <p className="text-xs line-clamp-2">{booking.profiles.sub_profiles.description}</p>
                                                        )}
                                                        <div className="flex gap-2 flex-wrap">
                                                            {booking.profiles.sub_profiles.linkedin_url && (
                                                                <a href={booking.profiles.sub_profiles.linkedin_url}
                                                                   target="_blank"
                                                                   className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                                    <Globe className="w-3 h-3" />LinkedIn
                                                                </a>
                                                            )}
                                                            {booking.profiles.sub_profiles.github_url && (
                                                                <a href={booking.profiles.sub_profiles.github_url}
                                                                   target="_blank"
                                                                   className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                                    <Globe className="w-3 h-3" />GitHub
                                                                </a>
                                                            )}
                                                            {booking.profiles.sub_profiles.portfolio_url && (
                                                                <a href={booking.profiles.sub_profiles.portfolio_url}
                                                                   target="_blank"
                                                                   className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                                    <Globe className="w-3 h-3" />Portfolio
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {booking.user_notes && (
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <strong className="text-xs sm:text-sm text-blue-800">Ghi chú từ học viên:</strong>
                                                <p className="text-xs sm:text-sm text-blue-700 mt-1 line-clamp-3">{booking.user_notes}</p>
                                            </div>
                                        )}

                                        {booking.mentor_notes && (
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <strong className="text-xs sm:text-sm text-green-800">Ghi chú của bạn:</strong>
                                                <p className="text-xs sm:text-sm text-green-700 mt-1 line-clamp-3">{booking.mentor_notes}</p>
                                            </div>
                                        )}

                                        {/* Action Buttons - Mobile Responsive */}
                                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                                            <button
                                                onClick={() => openDetailModal(booking)}
                                                className="flex-1 sm:flex-none text-blue-600 hover:text-blue-900 px-3 py-2 rounded-lg hover:bg-blue-50 text-xs sm:text-sm font-medium flex items-center justify-center gap-1"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="w-3 sm:w-4 h-3 sm:h-4" />
                                                <span className="hidden sm:inline">Chi tiết</span>
                                            </button>

                                            {/* Chỉ cho phép cập nhật trạng thái nếu chưa hoàn thành */}
                                            {booking.status !== 'completed' && (
                                                <button
                                                    onClick={() => openStatusModal(booking)}
                                                    className="flex-1 sm:flex-none text-green-600 hover:text-green-900 px-3 py-2 rounded-lg hover:bg-green-50 text-xs sm:text-sm font-medium flex items-center justify-center gap-1"
                                                    title="Cập nhật trạng thái"
                                                >
                                                    <Edit className="w-3 sm:w-4 h-3 sm:h-4" />
                                                    <span className="hidden sm:inline">Trạng thái</span>
                                                </button>
                                            )}

                                            {/* Chỉ cho phép ghi chú nếu chưa hoàn thành */}
                                            {booking.status !== 'completed' && (
                                                <button
                                                    onClick={() => openNotesModal(booking)}
                                                    className="flex-1 sm:flex-none text-purple-600 hover:text-purple-900 px-3 py-2 rounded-lg hover:bg-purple-50 text-xs sm:text-sm font-medium flex items-center justify-center gap-1"
                                                    title="Thêm ghi chú"
                                                >
                                                    <MessageSquare className="w-3 sm:w-4 h-3 sm:h-4" />
                                                    <span className="hidden sm:inline">Ghi chú</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Summary Stats - Mobile Grid */}
                <div className="mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {[
                        { label: 'Tổng cộng', count: bookings.length, color: 'bg-blue-100 text-blue-800' },
                        { label: 'Chờ xác nhận', count: bookings.filter(b => b.status === 'pending').length, color: 'bg-yellow-100 text-yellow-800' },
                        { label: 'Đã xác nhận', count: bookings.filter(b => b.status === 'confirmed').length, color: 'bg-green-100 text-green-800' },
                        { label: 'Hoàn thành', count: bookings.filter(b => b.status === 'completed').length, color: 'bg-purple-100 text-purple-800' }
                    ].map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                            <div className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${stat.color} mb-2`}>
                                {stat.label}
                            </div>
                            <div className="text-xl sm:text-2xl font-bold text-gray-900">{stat.count}</div>
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
                        <div className="p-4 sm:p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg sm:text-xl font-bold">Chi tiết booking</h3>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="w-5 sm:w-6 h-5 sm:h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* User Info */}
                            <div className="flex items-start gap-4">
                                {selectedBooking.profiles?.image_url ? (
                                    <Image
                                        src={selectedBooking.profiles.image_url}
                                        alt={selectedBooking.profiles.full_name}
                                        width={60}
                                        height={60}
                                        className="rounded-full object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-15 h-15 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-lg font-semibold">{selectedBooking.profiles?.full_name}</h4>
                                    <p className="text-gray-600 text-sm break-all">{selectedBooking.contact_email}</p>
                                    {selectedBooking.contact_phone && (
                                        <p className="text-gray-600 text-sm">{selectedBooking.contact_phone}</p>
                                    )}

                                    {/* Student Additional Info */}
                                    {selectedBooking.profiles?.sub_profiles && (
                                        <div className="mt-3 space-y-2">
                                            {selectedBooking.profiles.sub_profiles.university_majors && (
                                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                                    <GraduationCap className="w-4 h-4 flex-shrink-0" />
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
                                                       className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                                        <Globe className="w-3 h-3" />LinkedIn
                                                    </a>
                                                )}
                                                {selectedBooking.profiles.sub_profiles.github_url && (
                                                    <a href={selectedBooking.profiles.sub_profiles.github_url}
                                                       target="_blank"
                                                       className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                                        <Globe className="w-3 h-3" />GitHub
                                                    </a>
                                                )}
                                                {selectedBooking.profiles.sub_profiles.portfolio_url && (
                                                    <a href={selectedBooking.profiles.sub_profiles.portfolio_url}
                                                       target="_blank"
                                                       className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                                        <Globe className="w-3 h-3" />Portfolio
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Booking Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <strong>Thời gian đặt:</strong>
                                    <p>{new Date(selectedBooking.created_at).toLocaleString('vi-VN')}</p>
                                </div>
                                <div>
                                    <strong>Thời gian mong muốn:</strong>
                                    <p>{selectedBooking.scheduled_date ?
                                        new Date(selectedBooking.scheduled_date).toLocaleString('vi-VN') :
                                        'Chưa xác định'
                                    }</p>
                                </div>
                                <div>
                                    <strong>Thời lượng:</strong>
                                    <p>{selectedBooking.duration} phút</p>
                                </div>
                                <div>
                                    <strong>Hình thức:</strong>
                                    <p className="flex items-center gap-1">
                                        {getSessionTypeIcon(selectedBooking.session_type)}
                                        {getSessionTypeText(selectedBooking.session_type)}
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <strong>Trạng thái:</strong>
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                                        {getStatusText(selectedBooking.status)}
                                    </span>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedBooking.user_notes && (
                                <div>
                                    <strong>Ghi chú từ học viên:</strong>
                                    <p className="mt-1 p-3 bg-blue-50 rounded-lg text-sm">{selectedBooking.user_notes}</p>
                                </div>
                            )}

                            {selectedBooking.mentor_notes && (
                                <div>
                                    <strong>Ghi chú của bạn:</strong>
                                    <p className="mt-1 p-3 bg-green-50 rounded-lg text-sm">{selectedBooking.mentor_notes}</p>
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
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="w-5 sm:w-6 h-5 sm:h-6" />
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowStatusModal(false)}
                                className="w-full sm:w-auto"
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={updateBookingStatus}
                                className="w-full sm:w-auto flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Cập nhật
                            </Button>
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
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="w-5 sm:w-6 h-5 sm:h-6" />
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                                    placeholder="Thêm ghi chú về buổi tư vấn, phản hồi cho học viên..."
                                />
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    Ghi chú này sẽ được hiển thị cho học viên
                                </p>
                            </div>

                            {/* Current user notes display */}
                            {selectedBooking.user_notes && (
                                <div>
                                    <strong className="text-sm text-gray-700">Ghi chú từ học viên:</strong>
                                    <p className="text-sm text-gray-600 mt-1 p-3 bg-blue-50 rounded-lg">
                                        {selectedBooking.user_notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowNotesModal(false)}
                                className="w-full sm:w-auto"
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={updateMentorNotes}
                                className="w-full sm:w-auto flex items-center justify-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Lưu ghi chú
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingMentorPage;