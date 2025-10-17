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

    // [FIX 1 Applied]
    useEffect(() => {
        let animationFrameId: number;
        let isScanning = false;

        const scanQR = async () => {
            if (!showQRScannerModal || !stream || checkingIn || isScanning) {
                return;
            }

            isScanning = true;

            try {
                await handleQRScan();
            } catch (error) {
                console.error('Scan error:', error);
            } finally {
                isScanning = false;
                // Tiếp tục quét
                if (showQRScannerModal && stream) {
                    animationFrameId = requestAnimationFrame(() => {
                        setTimeout(scanQR, 300); // Delay 300ms giữa các lần quét
                    });
                }
            }
        };

        if (showQRScannerModal && stream) {
            // Bắt đầu quét sau khi video đã sẵn sàng
            const video = videoRef.current;
            if (video) {
                const startScanning = () => {
                    if (video.readyState === video.HAVE_ENOUGH_DATA) {
                        scanQR();
                    } else {
                        setTimeout(startScanning, 100);
                    }
                };
                startScanning();
            }
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        };
    }, [showQRScannerModal, stream, checkingIn]);

    useEffect(() => {
        const isAnyModalOpen = showRegisterModal || showCheckInModal || showQRScannerModal;

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

    const startQRScanner = async () => {
        setQrError(null);

        // Đảm bảo modal hiển thị trước khi mở camera
        await new Promise(resolve => setTimeout(resolve, 200));

        try {
            // Kiểm tra hỗ trợ
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Trình duyệt không hỗ trợ camera');
            }

            // Yêu cầu quyền camera (ưu tiên cam sau)
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            console.log("✅ Camera stream nhận được:", mediaStream.getVideoTracks());

            const video = videoRef.current;
            if (!video) throw new Error('Không tìm thấy phần tử video');

            // Gán và phát
            video.srcObject = mediaStream;
            setStream(mediaStream);

            // Chờ metadata trước khi play
            await new Promise<void>((resolve) => {
                video.onloadedmetadata = async () => {
                    try {
                        await video.play();
                        console.log("🎥 Camera đã phát");
                        resolve();
                    } catch (err) {
                        console.error("Không thể play video:", err);
                        setQrError('Không thể khởi động camera (trình duyệt chặn phát video)');
                    }
                };
            });
        } catch (error: any) {
            console.error("🚫 Lỗi mở camera:", error);
            if (error.name === "NotAllowedError") {
                setQrError("Quyền camera bị từ chối. Hãy cấp lại quyền trong trình duyệt.");
            } else if (error.name === "NotFoundError") {
                setQrError("Không tìm thấy camera trên thiết bị.");
            } else {
                setQrError("Không thể mở camera. Vui lòng thử lại.");
            }
        }
    };




    const stopQRScanner = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    // [FIX 2 Applied]
    const handleQRScan = async () => {
        if (!videoRef.current || checkingIn) return;

        const video = videoRef.current;

        // Kiểm tra video đã sẵn sàng chưa
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
            const jsQR = (await import('jsqr')).default;
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert' // Tăng tốc độ quét
            });

            if (code && code.data) {
                console.log('QR detected:', code.data);
                await processQRData(code.data);
            }
        } catch (error) {
            console.error('Error scanning QR:', error);
        }
    };

    // [FIX 3 Applied]
    const processQRData = async (qrData: string) => {
        try {
            console.log('Processing QR data:', qrData);

            let checkInCode: string | null = null;

            // Try parse as JSON first
            try {
                const parsed = JSON.parse(qrData);
                if (parsed.type === 'event_checkin' && parsed.code) {
                    checkInCode = parsed.code;
                } else if (parsed.code) {
                    checkInCode = parsed.code;
                }
            } catch {
                // Nếu không phải JSON, coi như là mã check-in trực tiếp
                checkInCode = qrData.trim().toUpperCase();
            }

            if (checkInCode) {
                stopQRScanner();
                await submitCheckIn(checkInCode);
            } else {
                setQrError('QR code không hợp lệ');
                setTimeout(() => setQrError(null), 2000);
            }
        } catch (error) {
            console.error('Error processing QR:', error);
            setQrError('Không thể đọc QR code');
            setTimeout(() => setQrError(null), 2000);
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

    const canCheckIn = (event: Event | EventDetail) => {
        if (!event) return false;
        if (!event.is_registered || event.user_registration_status !== 'confirmed') return false;
        if (!event.check_in_enabled) return false;
        if (event.is_checked_in) return false;

        const now = new Date();
        const eventDate = new Date(event.event_date);

        const endDate = event.end_date
            ? new Date(event.end_date)
            : new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);

        return now >= eventDate && now <= endDate;
    };

    const canCancelRegistration = (event: Event | EventDetail) => {
        if (!event.is_registered) return false;
        if (event.user_registration_status !== 'pending' && event.user_registration_status !== 'confirmed') return false;

        const now = new Date();
        const eventDate = new Date(event.event_date);
        return now < eventDate;
    };

    const isAbsent = (event: Event | EventDetail) => {
        if (!event.is_registered) return false;
        if (event.user_registration_status !== 'confirmed') return false;
        if (event.is_checked_in) return false;

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
                                    const isPastEvent = isEventPast(event);
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

                                                {/* ✅ PRIORITY 1: Đã kết thúc - Hiển thị trước tiên nếu event đã past */}
                                                {isPastEvent && (
                                                    <div className="absolute top-3 right-3 px-3 py-1 bg-gray-900/90 backdrop-blur-sm text-white text-sm font-semibold rounded-lg shadow-lg">
                                                        Đã kết thúc
                                                    </div>
                                                )}

                                                {/* ✅ PRIORITY 2: Status badges - CHỈ HIỂN THỊ NẾU CHƯA KẾT THÚC */}
                                                {!isPastEvent && event.is_registered && event.user_registration_status && event.user_registration_status !== 'cancelled' && (
                                                    <div className="absolute top-3 right-3">
                                                        {getStatusBadge(event.user_registration_status)}
                                                    </div>
                                                )}

                                                {/* ✅ PRIORITY 3: Đã đầy - CHỈ HIỂN THỊ NẾU CHƯA KẾT THÚC VÀ CHƯA ĐĂNG KÝ */}
                                                {!isPastEvent && event.is_full && !event.is_registered && (
                                                    <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                                                        Đã đầy
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
                                                    {/* ✅ CASE 1: Đã đăng ký (confirmed/pending) và CHƯA kết thúc */}
                                                    {!isPastEvent && event.is_registered && event.user_registration_status !== 'cancelled' && event.user_registration_status !== 'rejected' ? (
                                                            <button
                                                                className="w-full px-4 py-2 bg-green-50 border-2 border-green-300 text-green-700 rounded-lg font-medium flex items-center justify-center gap-2"
                                                                disabled
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                Đã đăng ký
                                                            </button>
                                                        ) :
                                                        /* ✅ CASE 2: Có thể đăng ký và CHƯA kết thúc */
                                                        !isPastEvent && event.can_register ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openRegisterModal(event);
                                                                    }}
                                                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                                                >
                                                                    Đăng ký
                                                                </button>
                                                            ) :
                                                            /* ✅ CASE 3: Hết hạn đăng ký và CHƯA kết thúc */
                                                            !isPastEvent && isRegistrationDeadlinePassed(event) ? (
                                                                    <button
                                                                        className="w-full px-4 py-2 bg-gray-100 border border-gray-300 text-gray-600 rounded-lg font-medium flex items-center justify-center gap-2"
                                                                        disabled
                                                                    >
                                                                        <Clock className="w-4 h-4" />
                                                                        Đã hết hạn đăng ký
                                                                    </button>
                                                                ) :
                                                                /* ✅ CASE 4: Đã kết thúc */
                                                                isPastEvent ? (
                                                                    <button
                                                                        className="w-full px-4 py-2 bg-gray-100 border border-gray-300 text-gray-600 rounded-lg font-medium flex items-center justify-center gap-2"
                                                                        disabled
                                                                    >
                                                                        <Clock className="w-4 h-4" />
                                                                        Đã kết thúc
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
                                {/* [FIX 5 Applied] */}
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

                                    {/* Badge "Đã kết thúc" ở góc phải trên */}
                                    {isPast && (
                                        <div className="absolute top-4 right-4 px-4 py-2 bg-gray-900/90 backdrop-blur-sm text-white rounded-lg font-semibold shadow-lg">
                                            Đã kết thúc
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

                                    {/* [FIX 4 Applied] */}
                                    <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-3'} pt-6 border-t border-gray-200`}>
                                        {/* CASE 1: Chưa đăng ký & có thể đăng ký */}
                                        {!selectedEvent.is_registered && selectedEvent.can_register && !isPast && (
                                            <button
                                                onClick={() => openRegisterModal(selectedEvent)}
                                                className={`${isMobile ? 'col-span-2' : ''} px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium`}
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="text-sm sm:text-base">Đăng ký ngay</span>
                                            </button>
                                        )}

                                        {/* CASE 2: Đã đăng ký bị từ chối/hủy & có thể đăng ký lại */}
                                        {selectedEvent.is_registered && (selectedEvent.user_registration_status === 'cancelled' || selectedEvent.user_registration_status === 'rejected') && selectedEvent.can_register && !isPast && (
                                            <button
                                                onClick={() => openRegisterModal(selectedEvent)}
                                                className={`${isMobile ? 'col-span-2' : ''} px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium`}
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="text-sm sm:text-base">Đăng ký lại</span>
                                            </button>
                                        )}

                                        {/* CASE 3: Hủy đăng ký - CHỈ HIỂN THỊ NẾU CÒN CHO PHÉP HỦY */}
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

                                        {/* CASE 4: Check-in - CHỈ HIỂN THỊ NẾU CHƯA CHECK-IN VÀ ĐANG TRONG THỜI GIAN */}
                                        {canDoCheckIn && !selectedEvent.is_checked_in && (
                                            <>
                                                <button
                                                    onClick={openCheckInModal}
                                                    className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 font-medium"
                                                >
                                                    <LogIn className="w-5 h-5" />
                                                    <span className="text-sm sm:text-base">Nhập mã</span>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setShowQRScannerModal(true);
                                                        setTimeout(() => startQRScanner(), 300);
                                                    }}
                                                    className="px-4 py-3 bg-white border-2 border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 flex items-center justify-center gap-2 font-medium"
                                                >
                                                    <QrCode className="w-5 h-5" />
                                                    <span className="text-sm sm:text-base">Quét QR</span>
                                                </button>
                                            </>
                                        )}

                                        {/* CASE 5: Link bài viết */}
                                        {selectedEvent.post_id && (
                                            <button
                                                onClick={() => window.open(`/posts/${selectedEvent.post_id}`, '_blank')}
                                                className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                                <span className="text-sm sm:text-base">Bài viết</span>
                                            </button>
                                        )}

                                        {/* ===== STATUS DISPLAYS ===== */}

                                        {/* Đã check-in */}
                                        {selectedEvent.is_checked_in && (
                                            <div className={`${isMobile ? 'col-span-2' : ''} px-4 py-3 bg-green-50 border-2 border-green-300 rounded-lg flex items-center justify-center`}>
                                                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                                <span className="text-green-800 font-medium text-sm sm:text-base">Đã check-in</span>
                                            </div>
                                        )}

                                        {/* Vắng mặt - THAY THẾ "Đã đăng ký" khi event đã kết thúc */}
                                        {isAbsent(selectedEvent) && (
                                            <div className={`${isMobile ? 'col-span-2' : ''} px-4 py-3 bg-red-50 border-2 border-red-300 rounded-lg flex items-center justify-center`}>
                                                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                                                <span className="text-red-800 font-medium text-sm sm:text-base">Vắng mặt</span>
                                            </div>
                                        )}

                                        {/* Đã xác nhận - CHỈ HIỂN THỊ KHI CHƯA CÓ CHECK-IN, CHƯA VẮNG MẶT */}
                                        {selectedEvent.is_registered &&
                                            selectedEvent.user_registration_status === 'confirmed' &&
                                            !canDoCheckIn &&
                                            !selectedEvent.is_checked_in &&
                                            !isAbsent(selectedEvent) && (
                                                <div className={`${isMobile ? 'col-span-2' : ''} px-4 py-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center`}>
                                                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                                    <span className="text-green-800 font-medium text-sm sm:text-base">Đã đăng ký</span>
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

                                        {/* Sự kiện đã kết thúc - CHỈ HIỂN THỊ NẾU CHƯA ĐĂNG KÝ */}
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

                            {/* [FIX 8 Applied] */}
                            <div className="p-6">
                                {qrError ? (
                                    <div className="text-center py-8">
                                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                        <p className="text-red-600 mb-4 font-medium">{qrError}</p>
                                        <button
                                            onClick={() => {
                                                setQrError(null);
                                                startQRScanner();
                                            }}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
                                                muted
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Khung quét */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="relative w-2/3 h-2/3">
                                                    {/* 4 góc */}
                                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
                                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
                                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
                                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
                                                </div>
                                            </div>

                                            {/* Loading indicator khi đang xử lý */}
                                            {checkingIn && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-center space-y-2">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                <p className="text-sm text-gray-700 font-medium">
                                                    Đang quét tự động...
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Đưa QR code vào khung hình để check-in
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
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