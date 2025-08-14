'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { SectionHeader } from '@/component/SectionHeader';
import { Button } from '@/component/Button';
import { supabase } from '@/utils/supabase/client';
import {
    Calendar,
    Clock,
    Users,
    BookOpen,
    Save,
    Send,
    Edit,
    X,
    Plus,
    Minus,
    Search,
    User,
    Building,
    Phone,
    Mail,
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Trash2
} from 'lucide-react';
import Image from 'next/image';

// Interfaces
interface Mentor {
    id: string;
    full_name: string;
    headline?: string;
    avatar?: string;
    skill?: string[];
}

interface MentorBooking {
    id?: string;
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
    created_at?: string;
    updated_at?: string;
}

// Separate component that uses useSearchParams
const MentorBookingContent = () => {
    const { user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    // States
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [bookings, setBookings] = useState<MentorBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingBooking, setEditingBooking] = useState<MentorBooking | null>(null);
    const [searchMentor, setSearchMentor] = useState('');
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
    } | null>(null);

    // Form state
    const [formData, setFormData] = useState<MentorBooking>({
        user_id: user?.id || '',
        organization_name: '',
        contact_email: user?.email || '',
        contact_phone: '',
        desired_mentor_ids: [],
        requested_date: '',
        scheduled_date: '',
        duration: 120,
        session_type: 'online',
        registered_count: 1,
        actual_count: 0,
        required_skills: [],
        published: false,
        status: 'pending',
        is_completed: false,
        notes: ''
    });

    // Skill input
    const [skillInput, setSkillInput] = useState('');

    // Mentor pagination
    const [mentorPage, setMentorPage] = useState(1);
    const MENTORS_PER_PAGE = 6;

    // Load data
    useEffect(() => {
        if (user) {
            loadMentors();
            loadUserBookings();

            // If editing, load the booking
            if (editId) {
                loadBookingForEdit(editId);
            }
        }
    }, [user, editId]);

    // Load mentors
    const loadMentors = async () => {
        try {
            const { data, error } = await supabase
                .from('mentors')
                .select('id, full_name, headline, avatar, skill')
                .eq('published', true)
                .order('full_name');

            if (error) throw error;
            setMentors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading mentors:', error);
            showNotification('error', 'Không thể tải danh sách mentor');
            setMentors([]); // Set empty array on error
        }
    };

    // Load user bookings
    const loadUserBookings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('mentor_bookings')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBookings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading bookings:', error);
            showNotification('error', 'Không thể tải danh sách đặt lịch');
            setBookings([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    // Load booking for edit
    const loadBookingForEdit = async (bookingId: string) => {
        try {
            const { data, error } = await supabase
                .from('mentor_bookings')
                .select('*')
                .eq('id', bookingId)
                .eq('user_id', user?.id)
                .single();

            if (error) throw error;

            if (data) {
                setEditingBooking(data);
                setFormData({
                    ...data,
                    requested_date: data.requested_date ?
                        new Date(data.requested_date).toISOString().slice(0, 16) : ''
                });
                setSkillInput(data.required_skills?.join(', ') || '');
                setShowForm(true);
            }
        } catch (error) {
            console.error('Error loading booking for edit:', error);
            showNotification('error', 'Không thể tải thông tin đặt lịch');
        }
    };

    // Show notification
    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // Handle form input changes
    const handleInputChange = (field: keyof MentorBooking, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handle mentor selection
    const toggleMentorSelection = (mentorId: string) => {
        setFormData(prev => ({
            ...prev,
            desired_mentor_ids: prev.desired_mentor_ids.includes(mentorId)
                ? prev.desired_mentor_ids.filter(id => id !== mentorId)
                : [...prev.desired_mentor_ids, mentorId]
        }));
    };

    // Handle skills
    const handleSkillsChange = () => {
        const skills = skillInput
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        setFormData(prev => ({ ...prev, required_skills: skills }));
    };

    // Validate form
    const validateForm = () => {
        if (!formData.organization_name.trim()) {
            showNotification('error', 'Vui lòng nhập tên tổ chức/cá nhân');
            return false;
        }
        if (!formData.contact_email.trim()) {
            showNotification('error', 'Vui lòng nhập email liên hệ');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
            showNotification('error', 'Email không hợp lệ');
            return false;
        }
        if (formData.desired_mentor_ids.length === 0) {
            showNotification('error', 'Vui lòng chọn ít nhất một mentor');
            return false;
        }
        if (formData.registered_count < 1) {
            showNotification('error', 'Số lượng đăng ký phải lớn hơn 0');
            return false;
        }
        if (formData.duration < 30 || formData.duration > 480) {
            showNotification('error', 'Thời lượng phải từ 30 đến 480 phút');
            return false;
        }
        return true;
    };

    // Save as draft
    const saveDraft = async () => {
        if (!validateForm()) return;

        try {
            setSubmitting(true);

            const bookingData = {
                ...formData,
                user_id: user?.id,
                published: false,
                status: 'pending',
                requested_date: formData.requested_date ?
                    new Date(formData.requested_date).toISOString() : null,
                scheduled_date: formData.scheduled_date ?
                    new Date(formData.scheduled_date).toISOString() : null
            };

            if (editingBooking) {
                const { error } = await supabase
                    .from('mentor_bookings')
                    .update(bookingData)
                    .eq('id', editingBooking.id)
                    .eq('user_id', user?.id);

                if (error) throw error;
                showNotification('success', 'Đã lưu bản nháp thành công');
            } else {
                const { error } = await supabase
                    .from('mentor_bookings')
                    .insert([bookingData]);

                if (error) throw error;
                showNotification('success', 'Đã tạo bản nháp thành công');
            }

            await loadUserBookings();
            resetForm();
        } catch (error) {
            console.error('Error saving draft:', error);
            showNotification('error', 'Lỗi khi lưu bản nháp');
        } finally {
            setSubmitting(false);
        }
    };

    // Submit booking
    const submitBooking = async () => {
        if (!validateForm()) return;

        try {
            setSubmitting(true);

            const bookingData = {
                ...formData,
                user_id: user?.id,
                published: true,
                status: 'pending',
                requested_date: formData.requested_date ?
                    new Date(formData.requested_date).toISOString() : null,
                scheduled_date: formData.scheduled_date ?
                    new Date(formData.scheduled_date).toISOString() : null
            };

            if (editingBooking) {
                const { error } = await supabase
                    .from('mentor_bookings')
                    .update(bookingData)
                    .eq('id', editingBooking.id)
                    .eq('user_id', user?.id);

                if (error) throw error;
                showNotification('success', 'Đã cập nhật và gửi đặt lịch thành công');
            } else {
                const { error } = await supabase
                    .from('mentor_bookings')
                    .insert([bookingData]);

                if (error) throw error;
                showNotification('success', 'Đã gửi đặt lịch thành công');
            }

            await loadUserBookings();
            resetForm();
        } catch (error) {
            console.error('Error submitting booking:', error);
            showNotification('error', 'Lỗi khi gửi đặt lịch');
        } finally {
            setSubmitting(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setShowForm(false);
        setEditingBooking(null);
        setFormData({
            user_id: user?.id || '',
            organization_name: '',
            contact_email: user?.email || '',
            contact_phone: '',
            desired_mentor_ids: [],
            requested_date: '',
            scheduled_date: '',
            duration: 120,
            session_type: 'online',
            registered_count: 1,
            actual_count: 0,
            required_skills: [],
            published: false,
            status: 'pending',
            is_completed: false,
            notes: ''
        });
        setSkillInput('');

        // Remove edit param from URL
        if (editId) {
            router.replace('/mentor_booking');
        }
    };

    // Edit booking
    const editBooking = (booking: MentorBooking) => {
        // Check if can edit
        if (booking.published && !['pending', 'cancelled', 'rejected'].includes(booking.status)) {
            showNotification('warning', 'Không thể chỉnh sửa đặt lịch ở trạng thái này');
            return;
        }

        setEditingBooking(booking);
        setFormData({
            ...booking,
            requested_date: booking.requested_date ?
                new Date(booking.requested_date).toISOString().slice(0, 16) : '',
            scheduled_date: booking.scheduled_date ?
                new Date(booking.scheduled_date).toISOString().slice(0, 16) : ''
        });
        setSkillInput(booking.required_skills?.join(', ') || '');
        setShowForm(true);
    };

    // Check if booking can be deleted
    const canDeleteBooking = (booking: MentorBooking) => {
        // Can delete if not published
        if (!booking.published) return true;

        // Can delete if published but status is pending, cancelled, or rejected
        if (booking.published && ['pending', 'cancelled', 'rejected'].includes(booking.status)) {
            return true;
        }

        return false;
    };

    // Delete booking
    const deleteBooking = async (booking: MentorBooking) => {
        if (!canDeleteBooking(booking)) {
            showNotification('warning', 'Không thể xóa đặt lịch ở trạng thái này');
            return;
        }

        if (!confirm('Bạn có chắc chắn muốn xóa đặt lịch này?')) return;

        try {
            const { error } = await supabase
                .from('mentor_bookings')
                .delete()
                .eq('id', booking.id!)
                .eq('user_id', user?.id);

            if (error) throw error;

            showNotification('success', 'Đã xóa đặt lịch thành công');
            await loadUserBookings();
        } catch (error) {
            console.error('Error deleting booking:', error);
            showNotification('error', 'Lỗi khi xóa đặt lịch');
        }
    };

    // Filter mentors
    const filteredMentors = mentors.filter(mentor =>
        mentor.full_name.toLowerCase().includes(searchMentor.toLowerCase()) ||
        mentor.headline?.toLowerCase().includes(searchMentor.toLowerCase()) ||
        mentor.skill?.some(skill => skill.toLowerCase().includes(searchMentor.toLowerCase()))
    );

    // Paginate mentors
    const totalMentorPages = Math.ceil(filteredMentors.length / MENTORS_PER_PAGE);
    const startIndex = (mentorPage - 1) * MENTORS_PER_PAGE;
    const paginatedMentors = filteredMentors.slice(startIndex, startIndex + MENTORS_PER_PAGE);

    // Reset page when search changes
    useEffect(() => {
        setMentorPage(1);
    }, [searchMentor]);

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

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Vui lòng đăng nhập</h2>
                    <p className="text-gray-600">Bạn cần đăng nhập để sử dụng tính năng đặt lịch mentor.</p>
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
                    title="ĐẶT LỊCH MENTOR"
                    subtitle="Đăng ký lịch tư vấn với các mentor chuyên nghiệp của HR Companion"
                />

                {/* Action Buttons */}
                <div className="mb-6 sm:mb-8">
                    {/* Mobile: Stack vertically with full-width button */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 order-2 sm:order-1">
                            Danh sách đặt lịch của bạn
                        </h3>
                        <Button
                            onClick={() => setShowForm(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 order-1 sm:order-2 min-h-[44px] px-4 py-3 text-base font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Đặt lịch mới</span>
                            <span className="sm:hidden">Tạo đặt lịch mới</span>
                        </Button>
                    </div>
                </div>

                {/* Bookings List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Đang tải...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="p-8 text-center">
                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Chưa có đặt lịch nào
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Bạn chưa có lịch đặt mentor nào. Hãy tạo đặt lịch đầu tiên!
                            </p>
                            <Button onClick={() => setShowForm(true)}>
                                Đặt lịch ngay
                            </Button>
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
                                                {!booking.published && (
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                                                        Bản nháp
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-4 h-4 text-gray-400" />
                                                    <span><strong>Tổ chức:</strong> {booking.organization_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span><strong>Email:</strong> {booking.contact_email}</span>
                                                </div>
                                                {booking.contact_phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        <span><strong>SĐT:</strong> {booking.contact_phone}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span><strong>Mentor:</strong> {getMentorNames(booking.desired_mentor_ids) || 'Chưa chọn'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span>
                                                        <strong>Ngày mong muốn:</strong> {booking.requested_date ?
                                                        new Date(booking.requested_date).toLocaleString('vi-VN', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) :
                                                        'Chưa chọn'
                                                    }
                                                    </span>
                                                </div>
                                                {booking.scheduled_date && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-green-600" />
                                                        <span className="text-green-600">
                                                            <strong>Ngày đã lên lịch:</strong> {new Date(booking.scheduled_date).toLocaleString('vi-VN', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span><strong>Thời lượng:</strong> {booking.duration} phút</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span><strong>Số lượng đăng ký:</strong> {booking.registered_count} người</span>
                                                </div>
                                                {booking.actual_count > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-green-600" />
                                                        <span className="text-green-600"><strong>Số lượng tham gia:</strong> {booking.actual_count} người</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-4 h-4 text-gray-400" />
                                                    <span><strong>Hình thức:</strong> <span className="capitalize">{booking.session_type}</span></span>
                                                </div>
                                            </div>

                                            {booking.required_skills.length > 0 && (
                                                <div className="mt-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        {booking.required_skills.map((skill, index) => (
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

                                            {booking.notes && (
                                                <div className="mt-3 text-sm text-gray-600">
                                                    <strong>Ghi chú:</strong> {booking.notes}
                                                </div>
                                            )}

                                            {booking.admin_notes && (
                                                <div className="mt-3 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                                                    <strong>Phản hồi từ admin:</strong> {booking.admin_notes}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            {/* Can edit if: not published OR (published AND status is pending/cancelled/rejected) */}
                                            {(!booking.published ||
                                                (booking.published && ['pending', 'cancelled', 'rejected'].includes(booking.status))) && (
                                                <button
                                                    onClick={() => editBooking(booking)}
                                                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            )}

                                            {/* Can delete if conditions are met */}
                                            {canDeleteBooking(booking) && (
                                                <button
                                                    onClick={() => deleteBooking(booking)}
                                                    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Booking Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">
                                        {editingBooking ? 'Chỉnh sửa đặt lịch' : 'Đặt lịch mentor mới'}
                                    </h3>
                                    <button
                                        onClick={resetForm}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Thông tin cá nhân/tổ chức */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin đăng ký</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tên cá nhân/tổ chức *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.organization_name}
                                                onChange={(e) => handleInputChange('organization_name', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Nhập tên cá nhân hoặc tổ chức"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email liên hệ *
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.contact_email}
                                                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Nhập email liên hệ"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Số điện thoại
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.contact_phone}
                                                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Nhập số điện thoại"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Số lượng dự kiến *
                                            </label>
                                            <div className="flex items-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (formData.registered_count > 1) {
                                                            handleInputChange('registered_count', formData.registered_count - 1);
                                                        }
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 rounded-l-lg hover:bg-gray-50"
                                                    disabled={formData.registered_count <= 1}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    value={formData.registered_count}
                                                    onChange={(e) => handleInputChange('registered_count', parseInt(e.target.value) || 1)}
                                                    className="w-full px-4 py-2 border-t border-b border-gray-300 text-center focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleInputChange('registered_count', formData.registered_count + 1)}
                                                    className="px-3 py-2 border border-gray-300 rounded-r-lg hover:bg-gray-50"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Số lượng người tham gia dự kiến</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Thông tin buổi học */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin buổi học</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ngày mong muốn
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={formData.requested_date}
                                                onChange={(e) => handleInputChange('requested_date', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                min={new Date().toISOString().slice(0, 16)}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Thời gian mong muốn tổ chức</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Thời lượng (phút)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="30"
                                                    max="480"
                                                    step="15"
                                                    value={formData.duration}
                                                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 120)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="120"
                                                />
                                                <div className="absolute right-3 top-2 text-gray-400 text-sm pointer-events-none">
                                                    phút
                                                </div>
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                <p className="text-xs text-gray-500 w-full">Thời lượng từ 30-480 phút. Gợi ý:</p>
                                                {[60, 90, 120, 180, 240].map((duration) => (
                                                    <button
                                                        key={duration}
                                                        type="button"
                                                        onClick={() => handleInputChange('duration', duration)}
                                                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                                                            formData.duration === duration
                                                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {duration}p
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Hình thức
                                            </label>
                                            <select
                                                value={formData.session_type}
                                                onChange={(e) => handleInputChange('session_type', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="online">Online</option>
                                                <option value="offline">Offline</option>
                                                <option value="hybrid">Hybrid</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Mentor Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn mentor mong muốn *
                                    </label>

                                    {/* Search mentors */}
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm mentor..."
                                            value={searchMentor}
                                            onChange={(e) => setSearchMentor(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Mentor count info */}
                                    <div className="mb-4 flex justify-between items-center text-sm text-gray-600">
                                        <span>
                                            {filteredMentors.length > 0
                                                ? `Hiển thị ${startIndex + 1}-${Math.min(startIndex + MENTORS_PER_PAGE, filteredMentors.length)} trong ${filteredMentors.length} mentor`
                                                : 'Không tìm thấy mentor nào'
                                            }
                                        </span>
                                        {totalMentorPages > 1 && (
                                            <span>Trang {mentorPage}/{totalMentorPages}</span>
                                        )}
                                    </div>

                                    {/* Selected mentors */}
                                    {formData.desired_mentor_ids.length > 0 && (
                                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                            <p className="text-sm font-medium text-blue-800 mb-2">
                                                Mentor đã chọn ({formData.desired_mentor_ids.length}):
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.desired_mentor_ids.map(mentorId => {
                                                    const mentor = mentors.find(m => m.id === mentorId);
                                                    return mentor ? (
                                                        <span
                                                            key={mentorId}
                                                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
                                                        >
                                                            {mentor.full_name}
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleMentorSelection(mentorId)}
                                                                className="ml-2 text-blue-200 hover:text-white"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Mentor grid */}
                                    <div className="border border-gray-200 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-h-96 overflow-y-auto">
                                            {paginatedMentors.map((mentor) => (
                                                <div
                                                    key={mentor.id}
                                                    onClick={() => toggleMentorSelection(mentor.id)}
                                                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                                        formData.desired_mentor_ids.includes(mentor.id)
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {mentor.avatar ? (
                                                            <Image
                                                                src={mentor.avatar}
                                                                alt={mentor.full_name}
                                                                width={40}
                                                                height={40}
                                                                className="rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                                <User className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                                {mentor.full_name}
                                                            </h4>
                                                            {mentor.headline && (
                                                                <p className="text-xs text-gray-600 truncate">
                                                                    {mentor.headline}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {mentor.skill && mentor.skill.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {mentor.skill.slice(0, 2).map((skill, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                            {mentor.skill.length > 2 && (
                                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                    +{mentor.skill.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {paginatedMentors.length === 0 && (
                                                <div className="col-span-full text-center py-8 text-gray-500">
                                                    {searchMentor ? 'Không tìm thấy mentor nào' : 'Chưa có mentor nào'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalMentorPages > 1 && (
                                            <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setMentorPage(page => Math.max(1, page - 1))}
                                                        disabled={mentorPage === 1}
                                                        className={`px-3 py-1 rounded text-sm ${
                                                            mentorPage === 1
                                                                ? 'text-gray-400 cursor-not-allowed'
                                                                : 'text-blue-600 hover:bg-blue-50'
                                                        }`}
                                                    >
                                                        ← Trước
                                                    </button>

                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: Math.min(5, totalMentorPages) }, (_, i) => {
                                                            let pageNum;
                                                            if (totalMentorPages <= 5) {
                                                                pageNum = i + 1;
                                                            } else {
                                                                if (mentorPage <= 3) {
                                                                    pageNum = i + 1;
                                                                } else if (mentorPage >= totalMentorPages - 2) {
                                                                    pageNum = totalMentorPages - 4 + i;
                                                                } else {
                                                                    pageNum = mentorPage - 2 + i;
                                                                }
                                                            }

                                                            return (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => setMentorPage(pageNum)}
                                                                    className={`px-2 py-1 rounded text-sm ${
                                                                        mentorPage === pageNum
                                                                            ? 'bg-blue-600 text-white'
                                                                            : 'text-gray-600 hover:bg-gray-100'
                                                                    }`}
                                                                >
                                                                    {pageNum}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    <button
                                                        onClick={() => setMentorPage(page => Math.min(totalMentorPages, page + 1))}
                                                        disabled={mentorPage === totalMentorPages}
                                                        className={`px-3 py-1 rounded text-sm ${
                                                            mentorPage === totalMentorPages
                                                                ? 'text-gray-400 cursor-not-allowed'
                                                                : 'text-blue-600 hover:bg-blue-50'
                                                        }`}
                                                    >
                                                        Sau →
                                                    </button>
                                                </div>

                                                <span className="text-sm text-gray-500">
                                                    {filteredMentors.length} mentor
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Skills */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Kỹ năng cần học (cách nhau bởi dấu phẩy)
                                    </label>
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onBlur={handleSkillsChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="VD: Tuyển dụng, Quản trị nhân sự, Phỏng vấn"
                                    />
                                    {formData.required_skills.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {formData.required_skills.map((skill, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ghi chú thêm
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập ghi chú, yêu cầu đặc biệt..."
                                    />
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 border-t border-gray-200">
                                {/* Mobile: Stack vertically, Desktop: Horizontal */}
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
                                    {/* Cancel button - full width on mobile */}
                                    <Button
                                        variant="outline"
                                        onClick={resetForm}
                                        disabled={submitting}
                                        className="w-full sm:w-auto order-3 sm:order-1 min-h-[44px] px-4 py-3 text-base font-medium"
                                    >
                                        Hủy
                                    </Button>

                                    {/* Save Draft - only show if not published or can edit */}
                                    {(!editingBooking || !editingBooking.published ||
                                        ['pending', 'cancelled', 'rejected'].includes(editingBooking.status)) && (
                                        <Button
                                            variant="secondary"
                                            onClick={saveDraft}
                                            disabled={submitting}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 order-2 sm:order-2 min-h-[44px] px-4 py-3 text-base font-medium"
                                        >
                                            {submitting ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600"></div>
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            <span className="text-sm sm:text-base">Lưu bản nháp</span>
                                        </Button>
                                    )}

                                    {/* Primary Submit button */}
                                    <Button
                                        onClick={submitBooking}
                                        disabled={submitting}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 order-1 sm:order-3 min-h-[44px] px-4 py-3 text-base font-medium"
                                    >
                                        {submitting ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                {editingBooking && editingBooking.published &&
                                                ['pending', 'cancelled', 'rejected'].includes(editingBooking.status) ? (
                                                    <RefreshCw className="w-4 h-4" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                            </>
                                        )}
                                        <span className="hidden sm:inline text-sm sm:text-base">
                                            {editingBooking && editingBooking.published &&
                                            ['pending', 'cancelled', 'rejected'].includes(editingBooking.status)
                                                ? 'Cập nhật và gửi lại'
                                                : editingBooking
                                                    ? 'Cập nhật đặt lịch'
                                                    : 'Gửi đặt lịch'
                                            }
                                        </span>
                                        <span className="sm:hidden text-sm sm:text-base">
                                            {editingBooking ? 'Cập nhật' : 'Gửi đặt lịch'}
                                        </span>
                                    </Button>
                                </div>

                                {/* Mobile: Additional info text */}
                                <div className="mt-3 sm:hidden text-xs text-gray-500 text-center">
                                    {editingBooking && editingBooking.published &&
                                        ['pending', 'cancelled', 'rejected'].includes(editingBooking.status) &&
                                        'Đặt lịch sẽ được gửi lại để admin xem xét'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Loading component for Suspense fallback
const LoadingSpinner = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
        </div>
    </div>
);

// Main component with Suspense wrapper
const MentorBookingPage = () => {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <MentorBookingContent />
        </Suspense>
    );
};

export default MentorBookingPage;