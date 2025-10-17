// src/app/events/page.tsx
'use client';
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { SectionHeader } from '@/component/SectionHeader';
import { Button } from '@/component/Button';
import {
    Calendar,
    MapPin,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Video,
    Coffee,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    X,
    Mail,
    Phone,
    Star,
    Loader2,
    ArrowLeft,
    QrCode,
    ExternalLink,
    LogIn,
    Camera
} from 'lucide-react';
import Image from 'next/image';
import {
    Event,
    EventDetail,
    EventReview,
    RegistrationFormData,
    EventFilters,
    PaginationState
} from '@/types/events_user';
import { useRouter, useSearchParams } from 'next/navigation';

const ITEMS_PER_PAGE = 12;

// Helper: Kiểm tra sự kiện đã kết thúc
const isEventPast = (event: Event | EventDetail) => {
    const now = new Date();

    // Nếu có end_date, dùng end_date
    if (event.end_date) {
        const endDate = new Date(event.end_date);
        return now > endDate;
    }

    // Nếu không có end_date, cộng thêm 24h vào event_date
    const eventDate = new Date(event.event_date);
    const eventEndTime = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
    return now > eventEndTime;
};

// Component chính
const EventsContent = () => {
    const { user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // View mode
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    // Events list states
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<EventFilters>({
        searchTerm: '',
        eventTypeFilter: 'all',
        statusFilter: 'upcoming',
        dateFrom: '',
        dateTo: ''
    });
    const [pagination, setPagination] = useState<PaginationState>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        itemsPerPage: ITEMS_PER_PAGE
    });

    // Event detail states
    const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
    const [eventReviews, setEventReviews] = useState<EventReview[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    // Registration modal
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [registeringEvent, setRegisteringEvent] = useState<Event | EventDetail | null>(null);
    const [registrationFormData, setRegistrationFormData] = useState<RegistrationFormData>({
        contact_email: '',
        contact_phone: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Check-in modal
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [checkInCode, setCheckInCode] = useState('');
    const [checkingIn, setCheckingIn] = useState(false);

    // QR Scanner modal
    const [showQRScannerModal, setShowQRScannerModal] = useState(false);
    const [qrError, setQrError] = useState<string | null>(null);

    // Notification
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
    } | null>(null);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const eventId = searchParams.get('id');
        if (eventId) {
            setSelectedEventId(eventId);
            setViewMode('detail');
        }
    }, [searchParams]);

    useEffect(() => {
        if (viewMode === 'list') {
            loadEvents();
            if (searchParams.get('id')) {
                router.push('/events', { scroll: false });
            }
        }
    }, [viewMode, pagination.currentPage, filters, user]);

    useEffect(() => {
        if (viewMode === 'detail' && selectedEventId) {
            loadEventDetail();
            loadEventReviews();
        }
    }, [viewMode, selectedEventId, user]);

    useEffect(() => {
        if (user?.email) {
            setRegistrationFormData(prev => ({
                ...prev,
                contact_email: user.email || prev.contact_email
            }));
        }
    }, [user]);

    // PHẦN 7: Tự động bắt đầu quét khi mở modal
    useEffect(() => {
        let scanInterval: NodeJS.Timeout;

        if (showQRScannerModal) {
            // Bắt đầu quét tự động khi modal mở
            startQRScanner().then(() => {
                // Bắt đầu loop quét
                scanInterval = setInterval(() => {
                    if (showQRScannerModal && stream && !checkingIn) {
                        handleQRScan();
                    }
                }, 500); // Quét mỗi 500ms
            });
        } else if (stream) {
            // Dừng camera khi đóng modal
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }

        return () => {
            if (scanInterval) {
                clearInterval(scanInterval);
            }
        };
    }, [showQRScannerModal, stream, checkingIn]);

    // PHẦN 1: THÊM useEffect để lock scroll khi modal mở
    useEffect(() => {
        const isAnyModalOpen = showRegisterModal || showCheckInModal || showQRScannerModal;

        if (isAnyModalOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
        } else {
            // Restore scroll position
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';

            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        }

        // Cleanup on unmount
        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
        };
    }, [showRegisterModal, showCheckInModal, showQRScannerModal]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const dateFromFilter = filters.dateFrom ? new Date(filters.dateFrom).toISOString() : null;
            const dateToFilter = filters.dateTo ? new Date(filters.dateTo + 'T23:59:59').toISOString() : null;

            const { data, error } = await supabase.rpc('events_user_get_list', {
                p_user_id: user?.id || null,
                p_search_term: filters.searchTerm || null,
                p_event_type: filters.eventTypeFilter === 'all' ? null : filters.eventTypeFilter,
                p_status: filters.statusFilter === 'all' ? null : filters.statusFilter,
                p_date_from: dateFromFilter,
                p_date_to: dateToFilter,
                p_limit: ITEMS_PER_PAGE,
                p_offset: (pagination.currentPage - 1) * ITEMS_PER_PAGE
            });

            if (error) throw error;

            setEvents(data?.events || []);
            setPagination(prev => ({
                ...prev,
                totalCount: data?.total_count || 0,
                totalPages: Math.ceil((data?.total_count || 0) / ITEMS_PER_PAGE)
            }));
        } catch (error: any) {
            console.error('Error loading events:', error);
            showNotification('error', error.message || 'Không thể tải danh sách sự kiện');
        } finally {
            setLoading(false);
        }
    };

    const loadEventDetail = async () => {
        if (!selectedEventId) return;
        try {
            setDetailLoading(true);
            const { data, error } = await supabase.rpc('events_user_get_detail', {
                p_event_id: selectedEventId,
                p_user_id: user?.id || null
            });
            if (error) throw error;
            setSelectedEvent(data);
        } catch (error: any) {
            console.error('Error loading event detail:', error);
            showNotification('error', error.message || 'Không thể tải chi tiết sự kiện');
        } finally {
            setDetailLoading(false);
        }
    };

    const loadEventReviews = async () => {
        if (!selectedEventId) return;
        try {
            const { data, error } = await supabase.rpc('events_user_get_reviews', {
                p_event_id: selectedEventId,
                p_limit: 100,
                p_offset: 0
            });
            if (error) throw error;
            setEventReviews(data?.reviews || []);
        } catch (error: any) {
            console.error('Error loading reviews:', error);
        }
    };

    const openRegisterModal = (event: Event | EventDetail) => {
        if (!user) {
            showNotification('warning', 'Vui lòng đăng nhập để đăng ký sự kiện');
            return;
        }
        setRegisteringEvent(event);
        setRegistrationFormData({
            contact_email: user.email || '',
            contact_phone: ''
        });
        setShowRegisterModal(true);
    };

    const submitRegistration = async () => {
        if (!user || !registeringEvent) return;
        if (!registrationFormData.contact_email) {
            showNotification('error', 'Vui lòng nhập email liên hệ');
            return;
        }

        try {
            setSubmitting(true);
            const { data, error } = await supabase.rpc('events_user_register', {
                p_event_id: registeringEvent.id,
                p_user_id: user.id,
                p_contact_email: registrationFormData.contact_email,
                p_contact_phone: registrationFormData.contact_phone || null
            });

            if (error) throw error;

            try {
                const userName = user?.email?.split('@')[0] || 'User';
                const { data: emailData, error: emailError } = await supabase.functions.invoke(
                    'send-event-registration-notification',
                    {
                        body: {
                            registration_id: data?.registration_id || 'temp-id',
                            event_id: registeringEvent.id,
                            event_title: registeringEvent.title,
                            event_date: registeringEvent.event_date,
                            event_location: registeringEvent.location || '',
                            event_type: registeringEvent.event_type || 'online',
                            user_email: registrationFormData.contact_email,
                            user_name: userName,
                            contact_phone: registrationFormData.contact_phone,
                            require_approval: registeringEvent.require_approval || false,
                        }
                    }
                );

                if (emailError) {
                    console.error('Email notification error:', emailError);
                } else {
                    console.log('✅ Email sent successfully:', emailData);
                }
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
            }

            showNotification('success', data?.message || 'Đăng ký thành công!');
            setShowRegisterModal(false);
            setRegisteringEvent(null);

            if (viewMode === 'list') {
                await loadEvents();
            } else if (viewMode === 'detail') {
                await loadEventDetail();
            }
        } catch (error: any) {
            console.error('Error registering:', error);
            showNotification('error', error.message || 'Đăng ký thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const cancelRegistration = async (registrationId: string) => {
        if (!user) return;
        if (!registrationId) {
            showNotification('error', 'Không tìm thấy thông tin đăng ký');
            return;
        }
        if (!confirm('Bạn có chắc chắn muốn hủy đăng ký này?')) return;

        try {
            setSubmitting(true);
            const { data, error } = await supabase.rpc('events_user_cancel_registration', {
                p_registration_id: registrationId,
                p_user_id: user.id
            });

            if (error) throw error;

            showNotification('success', data?.message || 'Đã hủy đăng ký');

            if (viewMode === 'detail') {
                await loadEventDetail();
            } else {
                await loadEvents();
            }
        } catch (error: any) {
            console.error('Error canceling:', error);
            showNotification('error', error.message || 'Không thể hủy đăng ký');
        } finally {
            setSubmitting(false);
        }
    };

    const openCheckInModal = () => {
        if (!selectedEvent) return;
        setCheckInCode('');
        setShowCheckInModal(true);
    };

    const submitCheckIn = async (code?: string) => {
        if (!user || !selectedEvent || !selectedEvent.user_registration_id) return;

        const finalCode = code || checkInCode.trim();
        if (!finalCode) {
            showNotification('error', 'Vui lòng nhập mã check-in');
            return;
        }

        try {
            setCheckingIn(true);
            const { data, error } = await supabase.rpc('events_user_check_in', {
                p_registration_id: selectedEvent.user_registration_id,
                p_user_id: user.id,
                p_code: finalCode
            });

            if (error) throw error;

            showNotification('success', data?.message || 'Check-in thành công!');
            setShowCheckInModal(false);
            setShowQRScannerModal(false);
            setCheckInCode('');

            if (viewMode === 'detail') {
                await loadEventDetail();
            } else {
                await loadEvents();
            }
        } catch (error: any) {
            console.error('Error checking in:', error);
            showNotification('error', error.message || 'Check-in thất bại');
        } finally {
            setCheckingIn(false);
        }
    };

    // QR Scanner functions
    const startQRScanner = async () => {
        setQrError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setQrError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
        }
    };

    const stopQRScanner = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    // PHẦN 6: FIX QR Scanner - Sử dụng jsQR library
    const handleQRScan = async () => {
        if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) return;

        const canvas = document.createElement('canvas');
        const video = videoRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Sử dụng jsQR để quét
        try {
            const jsQR = (await import('jsqr')).default;
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                await processQRData(code.data);
            }
        } catch (error) {
            console.error('Error scanning QR:', error);
            setQrError('Lỗi khi quét QR code');
        }
    };

    const processQRData = async (qrData: string) => {
        try {
            const parsed = JSON.parse(qrData);
            if (parsed.type === 'event_checkin' && parsed.code) {
                stopQRScanner();
                await submitCheckIn(parsed.code);
            } else {
                setQrError('QR code không hợp lệ');
            }
        } catch (error) {
            setQrError('Không thể đọc QR code');
        }
    };

    const openEventDetail = (eventId: string) => {
        setSelectedEventId(eventId);
        setViewMode('detail');
        router.push(`/events?id=${eventId}`, { scroll: false });
    };

    const backToList = () => {
        setViewMode('list');
        setSelectedEventId(null);
        setSelectedEvent(null);
        setEventReviews([]);
    };

    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const getEventTypeIcon = (type: string) => {
        switch (type) {
            case 'online': return <Video className="w-4 h-4" />;
            case 'offline': return <Coffee className="w-4 h-4" />;
            case 'hybrid': return <MapPin className="w-4 h-4" />;
            default: return <Video className="w-4 h-4" />;
        }
    };

    const getEventTypeLabel = (type: string) => {
        switch (type) {
            case 'online': return 'Online';
            case 'offline': return 'Offline';
            case 'hybrid': return 'Hybrid';
            default: return type;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Chờ duyệt
                    </span>
                );
            case 'confirmed':
                return (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Đã xác nhận
                    </span>
                );
            case 'rejected':
                return (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Từ chối
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Hủy
                    </span>
                );
            default:
                return null;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // PHẦN 2: CẬP NHẬT hàm canCheckIn
    const canCheckIn = (event: Event | EventDetail) => {
        if (!event) return false;
        if (!event.is_registered || event.user_registration_status !== 'confirmed') return false;
        if (!event.check_in_enabled) return false;
        if (event.is_checked_in) return false; // ✅ Đã check-in rồi

        const now = new Date();
        const eventDate = new Date(event.event_date);

        const endDate = event.end_date
            ? new Date(event.end_date)
            : new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);

        // Chỉ cho check-in từ khi sự kiện bắt đầu đến khi kết thúc
        return now >= eventDate && now <= endDate;
    };

    // PHẦN 3: THÊM hàm kiểm tra có thể hủy đăng ký không
    const canCancelRegistration = (event: Event | EventDetail) => {
        if (!event.is_registered) return false;
        if (event.user_registration_status !== 'pending' && event.user_registration_status !== 'confirmed') return false;

        // ✅ Không cho hủy nếu sự kiện đã bắt đầu
        const now = new Date();
        const eventDate = new Date(event.event_date);
        return now < eventDate;
    };

    // PHẦN 4: THÊM hàm kiểm tra vắng mặt
    const isAbsent = (event: Event | EventDetail) => {
        if (!event.is_registered) return false;
        if (event.user_registration_status !== 'confirmed') return false;
        if (event.is_checked_in) return false; // Đã check-in thì không vắng

        // Kiểm tra sự kiện đã kết thúc chưa
        return isEventPast(event);
    };

    const isRegistrationDeadlinePassed = (event: Event | EventDetail) => {
        if (!event.registration_deadline) return false;
        const now = new Date();
        const deadline = new Date(event.registration_deadline);
        return now > deadline;
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

    // RENDER - Events List View
    if (viewMode === 'list') {
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
                            <button onClick={() => setNotification(null)} className="ml-4 text-gray-500 hover:text-gray-700">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        title="SỰ KIỆN"
                        subtitle="Khám phá và đăng ký các sự kiện hấp dẫn"
                    />

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="relative lg:col-span-2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sự kiện..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <select
                                value={filters.statusFilter}
                                onChange={(e) => setFilters(prev => ({ ...prev, statusFilter: e.target.value }))}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Tất cả</option>
                                <option value="upcoming">Sắp diễn ra</option>
                                <option value="past">Đã diễn ra</option>
                                {user && <option value="my_events">Sự kiện của tôi</option>}
                            </select>

                            <select
                                value={filters.eventTypeFilter}
                                onChange={(e) => setFilters(prev => ({ ...prev, eventTypeFilter: e.target.value }))}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Tất cả hình thức</option>
                                <option value="online">Online</option>
                                <option value="offline">Offline</option>
                                <option value="hybrid">Hybrid</option>
                            </select>

                            <button
                                onClick={() => setFilters({
                                    searchTerm: '',
                                    eventTypeFilter: 'all',
                                    statusFilter: 'upcoming',
                                    dateFrom: '',
                                    dateTo: ''
                                })}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>

                    {/* Events Grid */}
                    {loading ? (
                        <div className="py-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600">Đang tải...</p>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Không có sự kiện nào
                            </h3>
                            <p className="text-gray-600">
                                Không tìm thấy sự kiện phù hợp với bộ lọc của bạn.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                {events.map((event) => {
                                    const isPast = isEventPast(event);
                                    return (
                                        <div
                                            key={event.id}
                                            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                            onClick={() => openEventDetail(event.id)}
                                        >
                                            {/* Event Image */}
                                            <div className="relative h-48">
                                                {event.thumbnail ? (
                                                    <Image
                                                        src={event.thumbnail}
                                                        alt={event.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                        <Calendar className="w-16 h-16 text-white opacity-50" />
                                                    </div>
                                                )}

                                                {/* Status Badge */}
                                                {event.is_registered && event.user_registration_status && event.user_registration_status !== 'cancelled' && (
                                                    <div className="absolute top-3 right-3">
                                                        {getStatusBadge(event.user_registration_status)}
                                                    </div>
                                                )}

                                                {event.is_full && !event.is_registered && (
                                                    <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                                                        Đã đầy
                                                    </div>
                                                )}

                                                {isPast && (
                                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                        <span className="text-white font-semibold text-lg">Đã kết thúc</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Event Info */}
                                            <div className="p-6">
                                                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                                    {event.title || 'Đang cập nhật'}
                                                </h3>

                                                {event.description && (
                                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                                        {event.description}
                                                    </p>
                                                )}

                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 flex-shrink-0" />
                                                        <span className="truncate">
                                                            {event.event_date ? new Date(event.event_date).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        {getEventTypeIcon(event.event_type || '')}
                                                        <span>{event.event_type ? getEventTypeLabel(event.event_type) : 'Đang cập nhật'}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4 flex-shrink-0" />
                                                        <span className="line-clamp-1">{event.location || 'Đang cập nhật'}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Users className="w-4 h-4 flex-shrink-0" />
                                                        <span>
                                                            {event.participant_count || 0}
                                                            {event.max_participants && ` / ${event.max_participants}`} người
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    {event.is_registered && event.user_registration_status !== 'cancelled' && event.user_registration_status !== 'rejected' ? (
                                                        <button
                                                            className="w-full px-4 py-2 bg-green-50 border-2 border-green-300 text-green-700 rounded-lg font-medium flex items-center justify-center gap-2"
                                                            disabled
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Đã đăng ký
                                                        </button>
                                                    ) : event.can_register ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openRegisterModal(event);
                                                            }}
                                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                                        >
                                                            Đăng ký
                                                        </button>
                                                    ) : isRegistrationDeadlinePassed(event) && !isPast ? (
                                                        <button
                                                            className="w-full px-4 py-2 bg-gray-100 border border-gray-300 text-gray-600 rounded-lg font-medium flex items-center justify-center gap-2"
                                                            disabled
                                                        >
                                                            <Clock className="w-4 h-4" />
                                                            Đã hết hạn đăng ký
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-sm text-gray-700">
                                            Trang {pagination.currentPage} / {pagination.totalPages} (Tổng {pagination.totalCount} sự kiện)
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                                                disabled={pagination.currentPage === 1}
                                                className={`flex items-center px-3 py-2 rounded-lg ${
                                                    pagination.currentPage === 1
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
                                                                onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum as number }))}
                                                                className={`px-3 py-2 rounded-lg ${
                                                                    pagination.currentPage === pageNum
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
                                                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                                                disabled={pagination.currentPage === pagination.totalPages}
                                                className={`flex items-center px-3 py-2 rounded-lg ${
                                                    pagination.currentPage === pagination.totalPages
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
                        </>
                    )}
                </div>

                {/* Registration Modal */}
                {showRegisterModal && registeringEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={() => !submitting && setShowRegisterModal(false)}
                        />

                        <div className="relative bg-white rounded-xl max-w-md w-full">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Đăng ký sự kiện</h3>
                                    <button
                                        onClick={() => !submitting && setShowRegisterModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                        disabled={submitting}
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-2">{registeringEvent.title}</h4>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {registeringEvent.event_date ? formatDate(registeringEvent.event_date) : 'Đang cập nhật'}
                                        </div>
                                        {registeringEvent.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                {registeringEvent.location}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email liên hệ *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="email"
                                            value={registrationFormData.contact_email}
                                            onChange={(e) => setRegistrationFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="email@example.com"
                                            disabled={submitting}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Số điện thoại
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="tel"
                                            value={registrationFormData.contact_phone}
                                            onChange={(e) => setRegistrationFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="0123456789"
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>

                                {registeringEvent.require_approval && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                                        <AlertCircle className="w-4 h-4 inline mr-2" />
                                        Sự kiện này yêu cầu phê duyệt từ ban tổ chức.
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => !submitting && setShowRegisterModal(false)}
                                    disabled={submitting}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={submitRegistration}
                                    disabled={submitting || !registrationFormData.contact_email}
                                    className="flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang đăng ký...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Xác nhận đăng ký
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // RENDER - Event Detail View
    if (viewMode === 'detail' && selectedEvent) {
        const isPast = isEventPast(selectedEvent);
        const canDoCheckIn = canCheckIn(selectedEvent);

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

                <div className="max-w-5xl mx-auto">
                    <button
                        onClick={backToList}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại danh sách
                    </button>

                    {detailLoading ? (
                        <div className="py-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600">Đang tải...</p>
                        </div>
                    ) : (
                        <>
                            {/* Event Header */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                                {/* Event Image */}
                                <div className="relative h-96">
                                    {selectedEvent.thumbnail ? (
                                        <Image
                                            src={selectedEvent.thumbnail}
                                            alt={selectedEvent.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <Calendar className="w-24 h-24 text-white opacity-50" />
                                        </div>
                                    )}

                                    {isPast && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <span className="text-white font-bold text-2xl">Sự kiện đã kết thúc</span>
                                        </div>
                                    )}
                                </div>

                                {/* Event Info */}
                                <div className="p-8">
                                    <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
                                        <div className="flex-1">
                                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                                {selectedEvent.title || 'Đang cập nhật'}
                                            </h1>

                                            {selectedEvent.description && (
                                                <p className="text-lg text-gray-600 mb-6">
                                                    {selectedEvent.description}
                                                </p>
                                            )}
                                        </div>

                                        {selectedEvent.is_registered && selectedEvent.user_registration_status && selectedEvent.user_registration_status !== 'cancelled' && (
                                            <div>
                                                {getStatusBadge(selectedEvent.user_registration_status)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Event Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <div className="text-sm text-gray-500">Thời gian bắt đầu</div>
                                                    <div className="font-medium">
                                                        {selectedEvent.event_date ? formatDate(selectedEvent.event_date) : 'Đang cập nhật'}
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedEvent.end_date && (
                                                <div className="flex items-start gap-3">
                                                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <div className="text-sm text-gray-500">Thời gian kết thúc</div>
                                                        <div className="font-medium">{formatDate(selectedEvent.end_date)}</div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-start gap-3">
                                                {getEventTypeIcon(selectedEvent.event_type || '')}
                                                <div>
                                                    <div className="text-sm text-gray-500">Hình thức</div>
                                                    <div className="font-medium">
                                                        {selectedEvent.event_type ? getEventTypeLabel(selectedEvent.event_type) : 'Đang cập nhật'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <div className="text-sm text-gray-500">Địa điểm</div>
                                                    <div className="font-medium">{selectedEvent.location || 'Đang cập nhật'}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <div className="text-sm text-gray-500">Số lượng</div>
                                                    <div className="font-medium">
                                                        {selectedEvent.participant_count || 0}
                                                        {selectedEvent.max_participants && ` / ${selectedEvent.max_participants}`} người đã đăng ký
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedEvent.registration_deadline && (
                                                <div className="flex items-start gap-3">
                                                    <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <div className="text-sm text-gray-500">Hạn đăng ký</div>
                                                        <div className="font-medium">
                                                            {new Date(selectedEvent.registration_deadline).toLocaleString('vi-VN')}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* PHẦN 5: CẬP NHẬT Action Buttons trong Event Detail */}
                                    <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-3'} pt-6 border-t border-gray-200`}>
                                        {/* Đăng ký */}
                                        {(!selectedEvent.is_registered || selectedEvent.user_registration_status === 'cancelled' || selectedEvent.user_registration_status === 'rejected') && selectedEvent.can_register && (
                                            <button
                                                onClick={() => openRegisterModal(selectedEvent)}
                                                className={`${isMobile ? 'col-span-2' : ''} px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium`}
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="text-sm sm:text-base">Đăng ký ngay</span>
                                            </button>
                                        )}

                                        {/* Hủy đăng ký - CHỈ HIỂN THỊ NẾU CÒN CHO PHÉP HỦY */}
                                        {selectedEvent.is_registered && selectedEvent.user_registration_id && canCancelRegistration(selectedEvent) && (
                                            <button
                                                onClick={() => cancelRegistration(selectedEvent.user_registration_id!)}
                                                disabled={submitting}
                                                className={`${isMobile ? 'col-span-2' : ''} px-4 py-3 bg-white border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2 font-medium disabled:opacity-50`}
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        <span className="text-sm sm:text-base">Đang hủy...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-5 h-5" />
                                                        <span className="text-sm sm:text-base">Hủy đăng ký</span>
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {/* ✅ CHỈ HIỂN THỊ NÚT CHECK-IN NẾU CHƯA CHECK-IN */}
                                        {canDoCheckIn && (
                                            <>
                                                {/* Check-in với mã */}
                                                <button
                                                    onClick={openCheckInModal}
                                                    className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 font-medium"
                                                >
                                                    <LogIn className="w-5 h-5" />
                                                    <span className="text-sm sm:text-base">Nhập mã</span>
                                                </button>

                                                {/* QR Scanner */}
                                                <button
                                                    onClick={() => {
                                                        setShowQRScannerModal(true);
                                                    }}
                                                    className="px-4 py-3 bg-white border-2 border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 flex items-center justify-center gap-2 font-medium"
                                                >
                                                    <QrCode className="w-5 h-5" />
                                                    <span className="text-sm sm:text-base">Quét QR</span>
                                                </button>
                                            </>
                                        )}

                                        {/* Link bài viết */}
                                        {selectedEvent.post_id && (
                                            <button
                                                onClick={() => window.open(`/posts/${selectedEvent.post_id}`, '_blank')}
                                                className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                                <span className="text-sm sm:text-base">Bài viết</span>
                                            </button>
                                        )}

                                        {/* ✅ HIỂN THỊ ĐÃ CHECK-IN */}
                                        {selectedEvent.is_checked_in && (
                                            <div className={`${isMobile ? 'col-span-2' : ''} px-4 py-3 bg-green-50 border-2 border-green-300 rounded-lg flex items-center justify-center`}>
                                                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                                <span className="text-green-800 font-medium text-sm sm:text-base">Đã check-in</span>
                                            </div>
                                        )}

                                        {/* ✅ HIỂN THỊ VẮNG MẶT */}
                                        {isAbsent(selectedEvent) && (
                                            <div className={`${isMobile ? 'col-span-2' : ''} px-4 py-3 bg-red-50 border-2 border-red-300 rounded-lg flex items-center justify-center`}>
                                                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                                                <span className="text-red-800 font-medium text-sm sm:text-base">Vắng mặt</span>
                                            </div>
                                        )}

                                        {/* Đã xác nhận nhưng chưa đến thời gian check-in */}
                                        {selectedEvent.is_registered && selectedEvent.user_registration_status === 'confirmed' && !canDoCheckIn && !selectedEvent.is_checked_in && !isAbsent(selectedEvent) && (
                                            <div className={`${isMobile ? 'col-span-2' : ''} px-4 py-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center`}>
                                                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                                <span className="text-green-800 font-medium text-sm sm:text-base">Bạn đã đăng ký sự kiện này</span>
                                            </div>
                                        )}

                                        {/* Chờ duyệt */}
                                        {selectedEvent.is_registered && selectedEvent.user_registration_status === 'pending' && (
                                            <div className={`${isMobile ? 'col-span-2' : ''} px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-center`}>
                                                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                                                <span className="text-yellow-800 font-medium text-sm sm:text-base">Đang chờ phê duyệt</span>
                                            </div>
                                        )}

                                        {/* Đã đầy */}
                                        {selectedEvent.is_full && !selectedEvent.is_registered && (
                                            <div className={`${isMobile ? 'col-span-2' : ''} px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center`}>
                                                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                                                <span className="text-red-800 font-medium text-sm sm:text-base">Sự kiện đã đầy</span>
                                            </div>
                                        )}

                                        {/* Hết hạn đăng ký */}
                                        {!selectedEvent.is_registered && !selectedEvent.can_register && isRegistrationDeadlinePassed(selectedEvent) && !isPast && !selectedEvent.is_full && (
                                            <div className={`${isMobile ? 'col-span-2' : ''} px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-center`}>
                                                <Clock className="w-5 h-5 text-orange-600 mr-2" />
                                                <span className="text-orange-800 font-medium text-sm sm:text-base">Đã hết hạn đăng ký</span>
                                            </div>
                                        )}

                                        {/* Sự kiện đã kết thúc */}
                                        {isPast && !selectedEvent.is_registered && (
                                            <div className={`${isMobile ? 'col-span-2' : ''} px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center`}>
                                                <Clock className="w-5 h-5 text-gray-600 mr-2" />
                                                <span className="text-gray-800 font-medium text-sm sm:text-base">Sự kiện đã kết thúc</span>
                                            </div>
                                        )}
                                    </div>


                                    {selectedEvent.require_approval && selectedEvent.can_register && (
                                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <AlertCircle className="w-5 h-5 text-yellow-600 inline mr-2" />
                                            <span className="text-sm text-yellow-800">
                                                Sự kiện này yêu cầu phê duyệt từ ban tổ chức.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reviews Section */}
                            {eventReviews.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            Đánh giá ({eventReviews.length})
                                        </h2>
                                        {selectedEvent.average_rating && (
                                            <div className="flex items-center gap-2">
                                                <Star className="w-6 h-6 text-yellow-400 fill-current" />
                                                <span className="text-2xl font-bold text-gray-900">
                                                    {selectedEvent.average_rating.toFixed(1)}
                                                </span>
                                                <span className="text-gray-600">/ 5.0</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        {eventReviews.map((review) => (
                                            <div key={review.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                                                <div className="flex items-start gap-4">
                                                    {review.user_avatar ? (
                                                        <Image
                                                            src={review.user_avatar}
                                                            alt={review.user_name || 'User'}
                                                            width={48}
                                                            height={48}
                                                            className="rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <Users className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                                            <h4 className="font-semibold text-gray-900">
                                                                {review.user_name || 'Người dùng ẩn danh'}
                                                            </h4>
                                                            <div className="flex items-center gap-1">
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
                                                            </div>
                                                        </div>

                                                        {review.comment && (
                                                            <p className="text-gray-700 mb-2">{review.comment}</p>
                                                        )}

                                                        <p className="text-sm text-gray-500">
                                                            {new Date(review.created_at).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Registration Modal */}
                {showRegisterModal && registeringEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={() => !submitting && setShowRegisterModal(false)}
                        />

                        <div className="relative bg-white rounded-xl max-w-md w-full">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Đăng ký sự kiện</h3>
                                    <button
                                        onClick={() => !submitting && setShowRegisterModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                        disabled={submitting}
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-2">{registeringEvent.title}</h4>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {registeringEvent.event_date ? formatDate(registeringEvent.event_date) : 'Đang cập nhật'}
                                        </div>
                                        {registeringEvent.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                {registeringEvent.location}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email liên hệ *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="email"
                                            value={registrationFormData.contact_email}
                                            onChange={(e) => setRegistrationFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="email@example.com"
                                            disabled={submitting}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Số điện thoại
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="tel"
                                            value={registrationFormData.contact_phone}
                                            onChange={(e) => setRegistrationFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="0123456789"
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>

                                {registeringEvent.require_approval && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                                        <AlertCircle className="w-4 h-4 inline mr-2" />
                                        Sự kiện này yêu cầu phê duyệt từ ban tổ chức.
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => !submitting && setShowRegisterModal(false)}
                                    disabled={submitting}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={submitRegistration}
                                    disabled={submitting || !registrationFormData.contact_email}
                                    className="flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang đăng ký...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Xác nhận đăng ký
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Check-in Modal */}
                {showCheckInModal && selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={() => !checkingIn && setShowCheckInModal(false)}
                        />

                        <div className="relative bg-white rounded-xl max-w-md w-full">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Check-in sự kiện</h3>
                                    <button
                                        onClick={() => !checkingIn && setShowCheckInModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                        disabled={checkingIn}
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-2">{selectedEvent.title}</h4>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {selectedEvent.event_date && formatDate(selectedEvent.event_date)}
                                        </div>
                                        {selectedEvent.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                {selectedEvent.location}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mã check-in *
                                    </label>
                                    <input
                                        type="text"
                                        value={checkInCode}
                                        onChange={(e) => setCheckInCode(e.target.value.toUpperCase())}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-lg font-bold uppercase"
                                        placeholder="Nhập mã check-in"
                                        disabled={checkingIn}
                                        maxLength={10}
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Nhập mã check-in được cung cấp tại sự kiện
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => !checkingIn && setShowCheckInModal(false)}
                                    disabled={checkingIn}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={() => submitCheckIn()}
                                    disabled={checkingIn || !checkInCode.trim()}
                                    className="flex items-center gap-2"
                                >
                                    {checkingIn ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang check-in...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-4 h-4" />
                                            Xác nhận check-in
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* QR Scanner Modal */}
                {showQRScannerModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={() => {
                                stopQRScanner();
                                setShowQRScannerModal(false);
                            }}
                        />

                        <div className="relative bg-white rounded-xl max-w-md w-full">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Quét QR Code</h3>
                                    <button
                                        onClick={() => {
                                            stopQRScanner();
                                            setShowQRScannerModal(false);
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* PHẦN 8: CẬP NHẬT QR Scanner Modal UI */}
                            <div className="p-6">
                                {qrError ? (
                                    <div className="text-center">
                                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                        <p className="text-red-600 mb-4">{qrError}</p>
                                        <button
                                            onClick={() => {
                                                setQrError(null);
                                                startQRScanner();
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Thử lại
                                        </button>
                                    </div>
                                ) : stream ? (
                                    <div className="space-y-4">
                                        <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Khung quét với animation */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="relative w-3/4 h-3/4">
                                                    <div className="absolute inset-0 border-4 border-blue-500 rounded-lg"></div>
                                                    <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 animate-scan"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 mb-2">
                                                Đang quét tự động...
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Đặt QR code vào khung hình
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
                                        <p className="text-gray-600">Đang mở camera...</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-200">
                                <button
                                    onClick={openCheckInModal}
                                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Hoặc nhập mã thủ công
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

// Wrapper component with Suspense
const EventsPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải...</p>
                    </div>
                </div>
            </div>
        }>
            <EventsContent />
        </Suspense>
    );
};

export default EventsPage;