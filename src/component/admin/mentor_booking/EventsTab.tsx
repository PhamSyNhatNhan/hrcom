// src/component/admin/mentor_booking/EventsTab.tsx
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
    Download,
    Users,
    UserCheck,
    Plus,
    Upload,
    FileText,
    Loader2,
    Eye,
    Key,
    QrCode,
    Copy,
    Check,
    ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import {
    Event,
    EventRegistration,
    EventFilters,
    PaginationState,
    CSVExportField,
    CSVExportOptions
} from '@/types/events_admin';

interface EventsTabProps {
    registrations: EventRegistration[];
    loading: boolean;
    filters: EventFilters;
    pagination: PaginationState;
    onFiltersChange: (filters: Partial<EventFilters>) => void;
    onPageChange: (page: number) => void;
    onRefresh: () => void;
    onShowNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

interface CheckInCode {
    id: string;
    code: string;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
    notes?: string;
    creator_name?: string;
    usage_count: number;
    created_at: string;
}

const DEFAULT_CSV_FIELDS: CSVExportField[] = [
    // Registration Information
    { key: 'id', label: 'Registration ID', enabled: false, category: 'registration' },
    { key: 'registered_at', label: 'Ngày đăng ký', enabled: true, category: 'registration' },
    { key: 'status', label: 'Trạng thái', enabled: true, category: 'registration' },
    { key: 'contact_email', label: 'Email liên hệ', enabled: true, category: 'registration' },
    { key: 'contact_phone', label: 'SĐT liên hệ', enabled: true, category: 'registration' },
    { key: 'admin_notes', label: 'Ghi chú admin', enabled: false, category: 'registration' },

    // User Information
    { key: 'user_id', label: 'User ID', enabled: false, category: 'user' },
    { key: 'user_name', label: 'Tên người đăng ký', enabled: true, category: 'user' },
    { key: 'user_phone', label: 'SĐT người đăng ký', enabled: false, category: 'user' },
    { key: 'user_gender', label: 'Giới tính', enabled: false, category: 'user' },
    { key: 'user_birthdate', label: 'Ngày sinh', enabled: false, category: 'user' },
    { key: 'user_university', label: 'Trường đại học', enabled: true, category: 'user' },
    { key: 'user_major', label: 'Ngành học', enabled: true, category: 'user' },

    // Attendance Information
    { key: 'is_attended', label: 'Đã check-in', enabled: true, category: 'attendance' },
    { key: 'check_in_time', label: 'Thời gian check-in', enabled: true, category: 'attendance' },
    { key: 'check_in_method', label: 'Phương thức check-in', enabled: false, category: 'attendance' },

    // Review Information
    { key: 'has_review', label: 'Có đánh giá', enabled: true, category: 'review' },
    { key: 'rating', label: 'Số sao', enabled: true, category: 'review' },
    { key: 'review_comment', label: 'Nhận xét', enabled: false, category: 'review' },
    { key: 'review_published', label: 'Đánh giá công khai', enabled: false, category: 'review' }
];

export const EventsTab: React.FC<EventsTabProps> = ({
                                                        registrations: _registrations,
                                                        loading: _loading,
                                                        filters: _filters,
                                                        pagination: _pagination,
                                                        onFiltersChange: _onFiltersChange,
                                                        onPageChange: _onPageChange,
                                                        onRefresh: _onRefresh,
                                                        onShowNotification
                                                    }) => {
    // View mode: 'list' for events list, 'detail' for event detail
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    // Events list states
    const [events, setEvents] = useState<Event[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [eventsFilters, setEventsFilters] = useState({
        searchTerm: '',
        publishedFilter: 'all',
        eventTypeFilter: 'all',
        dateFrom: '',
        dateTo: ''
    });
    const [eventsPagination, setEventsPagination] = useState<PaginationState>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        itemsPerPage: 20
    });

    // Event detail states
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [detailTab, setDetailTab] = useState<'participants' | 'reviews'>('participants');
    const [participants, setParticipants] = useState<EventRegistration[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [checkInCodes, setCheckInCodes] = useState<CheckInCode[]>([]);
    const [participantsLoading, setParticipantsLoading] = useState(false);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [participantsSearch, setParticipantsSearch] = useState('');
    const [participantsStatusFilter, setParticipantsStatusFilter] = useState('all');

    // Modal states
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const [editingRegistration, setEditingRegistration] = useState<EventRegistration | null>(null);
    const [editingReview, setEditingReview] = useState<any>(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [registrationFormData, setRegistrationFormData] = useState<Partial<EventRegistration>>({});
    const [reviewFormData, setReviewFormData] = useState<any>({});

    // Event management states
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [eventFormData, setEventFormData] = useState<Partial<Event>>({});
    const [uploading, setUploading] = useState(false);

    // Check-in code states
    const [showCheckInCodeModal, setShowCheckInCodeModal] = useState(false);
    const [checkInCodeFormData, setCheckInCodeFormData] = useState<any>({});
    const [showQRCodeModal, setShowQRCodeModal] = useState(false);
    const [selectedCheckInCode, setSelectedCheckInCode] = useState<CheckInCode | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // CSV Export states
    const [showCSVModal, setShowCSVModal] = useState(false);
    const [csvFields, setCsvFields] = useState<CSVExportField[]>(DEFAULT_CSV_FIELDS);
    const [csvOptions, setCsvOptions] = useState<CSVExportOptions>({
        exportAll: false,
        limit: 100,
        applyFilters: true
    });

    // Load events list
    useEffect(() => {
        if (viewMode === 'list') {
            loadEvents();
        }
    }, [viewMode, eventsPagination.currentPage, eventsFilters]);

    // Load event detail
    useEffect(() => {
        if (viewMode === 'detail' && selectedEventId) {
            loadEventDetail();
            loadCheckInCodes();
            if (detailTab === 'participants') {
                loadParticipants();
            } else {
                loadReviews();
            }
        }
    }, [viewMode, selectedEventId, detailTab, participantsSearch, participantsStatusFilter]);

    // Scroll lock effect for modals
    useEffect(() => {
        const isAnyModalOpen = showEditForm || showReviewForm || showCSVModal || showEventModal || showCheckInCodeModal || showQRCodeModal;

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
    }, [showEditForm, showReviewForm, showCSVModal, showEventModal, showCheckInCodeModal, showQRCodeModal]);

    const loadEvents = async () => {
        try {
            setEventsLoading(true);
            const { data, error } = await supabase.rpc('events_admin_get_events_list', {
                p_search_term: eventsFilters.searchTerm || null,
                p_published: eventsFilters.publishedFilter === 'all' ? null : eventsFilters.publishedFilter === 'published',
                p_event_type: eventsFilters.eventTypeFilter === 'all' ? null : eventsFilters.eventTypeFilter,
                p_date_from: eventsFilters.dateFrom ? new Date(eventsFilters.dateFrom).toISOString() : null,
                p_date_to: eventsFilters.dateTo ? new Date(eventsFilters.dateTo + 'T23:59:59').toISOString() : null,
                p_limit: eventsPagination.itemsPerPage,
                p_offset: (eventsPagination.currentPage - 1) * eventsPagination.itemsPerPage
            });

            if (error) throw error;

            setEvents(data?.events || []);
            setEventsPagination(prev => ({
                ...prev,
                totalCount: data?.total_count || 0,
                totalPages: Math.ceil((data?.total_count || 0) / prev.itemsPerPage)
            }));
        } catch (error) {
            console.error('Error loading events:', error);
            onShowNotification('error', 'Không thể tải danh sách sự kiện');
        } finally {
            setEventsLoading(false);
        }
    };

    const loadEventDetail = async () => {
        if (!selectedEventId) return;

        try {
            const { data, error } = await supabase.rpc('events_admin_get_event_detail', {
                p_event_id: selectedEventId
            });

            if (error) throw error;
            setSelectedEvent(data);
        } catch (error) {
            console.error('Error loading event detail:', error);
            onShowNotification('error', 'Không thể tải chi tiết sự kiện');
        }
    };

    const loadParticipants = async () => {
        if (!selectedEventId) return;

        try {
            setParticipantsLoading(true);
            const { data, error } = await supabase.rpc('events_admin_get_event_participants', {
                p_event_id: selectedEventId,
                p_search_term: participantsSearch || null,
                p_status: participantsStatusFilter === 'all' ? null : participantsStatusFilter,
                p_limit: 1000,
                p_offset: 0
            });

            if (error) throw error;
            setParticipants(data?.registrations || []);
        } catch (error) {
            console.error('Error loading participants:', error);
            onShowNotification('error', 'Không thể tải danh sách người tham dự');
        } finally {
            setParticipantsLoading(false);
        }
    };

    const loadReviews = async () => {
        if (!selectedEventId) return;

        try {
            setReviewsLoading(true);
            const { data, error } = await supabase.rpc('events_admin_get_event_reviews', {
                p_event_id: selectedEventId,
                p_limit: 1000,
                p_offset: 0
            });

            if (error) throw error;
            setReviews(data?.reviews || []);
        } catch (error) {
            console.error('Error loading reviews:', error);
            onShowNotification('error', 'Không thể tải danh sách đánh giá');
        } finally {
            setReviewsLoading(false);
        }
    };

    const loadCheckInCodes = async () => {
        if (!selectedEventId) return;

        try {
            const { data, error } = await supabase.rpc('events_admin_get_check_in_codes', {
                p_event_id: selectedEventId
            });

            if (error) throw error;
            setCheckInCodes(data || []);
        } catch (error) {
            console.error('Error loading check-in codes:', error);
        }
    };

    const openEventDetail = (eventId: string) => {
        setSelectedEventId(eventId);
        setViewMode('detail');
        setDetailTab('participants');
    };

    const backToEventsList = () => {
        setViewMode('list');
        setSelectedEventId(null);
        setSelectedEvent(null);
        setParticipants([]);
        setReviews([]);
        setCheckInCodes([]);
    };

    // Event Management Functions
    const uploadImage = async (file: File): Promise<string> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
            const filePath = `events/${fileName}`;

            const { data, error } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw new Error('Không thể upload ảnh');
        }
    };

    const handleImageUpload = async (file: File) => {
        try {
            setUploading(true);
            const imageUrl = await uploadImage(file);
            setEventFormData(prev => ({ ...prev, thumbnail: imageUrl }));
        } catch (error) {
            onShowNotification('error', 'Lỗi khi upload ảnh');
        } finally {
            setUploading(false);
        }
    };

    const openEventModal = (event?: Event) => {
        if (event) {
            setEditingEvent(event);
            setEventFormData({
                ...event,
                event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
                end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
                registration_deadline: event.registration_deadline ? new Date(event.registration_deadline).toISOString().slice(0, 16) : ''
            });
        } else {
            setEditingEvent(null);
            setEventFormData({
                published: false,
                require_approval: false,
                check_in_enabled: true,
                event_type: 'hybrid'
            });
        }
        setShowEventModal(true);
    };

    const saveEvent = async () => {
        try {
            setSubmitting(true);

            if (!eventFormData.title || !eventFormData.event_date) {
                onShowNotification('error', 'Vui lòng điền đầy đủ thông tin bắt buộc (Tiêu đề và Ngày sự kiện)');
                return;
            }

            if (editingEvent) {
                const { error } = await supabase.rpc('events_admin_update_event', {
                    p_event_id: editingEvent.id,
                    p_title: eventFormData.title,
                    p_description: eventFormData.description || null,
                    p_thumbnail: eventFormData.thumbnail || null,
                    p_event_date: eventFormData.event_date ? new Date(eventFormData.event_date).toISOString() : null,
                    p_end_date: eventFormData.end_date ? new Date(eventFormData.end_date).toISOString() : null,
                    p_location: eventFormData.location || null,
                    p_event_type: eventFormData.event_type || 'hybrid',
                    p_max_participants: eventFormData.max_participants || null,
                    p_registration_deadline: eventFormData.registration_deadline ? new Date(eventFormData.registration_deadline).toISOString() : null,
                    p_require_approval: eventFormData.require_approval ?? false,
                    p_check_in_enabled: eventFormData.check_in_enabled ?? true,
                    p_published: eventFormData.published ?? false,
                    p_post_id: eventFormData.post_id || null
                });

                if (error) throw error;
                onShowNotification('success', 'Cập nhật sự kiện thành công');
            } else {
                const { error } = await supabase.rpc('events_admin_create_event', {
                    p_title: eventFormData.title,
                    p_description: eventFormData.description || null,
                    p_thumbnail: eventFormData.thumbnail || null,
                    p_event_date: eventFormData.event_date ? new Date(eventFormData.event_date).toISOString() : null,
                    p_end_date: eventFormData.end_date ? new Date(eventFormData.end_date).toISOString() : null,
                    p_location: eventFormData.location || null,
                    p_event_type: eventFormData.event_type || 'hybrid',
                    p_max_participants: eventFormData.max_participants || null,
                    p_registration_deadline: eventFormData.registration_deadline ? new Date(eventFormData.registration_deadline).toISOString() : null,
                    p_require_approval: eventFormData.require_approval ?? false,
                    p_check_in_enabled: eventFormData.check_in_enabled ?? true,
                    p_published: eventFormData.published ?? false,
                    p_post_id: eventFormData.post_id || null
                });

                if (error) throw error;
                onShowNotification('success', 'Tạo sự kiện mới thành công');
            }

            setShowEventModal(false);
            setEditingEvent(null);
            setEventFormData({});

            if (viewMode === 'detail' && editingEvent) {
                loadEventDetail();
            } else {
                loadEvents();
            }
        } catch (error) {
            console.error('Error saving event:', error);
            onShowNotification('error', 'Lỗi khi lưu sự kiện');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteEvent = async (eventId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa sự kiện này? Tất cả đăng ký liên quan sẽ bị xóa.')) return;

        try {
            setSubmitting(true);
            const { error } = await supabase.rpc('events_admin_delete_event', {
                p_event_id: eventId
            });

            if (error) throw error;
            onShowNotification('success', 'Xóa sự kiện thành công');

            if (viewMode === 'detail' && selectedEventId === eventId) {
                backToEventsList();
            }
            loadEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            onShowNotification('error', 'Lỗi khi xóa sự kiện');
        } finally {
            setSubmitting(false);
        }
    };

    // Check-in Code Functions
    const openCheckInCodeModal = () => {
        const now = new Date();
        const validUntil = new Date(selectedEvent?.event_date || now);
        validUntil.setHours(validUntil.getHours() + 2);

        setCheckInCodeFormData({
            code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            valid_from: now.toISOString().slice(0, 16),
            valid_until: validUntil.toISOString().slice(0, 16),
            notes: ''
        });
        setShowCheckInCodeModal(true);
    };

    const generateNewCode = () => {
        setCheckInCodeFormData((prev: any) => ({
            ...prev,
            code: Math.random().toString(36).substring(2, 8).toUpperCase()
        }));
    };

    const saveCheckInCode = async () => {
        if (!selectedEventId) return;

        try {
            setSubmitting(true);
            const { error } = await supabase.rpc('events_admin_create_check_in_code', {
                p_event_id: selectedEventId,
                p_code: checkInCodeFormData.code,
                p_valid_from: new Date(checkInCodeFormData.valid_from).toISOString(),
                p_valid_until: new Date(checkInCodeFormData.valid_until).toISOString(),
                p_notes: checkInCodeFormData.notes || null
            });

            if (error) throw error;
            onShowNotification('success', 'Tạo mã check-in thành công');
            setShowCheckInCodeModal(false);
            loadCheckInCodes();
        } catch (error) {
            console.error('Error creating check-in code:', error);
            onShowNotification('error', 'Lỗi khi tạo mã check-in');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleCheckInCodeStatus = async (codeId: string, isActive: boolean) => {
        try {
            const { error } = await supabase.rpc('events_admin_update_check_in_code', {
                p_code_id: codeId,
                p_is_active: !isActive
            });

            if (error) throw error;
            onShowNotification('success', 'Cập nhật trạng thái mã thành công');
            loadCheckInCodes();
        } catch (error) {
            console.error('Error updating check-in code:', error);
            onShowNotification('error', 'Lỗi khi cập nhật mã');
        }
    };

    const deleteCheckInCode = async (codeId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa mã check-in này?')) return;

        try {
            const { error } = await supabase.rpc('events_admin_delete_check_in_code', {
                p_code_id: codeId
            });

            if (error) throw error;
            onShowNotification('success', 'Xóa mã check-in thành công');
            loadCheckInCodes();
        } catch (error) {
            console.error('Error deleting check-in code:', error);
            onShowNotification('error', 'Lỗi khi xóa mã');
        }
    };

    const showQRCode = (code: CheckInCode) => {
        setSelectedCheckInCode(code);
        setShowQRCodeModal(true);
    };

    const copyToClipboard = (text: string, codeId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(codeId);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Registration Management Functions
    const updateRegistrationStatus = async (registrationId: string, status: string, adminNotes?: string) => {
        try {
            setSubmitting(true);
            const { error } = await supabase.rpc('events_admin_update_status', {
                p_registration_id: registrationId,
                p_status: status,
                p_admin_notes: adminNotes
            });
            if (error) throw error;
            onShowNotification('success', 'Trạng thái đã được cập nhật');
            loadParticipants();
        } catch (error) {
            console.error('Error updating registration status:', error);
            onShowNotification('error', 'Lỗi khi cập nhật trạng thái');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteRegistration = async (registrationId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đăng ký này?')) return;
        try {
            setSubmitting(true);
            const { error } = await supabase.rpc('events_admin_delete', {
                p_registration_id: registrationId
            });
            if (error) throw error;
            onShowNotification('success', 'Đăng ký đã được xóa');
            loadParticipants();
        } catch (error) {
            console.error('Error deleting registration:', error);
            onShowNotification('error', 'Lỗi khi xóa đăng ký');
        } finally {
            setSubmitting(false);
        }
    };

    const editRegistration = (registration: EventRegistration) => {
        setEditingRegistration(registration);
        setRegistrationFormData(registration);
        setShowEditForm(true);
    };

    const saveRegistrationChanges = async () => {
        if (!editingRegistration || !registrationFormData) return;
        try {
            setSubmitting(true);
            const { error } = await supabase.rpc('events_admin_update', {
                p_registration_id: editingRegistration.id,
                p_status: registrationFormData.status,
                p_admin_notes: registrationFormData.admin_notes
            });
            if (error) throw error;
            onShowNotification('success', 'Đăng ký đã được cập nhật');
            setShowEditForm(false);
            setEditingRegistration(null);
            loadParticipants();
        } catch (error) {
            console.error('Error saving registration changes:', error);
            onShowNotification('error', 'Lỗi khi lưu thay đổi');
        } finally {
            setSubmitting(false);
        }
    };

    // Review Management Functions
    const editReview = (review: any) => {
        setEditingReview(review);
        setReviewFormData(review);
        setShowReviewForm(true);
    };

    const saveReviewChanges = async () => {
        if (!editingReview || !reviewFormData) return;
        try {
            setSubmitting(true);
            const { error } = await supabase.rpc('events_admin_update_review', {
                p_review_id: editingReview.id,
                p_rating: reviewFormData.rating,
                p_comment: reviewFormData.comment,
                p_is_published: reviewFormData.is_published
            });
            if (error) throw error;
            onShowNotification('success', 'Đánh giá đã được cập nhật');
            setShowReviewForm(false);
            setEditingReview(null);
            loadReviews();
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
            const { error } = await supabase.rpc('events_admin_delete_review', {
                p_review_id: reviewId
            });
            if (error) throw error;
            onShowNotification('success', 'Đánh giá đã được xóa');
            loadReviews();
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
            const { error } = await supabase.rpc('events_admin_update_review', {
                p_review_id: reviewId,
                p_is_published: !isPublished
            });
            if (error) throw error;
            onShowNotification('success', 'Trạng thái đánh giá đã được cập nhật');
            loadReviews();
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
        setEditingRegistration(null);
        setEditingReview(null);
        setRegistrationFormData({});
        setReviewFormData({});
    };

    // CSV Export Functions
    const getRegistrationValue = (registration: EventRegistration, key: string): string => {
        const profile = registration.profiles;
        const subProfile = profile?.sub_profiles;
        const universityMajor = subProfile?.university_majors;
        const attendance = registration.event_attendances?.[0];
        const review = registration.event_reviews?.[0];

        switch (key) {
            case 'id': return registration.id;
            case 'registered_at': return new Date(registration.registered_at).toLocaleString('vi-VN');
            case 'status': return registration.status;
            case 'contact_email': return registration.contact_email;
            case 'contact_phone': return registration.contact_phone || '';
            case 'admin_notes': return registration.admin_notes || '';

            case 'user_id': return registration.user_id;
            case 'user_name': return profile?.full_name || '';
            case 'user_phone': return profile?.phone_number || '';
            case 'user_gender': return profile?.gender || '';
            case 'user_birthdate':
                return profile?.birthdate ? new Date(profile.birthdate).toLocaleDateString('vi-VN') : '';
            case 'user_university': return universityMajor?.universities?.name || '';
            case 'user_major': return universityMajor?.majors?.name || '';

            case 'is_attended': return attendance ? 'Có' : 'Không';
            case 'check_in_time':
                return attendance?.checked_in_at ? new Date(attendance.checked_in_at).toLocaleString('vi-VN') : '';
            case 'check_in_method': return attendance?.check_in_method || '';

            case 'has_review': return review ? 'Có' : 'Không';
            case 'rating': return review?.rating?.toString() || '';
            case 'review_comment': return review?.comment || '';
            case 'review_published': return review?.is_published ? 'Công khai' : 'Riêng tư';

            default: return '';
        }
    };

    const exportToCSV = async () => {
        if (!selectedEventId) return;

        try {
            let dataToExport = participants;

            if (csvOptions.exportAll) {
                const { data, error } = await supabase.rpc('events_admin_get_event_participants', {
                    p_event_id: selectedEventId,
                    p_search_term: csvOptions.applyFilters && participantsSearch ? participantsSearch : null,
                    p_status: csvOptions.applyFilters && participantsStatusFilter !== 'all' ? participantsStatusFilter : null,
                    p_limit: csvOptions.limit || 10000,
                    p_offset: 0
                });
                if (error) throw error;
                dataToExport = data?.registrations || [];
            }

            const enabledFields = csvFields.filter(f => f.enabled);
            const headers = enabledFields.map(f => f.label);
            const rows = dataToExport.map(registration =>
                enabledFields.map(field => getRegistrationValue(registration, field.key))
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
            link.download = `${selectedEvent?.title || 'event'}_participants_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();

            onShowNotification('success', `Đã xuất ${dataToExport.length} người tham dự`);
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

    // Utility Functions
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'confirmed': return <CheckCircle className="w-4 h-4" />;
            case 'rejected': return <XCircle className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
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

    const getPageNumbers = (pagination: PaginationState) => {
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
            <>
                {/* Filters */}
                <div className="p-6 bg-white rounded-xl shadow-sm mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Quản lý Sự kiện</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Tổng số {eventsPagination.totalCount} sự kiện
                            </p>
                        </div>
                        <button
                            onClick={() => openEventModal()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Tạo sự kiện mới
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm sự kiện..."
                                value={eventsFilters.searchTerm}
                                onChange={(e) => setEventsFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <select
                            value={eventsFilters.publishedFilter}
                            onChange={(e) => setEventsFilters(prev => ({ ...prev, publishedFilter: e.target.value }))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="published">Đã xuất bản</option>
                            <option value="draft">Bản nháp</option>
                        </select>

                        <select
                            value={eventsFilters.eventTypeFilter}
                            onChange={(e) => setEventsFilters(prev => ({ ...prev, eventTypeFilter: e.target.value }))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả hình thức</option>
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                            <option value="hybrid">Hybrid</option>
                        </select>

                        <input
                            type="date"
                            value={eventsFilters.dateFrom}
                            onChange={(e) => setEventsFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Từ ngày"
                        />

                        <input
                            type="date"
                            value={eventsFilters.dateTo}
                            onChange={(e) => setEventsFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Đến ngày"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={() => setEventsFilters({
                                searchTerm: '',
                                publishedFilter: 'all',
                                eventTypeFilter: 'all',
                                dateFrom: '',
                                dateTo: ''
                            })}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>

                {/* Events List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {eventsLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Đang tải...</p>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="p-8 text-center">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Không có sự kiện nào
                            </h3>
                            <p className="text-gray-600">
                                Không tìm thấy sự kiện phù hợp với bộ lọc.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {events.map((event) => (
                                <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex gap-6">
                                        {/* Thumbnail */}
                                        <div className="flex-shrink-0">
                                            {event.thumbnail ? (
                                                <Image
                                                    src={event.thumbnail}
                                                    alt={event.title}
                                                    width={200}
                                                    height={120}
                                                    className="rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-[200px] h-[120px] bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <Calendar className="w-8 h-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Event Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                        {event.title}
                                                    </h3>
                                                    {event.description && (
                                                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        event.published
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {event.published ? 'Đã xuất bản' : 'Bản nháp'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span>{new Date(event.event_date).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    {getEventTypeIcon(event.event_type || '')}
                                                    <span>{getEventTypeLabel(event.event_type || '')}</span>
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MapPin className="w-4 h-4 text-gray-400" />
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span>{event.participant_count || 0} người đăng ký</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-sm text-gray-600">
                                                    <strong className="text-green-600">{event.confirmed_count || 0}</strong> đã xác nhận
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <strong className="text-blue-600">{event.checked_in_count || 0}</strong> đã check-in
                                                </div>
                                                {event.max_participants && (
                                                    <div className="text-sm text-gray-600">
                                                        Tối đa: <strong>{event.max_participants}</strong> người
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => openEventDetail(event.id)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Chi tiết
                                            </button>
                                            <button
                                                onClick={() => openEventModal(event)}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => deleteEvent(event.id)}
                                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2"
                                                disabled={submitting}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {eventsPagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-700">
                                    Trang {eventsPagination.currentPage} / {eventsPagination.totalPages} (Tổng {eventsPagination.totalCount} kết quả)
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setEventsPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                                        disabled={eventsPagination.currentPage === 1 || eventsLoading}
                                        className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                                            eventsPagination.currentPage === 1 || eventsLoading
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Trước
                                    </button>

                                    <div className="flex items-center space-x-1">
                                        {getPageNumbers(eventsPagination).map((pageNum, index) => (
                                            <React.Fragment key={index}>
                                                {pageNum === '...' ? (
                                                    <span className="px-3 py-2 text-gray-400">...</span>
                                                ) : (
                                                    <button
                                                        onClick={() => setEventsPagination(prev => ({ ...prev, currentPage: pageNum as number }))}
                                                        disabled={eventsLoading}
                                                        className={`px-3 py-2 rounded-lg transition-colors ${
                                                            eventsPagination.currentPage === pageNum
                                                                ? 'bg-blue-600 text-white'
                                                                : eventsLoading
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
                                        onClick={() => setEventsPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                                        disabled={eventsPagination.currentPage === eventsPagination.totalPages || eventsLoading}
                                        className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                                            eventsPagination.currentPage === eventsPagination.totalPages || eventsLoading
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

                {/* Event Create/Edit Modal - Same as before */}
                {showEventModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={() => {
                                if (!submitting && !uploading) {
                                    setShowEventModal(false);
                                    setEditingEvent(null);
                                    setEventFormData({});
                                }
                            }}
                        />

                        <div className="relative bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">
                                        {editingEvent ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            if (!submitting && !uploading) {
                                                setShowEventModal(false);
                                                setEditingEvent(null);
                                                setEventFormData({});
                                            }
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                        disabled={submitting || uploading}
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900">Thông tin cơ bản</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tiêu đề sự kiện *
                                        </label>
                                        <input
                                            type="text"
                                            value={eventFormData.title || ''}
                                            onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="VD: Workshop AI & Machine Learning"
                                            disabled={submitting || uploading}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mô tả
                                        </label>
                                        <textarea
                                            value={eventFormData.description || ''}
                                            onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Mô tả chi tiết về sự kiện..."
                                            disabled={submitting || uploading}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ảnh thumbnail
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) await handleImageUpload(file);
                                                }}
                                                className="hidden"
                                                id="event-thumbnail"
                                                disabled={uploading || submitting}
                                            />
                                            <label
                                                htmlFor="event-thumbnail"
                                                className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer ${
                                                    (uploading || submitting) ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                            >
                                                <Upload className="w-4 h-4" />
                                                {uploading ? 'Đang tải...' : 'Chọn ảnh'}
                                            </label>
                                            {eventFormData.thumbnail && (
                                                <div className="relative w-20 h-20">
                                                    <Image
                                                        src={eventFormData.thumbnail}
                                                        alt="Preview"
                                                        fill
                                                        className="object-cover rounded-lg"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Post ID (nếu có)
                                        </label>
                                        <input
                                            type="text"
                                            value={eventFormData.post_id || ''}
                                            onChange={(e) => setEventFormData(prev => ({ ...prev, post_id: e.target.value || undefined }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="UUID của bài post liên quan"
                                            disabled={submitting || uploading}
                                        />
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900">Thời gian</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ngày bắt đầu *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={eventFormData.event_date || ''}
                                                onChange={(e) => setEventFormData(prev => ({ ...prev, event_date: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                disabled={submitting || uploading}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ngày kết thúc
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={eventFormData.end_date || ''}
                                                onChange={(e) => setEventFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                disabled={submitting || uploading}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Hạn đăng ký
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={eventFormData.registration_deadline || ''}
                                                onChange={(e) => setEventFormData(prev => ({ ...prev, registration_deadline: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                disabled={submitting || uploading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Location & Type */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900">Địa điểm & Hình thức</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Địa điểm
                                            </label>
                                            <input
                                                type="text"
                                                value={eventFormData.location || ''}
                                                onChange={(e) => setEventFormData(prev => ({ ...prev, location: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="VD: Phòng 301, Tòa nhà A"
                                                disabled={submitting || uploading}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Hình thức
                                            </label>
                                            <select
                                                value={eventFormData.event_type || 'hybrid'}
                                                onChange={(e) => setEventFormData(prev => ({ ...prev, event_type: e.target.value as any }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                disabled={submitting || uploading}
                                            >
                                                <option value="online">Online</option>
                                                <option value="offline">Offline</option>
                                                <option value="hybrid">Hybrid</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Số người tối đa
                                            </label>
                                            <input
                                                type="number"
                                                value={eventFormData.max_participants || ''}
                                                onChange={(e) => setEventFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) || undefined }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Để trống nếu không giới hạn"
                                                min="1"
                                                disabled={submitting || uploading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Settings */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900">Cài đặt</h4>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="require_approval"
                                                checked={eventFormData.require_approval || false}
                                                onChange={(e) => setEventFormData(prev => ({ ...prev, require_approval: e.target.checked }))}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                disabled={submitting || uploading}
                                            />
                                            <label htmlFor="require_approval" className="text-sm text-gray-700">
                                                Yêu cầu phê duyệt đăng ký
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="check_in_enabled"
                                                checked={eventFormData.check_in_enabled ?? true}
                                                onChange={(e) => setEventFormData(prev => ({ ...prev, check_in_enabled: e.target.checked }))}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                disabled={submitting || uploading}
                                            />
                                            <label htmlFor="check_in_enabled" className="text-sm text-gray-700">
                                                Cho phép check-in
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="published"
                                                checked={eventFormData.published || false}
                                                onChange={(e) => setEventFormData(prev => ({ ...prev, published: e.target.checked }))}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                disabled={submitting || uploading}
                                            />
                                            <label htmlFor="published" className="text-sm text-gray-700">
                                                Xuất bản sự kiện
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (!submitting && !uploading) {
                                            setShowEventModal(false);
                                            setEditingEvent(null);
                                            setEventFormData({});
                                        }
                                    }}
                                    disabled={submitting || uploading}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={saveEvent}
                                    disabled={submitting || uploading || !eventFormData.title || !eventFormData.event_date}
                                    className="flex items-center gap-2"
                                >
                                    {(submitting || uploading) ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {uploading ? 'Đang tải ảnh...' : 'Đang lưu...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {editingEvent ? 'Cập nhật' : 'Tạo mới'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // RENDER - Event Detail View
    return (
        <>
            {/* Event Detail Header */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
                <div className="p-6 border-b border-gray-200">
                    <button
                        onClick={backToEventsList}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại danh sách
                    </button>

                    {selectedEvent && (
                        <div className="flex gap-6">
                            {/* Thumbnail */}
                            <div className="flex-shrink-0">
                                {selectedEvent.thumbnail ? (
                                    <Image
                                        src={selectedEvent.thumbnail}
                                        alt={selectedEvent.title}
                                        width={300}
                                        height={180}
                                        className="rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-[300px] h-[180px] bg-gray-200 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-12 h-12 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            {/* Event Info */}
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                            {selectedEvent.title}
                                        </h2>
                                        {selectedEvent.description && (
                                            <p className="text-gray-600 mb-4">
                                                {selectedEvent.description}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        selectedEvent.published
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {selectedEvent.published ? 'Đã xuất bản' : 'Bản nháp'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Ngày sự kiện</div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium">
                                                {new Date(selectedEvent.event_date).toLocaleString('vi-VN')}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedEvent.end_date && (
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Kết thúc</div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium">
                                                    {new Date(selectedEvent.end_date).toLocaleString('vi-VN')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Hình thức</div>
                                        <div className="flex items-center gap-2">
                                            {getEventTypeIcon(selectedEvent.event_type || '')}
                                            <span className="font-medium">{getEventTypeLabel(selectedEvent.event_type || '')}</span>
                                        </div>
                                    </div>
                                    {selectedEvent.location && (
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Địa điểm</div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium">{selectedEvent.location}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">Người tham gia</div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium">
                                                {selectedEvent.participant_count || 0}
                                                {selectedEvent.max_participants && ` / ${selectedEvent.max_participants}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => deleteEvent(selectedEvent.id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                        disabled={submitting}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Xóa sự kiện
                                    </button>
                                    <button
                                        onClick={openCheckInCodeModal}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                                    >
                                        <Key className="w-4 h-4" />
                                        Tạo mã check-in
                                    </button>
                                    <button
                                        onClick={() => setShowCSVModal(true)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                        disabled={participants.length === 0}
                                    >
                                        <Download className="w-4 h-4" />
                                        Xuất CSV
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Check-in Codes Section */}
                {checkInCodes.length > 0 && (
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-3">Mã check-in ({checkInCodes.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {checkInCodes.map((code) => (
                                <div key={code.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <code className="px-3 py-1 bg-gray-100 rounded font-mono text-lg font-bold">
                                                {code.code}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(code.code, code.id)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                {copiedCode === code.id ? (
                                                    <Check className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            code.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {code.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-1 mb-3">
                                        <div>Hiệu lực: {new Date(code.valid_from).toLocaleString('vi-VN')}</div>
                                        <div>Hết hạn: {new Date(code.valid_until).toLocaleString('vi-VN')}</div>
                                        <div>Đã sử dụng: {code.usage_count} lần</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => showQRCode(code)}
                                            className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm flex items-center justify-center gap-1"
                                        >
                                            <QrCode className="w-3 h-3" />
                                            QR
                                        </button>
                                        <button
                                            onClick={() => toggleCheckInCodeStatus(code.id, code.is_active)}
                                            className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                                        >
                                            {code.is_active ? 'Tắt' : 'Bật'}
                                        </button>
                                        <button
                                            onClick={() => deleteCheckInCode(code.id)}
                                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="flex">
                        <button
                            onClick={() => setDetailTab('participants')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                detailTab === 'participants'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Người tham dự ({participants.length})
                            </div>
                        </button>

                        <button
                            onClick={() => setDetailTab('reviews')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                detailTab === 'reviews'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4" />
                                Đánh giá ({reviews.length})
                            </div>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            {detailTab === 'participants' ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Participants Filters */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm người tham dự..."
                                    value={participantsSearch}
                                    onChange={(e) => setParticipantsSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <select
                                value={participantsStatusFilter}
                                onChange={(e) => setParticipantsStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="pending">Chờ duyệt</option>
                                <option value="confirmed">Đã xác nhận</option>
                                <option value="rejected">Đã từ chối</option>
                                <option value="cancelled">Đã hủy</option>
                            </select>
                        </div>
                    </div>

                    {/* Participants List */}
                    {participantsLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Đang tải...</p>
                        </div>
                    ) : participants.length === 0 ? (
                        <div className="p-8 text-center">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Chưa có người đăng ký
                            </h3>
                            <p className="text-gray-600">
                                Chưa có ai đăng ký tham gia sự kiện này.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {participants.map((registration) => (
                                <div key={registration.id} className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="flex items-center gap-3">
                                                    {registration.profiles?.image_url ? (
                                                        <Image
                                                            src={registration.profiles.image_url}
                                                            alt={registration.profiles.full_name}
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
                                                            {registration.profiles?.full_name || 'Người dùng ẩn danh'}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            {registration.profiles?.sub_profiles?.university_majors?.universities?.name || ''}
                                                            {registration.profiles?.sub_profiles?.university_majors?.universities?.name &&
                                                                registration.profiles?.sub_profiles?.university_majors?.majors?.name && ' - '}
                                                            {registration.profiles?.sub_profiles?.university_majors?.majors?.name || ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(registration.status)}`}>
                                                    {getStatusIcon(registration.status)}
                                                    {registration.status === 'pending' && 'Chờ duyệt'}
                                                    {registration.status === 'confirmed' && 'Đã xác nhận'}
                                                    {registration.status === 'rejected' && 'Đã từ chối'}
                                                    {registration.status === 'cancelled' && 'Đã hủy'}
                                                </span>
                                                {registration.event_attendances && registration.event_attendances.length > 0 && (
                                                    <span className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 bg-purple-100 text-purple-800">
                                                        <UserCheck className="w-4 h-4" />
                                                        Đã check-in
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span className="truncate">{registration.contact_email}</span>
                                                </div>
                                                {registration.contact_phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        <span>{registration.contact_phone}</span>
                                                    </div>
                                                )}
                                                <div className="text-sm">
                                                    <strong>Đăng ký:</strong> {new Date(registration.registered_at).toLocaleString('vi-VN')}
                                                </div>
                                            </div>

                                            {registration.admin_notes && (
                                                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-2">
                                                    <strong>Ghi chú admin:</strong> {registration.admin_notes}
                                                </div>
                                            )}

                                            {/* Attendance Info */}
                                            {registration.event_attendances && registration.event_attendances.length > 0 && (
                                                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <UserCheck className="w-4 h-4 text-purple-600" />
                                                        <strong className="text-sm text-purple-800">Thông tin check-in</strong>
                                                    </div>
                                                    <div className="text-sm text-gray-700 space-y-1">
                                                        <div>
                                                            <strong>Thời gian:</strong> {new Date(registration.event_attendances[0].checked_in_at).toLocaleString('vi-VN')}
                                                        </div>
                                                        <div>
                                                            <strong>Phương thức:</strong> {
                                                            registration.event_attendances[0].check_in_method === 'pass_code' ? 'Mã check-in' :
                                                                registration.event_attendances[0].check_in_method === 'manual' ? 'Thủ công' : 'QR Code'
                                                        }
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Review Section */}
                                            {registration.event_reviews && registration.event_reviews.length > 0 && (
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
                                                                        star <= registration.event_reviews![0].rating
                                                                            ? 'text-yellow-400 fill-current'
                                                                            : 'text-gray-300'
                                                                    }`}
                                                                />
                                                            ))}
                                                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                                                registration.event_reviews[0].is_published
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {registration.event_reviews[0].is_published ? 'Công khai' : 'Riêng tư'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {registration.event_reviews[0].comment && (
                                                        <p className="text-sm text-gray-700 mb-2">
                                                            {registration.event_reviews[0].comment}
                                                        </p>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => editReview(registration.event_reviews![0])}
                                                            className="text-xs text-blue-600 hover:text-blue-800"
                                                            disabled={submitting}
                                                        >
                                                            Chỉnh sửa
                                                        </button>
                                                        <button
                                                            onClick={() => toggleReviewPublished(registration.event_reviews![0].id, registration.event_reviews![0].is_published)}
                                                            className="text-xs text-green-600 hover:text-green-800"
                                                            disabled={submitting}
                                                        >
                                                            {registration.event_reviews[0].is_published ? 'Ẩn' : 'Công khai'}
                                                        </button>
                                                        <button
                                                            onClick={() => deleteReview(registration.event_reviews![0].id)}
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
                                                    expandedItem === registration.id ? null : registration.id
                                                )}
                                                className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50"
                                                title="Xem chi tiết"
                                            >
                                                {expandedItem === registration.id ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => editRegistration(registration)}
                                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                                                title="Chỉnh sửa"
                                                disabled={submitting}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => deleteRegistration(registration.id)}
                                                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                                                title="Xóa"
                                                disabled={submitting}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Status Actions */}
                                    {expandedItem === registration.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex flex-wrap gap-2">
                                                {registration.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateRegistrationStatus(registration.id, 'confirmed')}
                                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                                            disabled={submitting}
                                                        >
                                                            Xác nhận
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt('Lý do từ chối:');
                                                                if (reason !== null) {
                                                                    updateRegistrationStatus(registration.id, 'rejected', reason);
                                                                }
                                                            }}
                                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                                                            disabled={submitting}
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </>
                                                )}

                                                {(registration.status === 'confirmed' || registration.status === 'pending') && (
                                                    <button
                                                        onClick={() => {
                                                            const reason = prompt('Lý do hủy:');
                                                            if (reason !== null) {
                                                                updateRegistrationStatus(registration.id, 'cancelled', reason);
                                                            }
                                                        }}
                                                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                                                        disabled={submitting}
                                                    >
                                                        Hủy đăng ký
                                                    </button>
                                                )}

                                                {(registration.status === 'cancelled' || registration.status === 'rejected') && (
                                                    <button
                                                        onClick={() => updateRegistrationStatus(registration.id, 'pending')}
                                                        className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                                                        disabled={submitting}
                                                    >
                                                        Đặt lại chờ duyệt
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Reviews List */}
                    {reviewsLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Đang tải...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="p-8 text-center">
                            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Chưa có đánh giá
                            </h3>
                            <p className="text-gray-600">
                                Chưa có đánh giá nào cho sự kiện này.
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
                                                    {review.user?.image_url ? (
                                                        <Image
                                                            src={review.user.image_url}
                                                            alt={review.user.full_name}
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
                                                            {review.user?.full_name || 'Người dùng ẩn danh'}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            {review.registration?.contact_email || ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`w-5 h-5 ${
                                                                star <= review.rating
                                                                    ? 'text-yellow-400 fill-current'
                                                                    : 'text-gray-300'
                                                            }`}
                                                        />
                                                    ))}
                                                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                                        review.is_published
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {review.is_published ? 'Công khai' : 'Riêng tư'}
                                                    </span>
                                                </div>
                                            </div>

                                            {review.comment && (
                                                <p className="text-gray-700 mb-3 bg-gray-50 p-4 rounded-lg">
                                                    {review.comment}
                                                </p>
                                            )}

                                            <div className="text-sm text-gray-500">
                                                Đánh giá vào: {new Date(review.created_at).toLocaleString('vi-VN')}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => editReview(review)}
                                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                                                title="Chỉnh sửa"
                                                disabled={submitting}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => toggleReviewPublished(review.id, review.is_published)}
                                                className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50"
                                                title={review.is_published ? 'Ẩn' : 'Công khai'}
                                                disabled={submitting}
                                            >
                                                {review.is_published ? (
                                                    <XCircle className="w-4 h-4" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Check-in Code Modal */}
            {showCheckInCodeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                        onClick={() => !submitting && setShowCheckInCodeModal(false)}
                    />

                    <div className="relative bg-white rounded-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">Tạo mã check-in</h3>
                                <button
                                    onClick={() => !submitting && setShowCheckInCodeModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                    disabled={submitting}
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mã check-in
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={checkInCodeFormData.code || ''}
                                        onChange={(e) => setCheckInCodeFormData(prev => ({ ...prev, code: e.target.value }))}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-lg font-bold"
                                        disabled={submitting}
                                    />
                                    <button
                                        onClick={generateNewCode}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                        disabled={submitting}
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Hiệu lực từ
                                </label>
                                <input
                                    type="datetime-local"
                                    value={checkInCodeFormData.valid_from || ''}
                                    onChange={(e) => setCheckInCodeFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    disabled={submitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Hiệu lực đến
                                </label>
                                <input
                                    type="datetime-local"
                                    value={checkInCodeFormData.valid_until || ''}
                                    onChange={(e) => setCheckInCodeFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    disabled={submitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi chú
                                </label>
                                <textarea
                                    value={checkInCodeFormData.notes || ''}
                                    onChange={(e) => setCheckInCodeFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ghi chú về mã này..."
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => !submitting && setShowCheckInCodeModal(false)}
                                disabled={submitting}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={saveCheckInCode}
                                disabled={submitting || !checkInCodeFormData.code}
                                className="flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Tạo mã
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRCodeModal && selectedCheckInCode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                        onClick={() => setShowQRCodeModal(false)}
                    />

                    <div className="relative bg-white rounded-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">QR Code Check-in</h3>
                                <button
                                    onClick={() => setShowQRCodeModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 text-center space-y-4">
                            {/* QR Code thật */}
                            <div className="qr-code-container bg-white p-4 rounded-lg inline-block border-4 border-gray-200 shadow-lg">
                                <QRCodeSVG
                                    value={JSON.stringify({
                                        type: 'event_checkin',
                                        event_id: selectedEventId,
                                        code: selectedCheckInCode.code,
                                        valid_until: selectedCheckInCode.valid_until
                                    })}
                                    size={256}
                                    level="H"
                                    includeMargin={true}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                />
                            </div>

                            <div>
                                <div className="text-sm text-gray-600 mb-2">Mã check-in:</div>
                                <div className="flex items-center justify-center gap-2">
                                    <code className="px-4 py-2 bg-gray-100 rounded font-mono text-2xl font-bold">
                                        {selectedCheckInCode.code}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(selectedCheckInCode.code, selectedCheckInCode.id)}
                                        className="p-2 text-gray-400 hover:text-gray-600"
                                    >
                                        {copiedCode === selectedCheckInCode.id ? (
                                            <Check className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <Copy className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="text-sm text-gray-600 space-y-1 bg-gray-50 p-4 rounded-lg">
                                <div><strong>Sự kiện:</strong> {selectedEvent?.title}</div>
                                <div><strong>Hiệu lực:</strong> {new Date(selectedCheckInCode.valid_from).toLocaleString('vi-VN')}</div>
                                <div><strong>Hết hạn:</strong> {new Date(selectedCheckInCode.valid_until).toLocaleString('vi-VN')}</div>
                                <div><strong>Đã sử dụng:</strong> {selectedCheckInCode.usage_count} lần</div>
                            </div>

                            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                                💡 Người tham dự có thể quét mã QR này hoặc nhập mã "{selectedCheckInCode.code}" để check-in
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV Export Modal - Same as before with proper event context */}
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
                                    <h3 className="text-xl font-bold">Xuất danh sách người tham dự</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Sự kiện: {selectedEvent?.title}
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
                                            Xuất chỉ các người tham dự phù hợp với bộ lọc đang áp dụng
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
                                            Xuất tất cả người tham dự (không chỉ hiển thị hiện tại)
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
                                            Tối đa: 10,000 người
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

                                {/* Registration Fields */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-gray-800">📝 Thông tin Đăng ký</h5>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => selectFieldsByCategory('registration')}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Chọn tất cả
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                onClick={() => deselectFieldsByCategory('registration')}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Bỏ chọn
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {csvFields.filter(f => f.category === 'registration').map((field) => (
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

                                {/* Attendance Fields */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-gray-800">✅ Thông tin Check-in</h5>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => selectFieldsByCategory('attendance')}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Chọn tất cả
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                onClick={() => deselectFieldsByCategory('attendance')}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Bỏ chọn
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {csvFields.filter(f => f.category === 'attendance').map((field) => (
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
                                        <span className="mr-3">📝 Đăng ký: {csvFields.filter(f => f.category === 'registration' && f.enabled).length}</span>
                                        <span className="mr-3">👤 User: {csvFields.filter(f => f.category === 'user' && f.enabled).length}</span>
                                        <span className="mr-3">✅ Check-in: {csvFields.filter(f => f.category === 'attendance' && f.enabled).length}</span>
                                        <span>⭐ Đánh giá: {csvFields.filter(f => f.category === 'review' && f.enabled).length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>
                                        • Sẽ xuất: <strong>
                                        {csvOptions.exportAll
                                            ? `${Math.min(csvOptions.limit || 100, participants.length)} người tham dự`
                                            : `${participants.length} người tham dự (hiển thị hiện tại)`}
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

            {/* Edit Registration Modal */}
            {showEditForm && editingRegistration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                        onClick={cancelEdit}
                    />

                    <div className="relative bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">Chỉnh sửa đăng ký</h3>
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
                                        <strong>Người đăng ký:</strong> {editingRegistration.profiles?.full_name}
                                    </div>
                                    <div>
                                        <strong>Email:</strong> {editingRegistration.contact_email}
                                    </div>
                                    <div>
                                        <strong>Sự kiện:</strong> {selectedEvent?.title}
                                    </div>
                                    <div>
                                        <strong>Ngày đăng ký:</strong> {new Date(editingRegistration.registered_at).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                            </div>

                            {/* Editable Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Trạng thái *
                                    </label>
                                    <select
                                        value={registrationFormData.status || ''}
                                        onChange={(e) => setRegistrationFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        disabled={submitting}
                                    >
                                        <option value="pending">Chờ duyệt</option>
                                        <option value="confirmed">Đã xác nhận</option>
                                        <option value="rejected">Đã từ chối</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ghi chú admin
                                    </label>
                                    <textarea
                                        value={registrationFormData.admin_notes || ''}
                                        onChange={(e) => setRegistrationFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập ghi chú admin..."
                                        disabled={submitting}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                            <Button
                                variant="outline"
                                onClick={cancelEdit}
                                disabled={submitting}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={saveRegistrationChanges}
                                disabled={submitting}
                                className="flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
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
                                        <strong>Người đánh giá:</strong> {editingReview.user?.full_name}
                                    </div>
                                    <div>
                                        <strong>Sự kiện:</strong> {selectedEvent?.title}
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
                                        <Loader2 className="w-4 h-4 animate-spin" />
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