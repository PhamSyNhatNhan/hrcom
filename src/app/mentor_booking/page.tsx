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
    Send,
    Edit,
    X,
    Plus,
    Search,
    User,
    Phone,
    Mail,
    AlertCircle,
    CheckCircle,
    XCircle,
    Trash2,
    ChevronRight,
    ChevronLeft,
    Star,
    MapPin,
    Video,
    Coffee,
    Check,
    ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import type {
    Mentor,
    MentorSkillRelation,
    MentorBooking,
    BookingFormData,
    ReviewFormData,
    Notification
} from '@/types/mentor_booking_user';

const MentorBookingContent = () => {
    const { user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [mentorSkills, setMentorSkills] = useState<Record<string, MentorSkillRelation[]>>({});
    const [bookings, setBookings] = useState<MentorBooking[]>([]);
    const [totalBookings, setTotalBookings] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [editingBooking, setEditingBooking] = useState<MentorBooking | null>(null);
    const [searchMentor, setSearchMentor] = useState('');

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewingBooking, setReviewingBooking] = useState<MentorBooking | null>(null);
    const [reviewData, setReviewData] = useState<ReviewFormData>({
        rating: 0,
        comment: '',
        is_published: true
    });

    const [formData, setFormData] = useState<BookingFormData>({
        mentor_id: '',
        selectedSkills: [],
        otherSkills: '',
        session_type: 'online',
        scheduled_date: '',
        duration: 60,
        contact_email: user?.email || '',
        contact_phone: '',
        user_notes: ''
    });

    const [notification, setNotification] = useState<Notification | null>(null);
    const [mentorPage, setMentorPage] = useState(1);
    const MENTORS_PER_PAGE = 6;

    const steps = [
        { id: 1, title: 'Chọn Mentor', icon: <Users className="w-5 h-5" /> },
        { id: 2, title: 'Chọn Kỹ năng', icon: <Star className="w-5 h-5" /> },
        { id: 3, title: 'Hình thức & Thời gian', icon: <Calendar className="w-5 h-5" /> },
        { id: 4, title: 'Thông tin liên hệ', icon: <Phone className="w-5 h-5" /> },
        { id: 5, title: 'Ghi chú', icon: <Edit className="w-5 h-5" /> },
        { id: 6, title: 'Xác nhận', icon: <CheckCircle className="w-5 h-5" /> }
    ];

    useEffect(() => {
        if (user) {
            loadMentors();
            loadUserBookings();

            if (editId) {
                loadBookingForEdit(editId);
            }

            const mentorId = searchParams.get('mentor');
            if (mentorId && !editId) {
                setFormData(prev => ({
                    ...prev,
                    mentor_id: mentorId
                }));
                setCurrentStep(2);
                setShowForm(true);
            }
        }
    }, [user, editId]);

    useEffect(() => {
        if (showForm || showReviewModal) {
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
    }, [showForm, showReviewModal]);

    const loadMentors = async () => {
        try {
            const { data: mentorsData, error: mentorsError } = await supabase
                .rpc('mentor_booking_user_get_mentors_with_skills');

            if (mentorsError) throw mentorsError;

            const mentorsArray = Array.isArray(mentorsData) ? mentorsData : [];
            setMentors(mentorsArray);

            const skillsMap: Record<string, MentorSkillRelation[]> = {};
            mentorsArray.forEach((mentor: any) => {
                if (mentor.skills && Array.isArray(mentor.skills)) {
                    skillsMap[mentor.id] = mentor.skills.map((skill: any) => ({
                        skill_id: skill.skill_id,
                        mentor_skills: {
                            id: skill.skill_id,
                            name: skill.name,
                            description: skill.description
                        }
                    }));
                }
            });

            setMentorSkills(skillsMap);
        } catch (error) {
            console.error('Error loading mentors:', error);
            showNotification('error', 'Không thể tải danh sách mentor');
            setMentors([]);
        }
    };

    const loadUserBookings = async (limit: number = 50, offset: number = 0) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .rpc('mentor_booking_user_get_bookings', {
                    p_user_id: user?.id,
                    p_limit: limit,
                    p_offset: offset
                });

            if (error) throw error;

            const bookingsWithReview = (data || []).map((booking: any) => ({
                ...booking,
                mentors: {
                    id: booking.mentor_id,
                    full_name: booking.mentor_name,
                    avatar: booking.mentor_avatar,
                    headline: booking.mentor_headline,
                    email: ''
                }
            }));

            setBookings(bookingsWithReview);
            if (data && data.length > 0) {
                setTotalBookings(Number(data[0].total_count) || 0);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            showNotification('error', 'Không thể tải danh sách đặt lịch');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const loadBookingForEdit = async (bookingId: string) => {
        try {
            const { data, error } = await supabase
                .rpc('mentor_booking_user_get_booking', {
                    p_booking_id: bookingId,
                    p_user_id: user?.id
                });

            if (error) throw error;

            if (data && data.length > 0) {
                const booking = data[0];
                setEditingBooking(booking);
                setFormData({
                    mentor_id: booking.mentor_id || '',
                    selectedSkills: [],
                    otherSkills: '',
                    session_type: booking.session_type || 'online',
                    scheduled_date: booking.scheduled_date ?
                        new Date(booking.scheduled_date).toISOString().slice(0, 16) : '',
                    duration: booking.duration || 60,
                    contact_email: booking.contact_email || '',
                    contact_phone: booking.contact_phone || '',
                    user_notes: booking.user_notes || ''
                });
                setShowForm(true);
            }
        } catch (error) {
            console.error('Error loading booking for edit:', error);
            showNotification('error', 'Không thể tải thông tin đặt lịch');
        }
    };

    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleInputChange = (field: keyof BookingFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateStep = (step: number) => {
        switch (step) {
            case 1:
                return formData.mentor_id !== '';
            case 2:
                return formData.selectedSkills.length > 0 || formData.otherSkills.trim() !== '';
            case 3:
                return formData.session_type && formData.scheduled_date && formData.duration > 0;
            case 4:
                return formData.contact_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email);
            case 5:
                return true;
            case 6:
                return true;
            default:
                return false;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 6));
        } else {
            showNotification('error', 'Vui lòng hoàn thành thông tin bắt buộc');
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const submitBooking = async () => {
        if (!validateStep(6)) return;

        try {
            setSubmitting(true);

            // Tạo user notes từ skills và ghi chú
            const skillsText = formData.selectedSkills.length > 0
                ? `Kỹ năng: ${formData.selectedSkills.join(', ')}`
                : '';
            const otherSkillsText = formData.otherSkills
                ? `Kỹ năng khác: ${formData.otherSkills}`
                : '';
            const notesText = formData.user_notes
                ? `Ghi chú: ${formData.user_notes}`
                : '';

            const userNotes = [skillsText, otherSkillsText, notesText]
                .filter(Boolean)
                .join('; ');

            if (editingBooking) {
                // Cập nhật booking
                const { data, error } = await supabase.rpc('mentor_booking_user_update_booking', {
                    p_booking_id: editingBooking.id,
                    p_user_id: user?.id,
                    p_mentor_id: formData.mentor_id,
                    p_scheduled_date: new Date(formData.scheduled_date).toISOString(),
                    p_duration: formData.duration,
                    p_session_type: formData.session_type,
                    p_contact_email: formData.contact_email,
                    p_contact_phone: formData.contact_phone || null,
                    p_user_notes: userNotes
                });

                if (error) throw error;
                if (!data) throw new Error('Không thể cập nhật đặt lịch');

                showNotification('success', 'Đã cập nhật đặt lịch thành công');
            } else {
                // Tạo booking mới
                const { data: bookingData, error: bookingError } = await supabase.rpc(
                    'mentor_booking_user_create_booking',
                    {
                        p_user_id: user?.id,
                        p_mentor_id: formData.mentor_id,
                        p_scheduled_date: new Date(formData.scheduled_date).toISOString(),
                        p_duration: formData.duration,
                        p_session_type: formData.session_type,
                        p_contact_email: formData.contact_email,
                        p_contact_phone: formData.contact_phone || null,
                        p_user_notes: userNotes
                    }
                );

                if (bookingError) throw bookingError;

                // Gửi email thông báo
                await sendBookingNotification(bookingData, userNotes);

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

    const sendBookingNotification = async (bookingId: any, userNotes: string) => {
        try {
            const selectedMentor = mentors.find(m => m.id === formData.mentor_id);

            if (!selectedMentor) {
                console.warn('Mentor not found, skipping email notification');
                return;
            }

            // Lấy tên user từ email hoặc user object
            const userName = user?.email?.split('@')[0] || 'User';

            const { data: emailData, error: emailError } = await supabase.functions.invoke(
                'send-booking-notification',
                {
                    body: {
                        booking_id: bookingId || 'temp-id',
                        user_email: formData.contact_email,
                        user_name: userName,
                        mentor_email: selectedMentor.email || '',
                        mentor_name: selectedMentor.full_name || 'Mentor',
                        mentor_headline: selectedMentor.headline || '',
                        scheduled_date: formData.scheduled_date,
                        duration: formData.duration,
                        session_type: formData.session_type,
                        user_notes: userNotes,

                        // TEST - Comment 2 dòng này khi deploy production
                        //override_user_email: 'hrcomsupa@gmail.com',
                        //override_mentor_email: 'hrcomsupa@gmail.com'
                    }
                }
            );

            if (emailError) {
                console.error('Email notification error:', emailError);
                // Không throw error vì booking đã tạo thành công
            } else {
                console.log('Emails sent successfully to:', emailData?.sent_to);
            }
        } catch (error) {
            console.error('Failed to send email notifications:', error);
            // Không throw error để không ảnh hưởng flow chính
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setCurrentStep(1);
        setEditingBooking(null);
        setFormData({
            mentor_id: '',
            selectedSkills: [],
            otherSkills: '',
            session_type: 'online',
            scheduled_date: '',
            duration: 60,
            contact_email: user?.email || '',
            contact_phone: '',
            user_notes: ''
        });

        if (editId || searchParams.get('mentor')) {
            router.replace('/mentor_booking');
        }
    };

    const editBooking = (booking: MentorBooking) => {
        if (!['pending', 'cancelled'].includes(booking.status)) {
            showNotification('warning', 'Không thể chỉnh sửa đặt lịch ở trạng thái này');
            return;
        }

        setEditingBooking(booking);
        setFormData({
            mentor_id: booking.mentor_id || '',
            selectedSkills: [],
            otherSkills: '',
            session_type: booking.session_type || 'online',
            scheduled_date: booking.scheduled_date ?
                new Date(booking.scheduled_date).toISOString().slice(0, 16) : '',
            duration: booking.duration || 60,
            contact_email: booking.contact_email || '',
            contact_phone: booking.contact_phone || '',
            user_notes: booking.user_notes || ''
        });
        setShowForm(true);
    };

    const deleteBooking = async (booking: MentorBooking) => {
        if (!['pending', 'cancelled'].includes(booking.status)) {
            showNotification('warning', 'Không thể xóa đặt lịch ở trạng thái này');
            return;
        }

        if (!confirm('Bạn có chắc chắn muốn xóa đặt lịch này?')) return;

        try {
            const { data, error } = await supabase.rpc('mentor_booking_user_delete_booking', {
                p_booking_id: booking.id,
                p_user_id: user?.id
            });

            if (error) throw error;
            if (!data) throw new Error('Không thể xóa đặt lịch');

            showNotification('success', 'Đã xóa đặt lịch thành công');
            await loadUserBookings();
        } catch (error) {
            console.error('Error deleting booking:', error);
            showNotification('error', 'Lỗi khi xóa đặt lịch');
        }
    };

    const openReviewModal = (booking: MentorBooking) => {
        setReviewingBooking(booking);
        setReviewData({
            rating: 0,
            comment: '',
            is_published: true
        });
        setShowReviewModal(true);
    };

    const submitReview = async () => {
        if (!reviewingBooking || reviewData.rating === 0) {
            showNotification('error', 'Vui lòng chọn số sao đánh giá');
            return;
        }

        if (reviewingBooking.has_review) {
            showNotification('warning', 'Bạn đã đánh giá buổi tư vấn này rồi');
            setShowReviewModal(false);
            return;
        }

        try {
            setSubmitting(true);

            const { data, error } = await supabase.rpc('mentor_booking_user_create_review', {
                p_booking_id: reviewingBooking.id,
                p_user_id: user?.id,
                p_mentor_id: reviewingBooking.mentor_id,
                p_rating: reviewData.rating,
                p_comment: reviewData.comment || null,
                p_is_published: reviewData.is_published
            });

            if (error) throw error;

            showNotification('success', 'Đánh giá đã được gửi thành công');
            setShowReviewModal(false);
            loadUserBookings();
        } catch (error) {
            console.error('Error submitting review:', error);
            showNotification('error', 'Lỗi khi gửi đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredMentors = mentors.filter(mentor =>
        mentor.full_name.toLowerCase().includes(searchMentor.toLowerCase()) ||
        mentor.headline?.toLowerCase().includes(searchMentor.toLowerCase())
    );

    const totalMentorPages = Math.ceil(filteredMentors.length / MENTORS_PER_PAGE);
    const startIndex = (mentorPage - 1) * MENTORS_PER_PAGE;
    const paginatedMentors = filteredMentors.slice(startIndex, startIndex + MENTORS_PER_PAGE);

    const selectedMentor = mentors.find(m => m.id === formData.mentor_id);
    const selectedMentorSkills = mentorSkills[formData.mentor_id] || [];

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

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Chọn Mentor</h3>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm mentor..."
                                    value={searchMentor}
                                    onChange={(e) => setSearchMentor(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto">
                                {paginatedMentors.map((mentor) => (
                                    <div
                                        key={mentor.id}
                                        onClick={() => handleInputChange('mentor_id', mentor.id)}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                            formData.mentor_id === mentor.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {mentor.avatar ? (
                                                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                                                    <Image
                                                        src={mentor.avatar}
                                                        alt={mentor.full_name}
                                                        width={56}
                                                        height={56}
                                                        className="w-full h-full"
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="w-7 h-7 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 text-base">{mentor.full_name}</h4>
                                                {mentor.headline && (
                                                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{mentor.headline}</p>
                                                )}
                                                {mentor.description && (
                                                    <p className="text-sm text-gray-500 line-clamp-2">{mentor.description}</p>
                                                )}

                                                {mentorSkills[mentor.id] && mentorSkills[mentor.id].length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {mentorSkills[mentor.id].slice(0, 3).map((skillRel) => (
                                                            <span
                                                                key={skillRel.skill_id}
                                                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                                            >
                                                                {skillRel.mentor_skills.name}
                                                            </span>
                                                        ))}
                                                        {mentorSkills[mentor.id].length > 3 && (
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                +{mentorSkills[mentor.id].length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalMentorPages > 1 && (
                                <div className="flex justify-center items-center gap-4 mt-4">
                                    <button
                                        onClick={() => setMentorPage(p => Math.max(1, p - 1))}
                                        disabled={mentorPage === 1}
                                        className="p-2 border rounded-lg disabled:opacity-50 active:bg-gray-50"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm text-gray-600 min-w-[60px] text-center">
                                        {mentorPage} / {totalMentorPages}
                                    </span>
                                    <button
                                        onClick={() => setMentorPage(p => Math.min(totalMentorPages, p + 1))}
                                        disabled={mentorPage === totalMentorPages}
                                        className="p-2 border rounded-lg disabled:opacity-50 active:bg-gray-50"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Chọn Kỹ năng</h3>

                            {selectedMentor && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        Mentor: <span className="font-semibold">{selectedMentor.full_name}</span>
                                    </p>
                                </div>
                            )}

                            {selectedMentorSkills.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-medium text-gray-900 mb-3 text-base">Kỹ năng của mentor</h4>
                                    <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto">
                                        {selectedMentorSkills.map((skillRel) => (
                                            <div
                                                key={skillRel.skill_id}
                                                onClick={() => {
                                                    const skillName = skillRel.mentor_skills.name;
                                                    const newSkills = formData.selectedSkills.includes(skillName)
                                                        ? formData.selectedSkills.filter(s => s !== skillName)
                                                        : [...formData.selectedSkills, skillName];
                                                    handleInputChange('selectedSkills', newSkills);
                                                }}
                                                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                    formData.selectedSkills.includes(skillRel.mentor_skills.name)
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                                        formData.selectedSkills.includes(skillRel.mentor_skills.name)
                                                            ? 'border-blue-500 bg-blue-500'
                                                            : 'border-gray-300'
                                                    }`}>
                                                        {formData.selectedSkills.includes(skillRel.mentor_skills.name) && (
                                                            <Check className="w-3 h-3 text-white" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-medium text-base block">{skillRel.mentor_skills.name}</span>
                                                        {skillRel.mentor_skills.description && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {skillRel.mentor_skills.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="font-medium text-gray-900 mb-3 text-base">Kỹ năng khác (tùy chọn)</h4>
                                <textarea
                                    value={formData.otherSkills}
                                    onChange={(e) => handleInputChange('otherSkills', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                                    placeholder="VD: Phỏng vấn, Xây dựng CV, Lập kế hoạch nghề nghiệp"
                                />
                            </div>

                            {(formData.selectedSkills.length > 0 || formData.otherSkills) && (
                                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                    <h5 className="font-medium text-green-800 mb-2 text-sm">Kỹ năng đã chọn:</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.selectedSkills.map((skill, index) => (
                                            <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                                {skill}
                                            </span>
                                        ))}
                                        {formData.otherSkills && (
                                            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                                Khác: {formData.otherSkills}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Hình thức và Thời gian</h3>

                            <div className="mb-4">
                                <h4 className="font-medium text-gray-900 mb-3 text-base">Hình thức tư vấn</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        {
                                            value: 'online',
                                            label: 'Online',
                                            icon: <Video className="w-5 h-5" />,
                                            description: 'Tư vấn qua video call'
                                        },
                                        {
                                            value: 'offline',
                                            label: 'Offline',
                                            icon: <Coffee className="w-5 h-5" />,
                                            description: 'Gặp mặt trực tiếp'
                                        },
                                        {
                                            value: 'hybrid',
                                            label: 'Hybrid',
                                            icon: <MapPin className="w-5 h-5" />,
                                            description: 'Linh hoạt online/offline'
                                        }
                                    ].map((type) => (
                                        <div
                                            key={type.value}
                                            onClick={() => handleInputChange('session_type', type.value)}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                formData.session_type === type.value
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${
                                                    formData.session_type === type.value
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {type.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="font-semibold text-base block">{type.label}</span>
                                                    <p className="text-sm text-gray-600">{type.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ngày và giờ mong muốn *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduled_date}
                                        onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Thời lượng (phút) *
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[30, 60, 90, 120].map((duration) => (
                                            <button
                                                key={duration}
                                                type="button"
                                                onClick={() => handleInputChange('duration', duration)}
                                                className={`py-3 text-base font-medium rounded-lg border-2 transition-colors ${
                                                    formData.duration === duration
                                                        ? 'bg-blue-100 text-blue-700 border-blue-500'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 active:bg-gray-50'
                                                }`}
                                            >
                                                {duration}p
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin liên hệ</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email liên hệ *
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.contact_email}
                                        onChange={(e) => handleInputChange('contact_email', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                                        placeholder="example@email.com"
                                        required
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Email để mentor liên hệ xác nhận lịch hẹn
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Số điện thoại (tùy chọn)
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.contact_phone}
                                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                                        placeholder="0123456789"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Số điện thoại để liên lạc nhanh hơn
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Ghi chú thêm</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi chú cho mentor (tùy chọn)
                                </label>
                                <textarea
                                    value={formData.user_notes}
                                    onChange={(e) => handleInputChange('user_notes', e.target.value)}
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                                    placeholder="Chia sẻ thêm về mục tiêu, tình huống cụ thể bạn cần tư vấn, hoặc bất kỳ thông tin nào giúp mentor chuẩn bị tốt hơn..."
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Thông tin này sẽ giúp mentor chuẩn bị tốt hơn cho buổi tư vấn
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 6:
                return (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Xác nhận đặt lịch</h3>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    {selectedMentor?.avatar ? (
                                        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                                            <Image
                                                src={selectedMentor.avatar}
                                                alt={selectedMentor.full_name}
                                                width={56}
                                                height={56}
                                                className="w-full h-full"
                                                style={{ objectFit: 'cover' }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                            <User className="w-7 h-7 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 text-base">{selectedMentor?.full_name}</h4>
                                        {selectedMentor?.headline && (
                                            <p className="text-sm text-gray-600">{selectedMentor.headline}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium">Thời gian: </span>
                                            <span className="break-words">
                                                {formData.scheduled_date ?
                                                    new Date(formData.scheduled_date).toLocaleString('vi-VN') :
                                                    'Chưa chọn'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span><span className="font-medium">Thời lượng:</span> {formData.duration} phút</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {formData.session_type === 'online' && <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                        {formData.session_type === 'offline' && <Coffee className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                        {formData.session_type === 'hybrid' && <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                        <span>
                                            <span className="font-medium">Hình thức:</span> {
                                            formData.session_type === 'online' ? 'Online' :
                                                formData.session_type === 'offline' ? 'Offline' : 'Hybrid'
                                        }
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium">Email: </span>
                                            <span className="break-words">{formData.contact_email}</span>
                                        </div>
                                    </div>
                                    {formData.contact_phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span><span className="font-medium">SĐT:</span> {formData.contact_phone}</span>
                                        </div>
                                    )}
                                </div>

                                {(formData.selectedSkills.length > 0 || formData.otherSkills) && (
                                    <div>
                                        <div className="font-medium text-sm text-gray-700 mb-2">Kỹ năng muốn học:</div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.selectedSkills.map((skill, index) => (
                                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                    {skill}
                                                </span>
                                            ))}
                                            {formData.otherSkills && (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                    Khác: {formData.otherSkills}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {formData.user_notes && (
                                    <div>
                                        <div className="font-medium text-sm text-gray-700 mb-1">Ghi chú:</div>
                                        <p className="text-sm text-gray-600 bg-white p-3 rounded border break-words">
                                            {formData.user_notes}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm flex-1">
                                        <p className="font-medium text-yellow-800 mb-1">Lưu ý quan trọng:</p>
                                        <ul className="text-yellow-700 space-y-1 list-disc list-inside">
                                            <li>Đây chỉ là yêu cầu đặt lịch, mentor sẽ xác nhận sau</li>
                                            <li>Bạn sẽ nhận thông báo qua email khi có phản hồi</li>
                                            <li>Mentor có thể đề xuất thời gian phù hợp hơn</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Vui lòng đăng nhập</h2>
                    <p className="text-gray-600">Bạn cần đăng nhập để sử dụng tính năng đặt lịch mentor.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-8 sm:px-6 lg:px-8">
            {notification && (
                <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:w-auto max-w-md z-50 p-4 rounded-lg shadow-lg ${
                    notification.type === 'success' ? 'bg-green-100 text-green-800' :
                        notification.type === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                }`}>
                    <div className="flex items-start gap-3">
                        {notification.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                        {notification.type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                        {notification.type === 'warning' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                        <span className="flex-1 text-sm sm:text-base">{notification.message}</span>
                        <button
                            onClick={() => setNotification(null)}
                            className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <SectionHeader
                    title="ĐẶT LỊCH MENTOR"
                    subtitle="Đăng ký lịch tư vấn 1-1 với các mentor chuyên nghiệp"
                />

                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                            Danh sách đặt lịch của bạn {totalBookings > 0 && `(${totalBookings})`}
                        </h3>
                        <Button
                            onClick={() => setShowForm(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 text-base font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Đặt lịch mới</span>
                        </Button>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    {loading ? (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Đang tải...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
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
                        <>
                            {bookings.map((booking) => (
                                <div key={booking.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="p-4 sm:p-6">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                {booking.mentors?.avatar ? (
                                                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                                                        <Image
                                                            src={booking.mentors.avatar}
                                                            alt={booking.mentors.full_name}
                                                            width={48}
                                                            height={48}
                                                            className="w-full h-full"
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <User className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                                                        {booking.mentors?.full_name || 'Mentor không xác định'}
                                                    </h4>
                                                    {booking.mentors?.headline && (
                                                        <p className="text-sm text-gray-600">{booking.mentors.headline}</p>
                                                    )}
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 flex-shrink-0 ${getStatusColor(booking.status)}`}>
                                                    {getStatusIcon(booking.status)}
                                                    <span className="hidden sm:inline">{getStatusText(booking.status)}</span>
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                <div className="flex items-start gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                                    <span className="break-words">
                                                        <span className="font-medium">Thời gian:</span> {booking.scheduled_date ?
                                                        new Date(booking.scheduled_date).toLocaleString('vi-VN', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) :
                                                        'Chưa xác định'
                                                    }
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span><span className="font-medium">Thời lượng:</span> {booking.duration} phút</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {booking.session_type === 'online' && <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                                    {booking.session_type === 'offline' && <Coffee className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                                    {booking.session_type === 'hybrid' && <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                                    <span>
                                                        <span className="font-medium">Hình thức:</span> {
                                                        booking.session_type === 'online' ? 'Online' :
                                                            booking.session_type === 'offline' ? 'Offline' : 'Hybrid'
                                                    }
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                                    <span className="break-words"><span className="font-medium">Email:</span> {booking.contact_email}</span>
                                                </div>
                                                {booking.contact_phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <span><span className="font-medium">SĐT:</span> {booking.contact_phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {booking.user_notes && (
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-medium">Ghi chú:</span> {booking.user_notes}
                                                </div>
                                            )}

                                            {booking.mentor_notes && (
                                                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                                                    <span className="font-medium">Phản hồi từ mentor:</span> {booking.mentor_notes}
                                                </div>
                                            )}

                                            {booking.admin_notes && (
                                                <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                                                    <span className="font-medium">Ghi chú từ admin:</span> {booking.admin_notes}
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {booking.status === 'completed' && !booking.has_review && (
                                                    <button
                                                        onClick={() => openReviewModal(booking)}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95"
                                                        title="Đánh giá mentor"
                                                    >
                                                        <Star className="w-4 h-4" />
                                                        <span>Đánh giá</span>
                                                    </button>
                                                )}

                                                {booking.status === 'completed' && booking.has_review && (
                                                    <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                        <Star className="w-4 h-4 fill-current text-yellow-500" />
                                                        <span>Đã đánh giá</span>
                                                    </div>
                                                )}

                                                {['pending', 'cancelled'].includes(booking.status) && (
                                                    <>
                                                        <button
                                                            onClick={() => editBooking(booking)}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors active:scale-95"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            <span>Sửa</span>
                                                        </button>
                                                        <button
                                                            onClick={() => deleteBooking(booking)}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors active:scale-95"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            <span>Xóa</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={resetForm}
                        />

                        <div className="relative bg-white rounded-xl w-[92%] max-w-[420px] sm:w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg sm:text-xl font-bold">
                                        {editingBooking ? 'Chỉnh sửa đặt lịch' : 'Đặt lịch mentor mới'}
                                    </h3>
                                    <button
                                        onClick={resetForm}
                                        className="text-gray-400 hover:text-gray-600 p-2 -mr-2"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                                    <div className="flex items-center justify-between min-w-[600px] sm:min-w-0">
                                        {steps.map((step, index) => (
                                            <React.Fragment key={step.id}>
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                                                        currentStep > step.id
                                                            ? 'bg-green-100 text-green-600 border-green-200'
                                                            : currentStep === step.id
                                                                ? 'bg-blue-100 text-blue-600 border-blue-200'
                                                                : 'bg-gray-100 text-gray-400 border-gray-200'
                                                    }`}>
                                                        {currentStep > step.id ? (
                                                            <CheckCircle className="w-5 h-5" />
                                                        ) : (
                                                            step.icon
                                                        )}
                                                    </div>
                                                    <div className={`mt-2 text-xs text-center max-w-[70px] ${
                                                        currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                                                    }`}>
                                                        {step.title}
                                                    </div>
                                                </div>
                                                {index < steps.length - 1 && (
                                                    <div className={`flex-1 h-0.5 mx-2 ${
                                                        currentStep > step.id ? 'bg-green-200' : 'bg-gray-200'
                                                    }`} />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 min-h-[300px]">
                                {renderStepContent()}
                            </div>

                            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6">
                                <div className="flex justify-between gap-3">
                                    <div>
                                        {currentStep > 1 && (
                                            <Button
                                                variant="outline"
                                                onClick={prevStep}
                                                className="flex items-center gap-2 min-h-[48px]"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                <span className="hidden sm:inline">Quay lại</span>
                                            </Button>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={resetForm}
                                            disabled={submitting}
                                            className="hidden sm:flex min-h-[48px]"
                                        >
                                            Hủy
                                        </Button>

                                        {currentStep < 6 ? (
                                            <Button
                                                onClick={nextStep}
                                                disabled={!validateStep(currentStep)}
                                                className="flex items-center gap-2 min-h-[48px] px-6"
                                            >
                                                <span>Tiếp tục</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={submitBooking}
                                                disabled={submitting || !validateStep(6)}
                                                className="flex items-center gap-2 min-h-[48px] px-6"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        <span>Đang gửi...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        <span>{editingBooking ? 'Cập nhật' : 'Gửi đặt lịch'}</span>
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showReviewModal && reviewingBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={() => setShowReviewModal(false)}
                        />

                        <div className="relative bg-white rounded-xl w-[92%] max-w-[420px] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="p-4 sm:p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg sm:text-xl font-bold">Đánh giá Mentor</h3>
                                    <button
                                        onClick={() => setShowReviewModal(false)}
                                        className="text-gray-400 hover:text-gray-600 p-2 -mr-2"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 space-y-6">
                                <div className="flex items-center gap-3">
                                    {reviewingBooking.mentors?.avatar ? (
                                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200">
                                            <Image
                                                src={reviewingBooking.mentors.avatar}
                                                alt={reviewingBooking.mentors.full_name}
                                                width={56}
                                                height={56}
                                                className="w-full h-full"
                                                style={{ objectFit: 'cover' }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="w-7 h-7 text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-semibold text-base">{reviewingBooking.mentors?.full_name}</h4>
                                        <p className="text-sm text-gray-600">
                                            {reviewingBooking.scheduled_date && new Date(reviewingBooking.scheduled_date).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Đánh giá chất lượng tư vấn *
                                    </label>
                                    <div className="flex items-center justify-center gap-3 py-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                                                className={`transition-all active:scale-110 ${
                                                    star <= reviewData.rating
                                                        ? 'text-yellow-400 hover:text-yellow-500'
                                                        : 'text-gray-300 hover:text-yellow-300'
                                                }`}
                                            >
                                                <Star className={`w-10 h-10 sm:w-12 sm:h-12 ${star <= reviewData.rating ? 'fill-current' : ''}`} />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="text-center">
                                        <span className="text-base font-medium text-gray-700">
                                            {reviewData.rating > 0 ? `${reviewData.rating}/5 sao` : 'Chọn số sao'}
                                        </span>
                                        <div className="text-sm text-gray-500 mt-1">
                                            {reviewData.rating === 1 && "Rất không hài lòng"}
                                            {reviewData.rating === 2 && "Không hài lòng"}
                                            {reviewData.rating === 3 && "Bình thường"}
                                            {reviewData.rating === 4 && "Hài lòng"}
                                            {reviewData.rating === 5 && "Rất hài lòng"}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nhận xét (tùy chọn)
                                    </label>
                                    <textarea
                                        value={reviewData.comment}
                                        onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                                        placeholder="Chia sẻ cảm nhận về buổi tư vấn..."
                                    />
                                </div>

                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="publish_review"
                                        checked={reviewData.is_published}
                                        onChange={(e) => setReviewData(prev => ({ ...prev, is_published: e.target.checked }))}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                                    />
                                    <label htmlFor="publish_review" className="text-sm text-gray-700 flex-1">
                                        Công khai đánh giá để giúp người khác tham khảo khi chọn mentor
                                    </label>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 border-t border-gray-200 flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowReviewModal(false)}
                                    disabled={submitting}
                                    className="flex-1 min-h-[48px]"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={submitReview}
                                    disabled={submitting || reviewData.rating === 0}
                                    className="flex-1 flex items-center justify-center gap-2 min-h-[48px]"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Đang gửi...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            <span>Gửi đánh giá</span>
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

const LoadingSpinner = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
        </div>
    </div>
);

const MentorBookingPage = () => {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <MentorBookingContent />
        </Suspense>
    );
};

export default MentorBookingPage;