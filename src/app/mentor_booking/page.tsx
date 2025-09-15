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

// Interfaces
interface Mentor {
    id: string;
    full_name: string;
    headline?: string;
    avatar?: string;
    description?: string;
    phone_number?: string;
    email: string;
}

interface MentorSkill {
    id: string;
    name: string;
    description?: string;
}

interface MentorSkillRelation {
    skill_id: string;
    mentor_skills: MentorSkill;
}

interface MentorReview {
    id?: string;
    booking_id: string;
    user_id: string;
    mentor_id: string;
    rating: number;
    comment?: string;
    is_published: boolean;
    created_at?: string;
    updated_at?: string;
}

interface MentorBooking {
    id?: string;
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
    created_at?: string;
    updated_at?: string;
    completed_at?: string;
    mentors?: Mentor;
    mentor_reviews?: MentorReview[];
    has_review?: boolean;
}

interface BookingFormData {
    mentor_id: string;
    selectedSkills: string[];
    otherSkills: string;
    session_type: 'online' | 'offline' | 'hybrid';
    scheduled_date: string;
    duration: number;
    contact_email: string;
    contact_phone: string;
    user_notes: string;
}

// Multi-step booking component
const MentorBookingContent = () => {
    const { user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    // States
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [mentorSkills, setMentorSkills] = useState<Record<string, MentorSkillRelation[]>>({});
    const [bookings, setBookings] = useState<MentorBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [editingBooking, setEditingBooking] = useState<MentorBooking | null>(null);
    const [searchMentor, setSearchMentor] = useState('');

    // Review states
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewingBooking, setReviewingBooking] = useState<MentorBooking | null>(null);
    const [reviewData, setReviewData] = useState({
        rating: 0,
        comment: '',
        is_published: true
    });

    // Form data
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

    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
    } | null>(null);

    // Pagination
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

    // Load data
    useEffect(() => {
        if (user) {
            loadMentors();
            loadUserBookings();

            // Handle edit mode
            if (editId) {
                loadBookingForEdit(editId);
            }

            // Handle mentor pre-selection from URL
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
    }, [user, editId]); // <- BỎ showForm khỏi dependency

    const loadMentors = async () => {
        try {
            const { data: mentorsData, error: mentorsError } = await supabase
                .from('mentors')
                .select('*')
                .eq('published', true)
                .order('full_name');

            if (mentorsError) throw mentorsError;
            setMentors(Array.isArray(mentorsData) ? mentorsData : []);

            // Load skills for each mentor
            if (mentorsData && mentorsData.length > 0) {
                const skillsPromises = mentorsData.map(async (mentor) => {
                    const { data: skillsData, error: skillsError } = await supabase
                        .from('mentor_skill_relations')
                        .select(`
                            skill_id,
                            mentor_skills (
                                id,
                                name,
                                description
                            )
                        `)
                        .eq('mentor_id', mentor.id);

                    if (skillsError) throw skillsError;
                    return { mentorId: mentor.id, skills: skillsData || [] };
                });

                const skillsResults = await Promise.all(skillsPromises);

                // skillsResults: Array<{ mentorId: string; skills: RawMentorSkillRelation[] }>
                const skillsMap: Record<string, MentorSkillRelation[]> = {};

                skillsResults.forEach(({ mentorId, skills }) => {
                    const normalized: MentorSkillRelation[] = (skills ?? [])
                        .map((s): MentorSkillRelation | null => {
                            // Nếu mentor_skills là mảng, lấy phần tử đầu; nếu là object, dùng luôn
                            const ms = Array.isArray(s.mentor_skills)
                                ? s.mentor_skills[0]
                                : s.mentor_skills;

                            // Bỏ qua bản ghi rỗng / không hợp lệ
                            if (!ms || !ms.id || !ms.name) return null;

                            return {
                                skill_id: String(s.skill_id),
                                mentor_skills: {
                                    id: String(ms.id),
                                    name: String(ms.name),
                                    description: ms.description ?? null,
                                },
                            };
                        })
                        .filter((x): x is MentorSkillRelation => x !== null);

                    skillsMap[mentorId] = normalized;
                });

                setMentorSkills(skillsMap);

            }
        } catch (error) {
            console.error('Error loading mentors:', error);
            showNotification('error', 'Không thể tải danh sách mentor');
            setMentors([]);
        }
    };

    const loadUserBookings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('mentor_bookings')
                .select(`
                    *,
                    mentors (
                        id,
                        full_name,
                        avatar,
                        headline
                    ),
                    mentor_reviews!left (
                        id
                    )
                `)
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Add has_review flag
            const bookingsWithReview = data?.map(booking => ({
                ...booking,
                has_review: booking.mentor_reviews && booking.mentor_reviews.length > 0
            })) || [];

            setBookings(bookingsWithReview);
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
                .from('mentor_bookings')
                .select('*')
                .eq('id', bookingId)
                .eq('user_id', user?.id)
                .single();

            if (error) throw error;

            if (data) {
                setEditingBooking(data);
                setFormData({
                    mentor_id: data.mentor_id || '',
                    selectedSkills: [], // Skills are not stored in the current structure, would need separate handling
                    otherSkills: '',
                    session_type: data.session_type || 'online',
                    scheduled_date: data.scheduled_date ?
                        new Date(data.scheduled_date).toISOString().slice(0, 16) : '',
                    duration: data.duration || 60,
                    contact_email: data.contact_email || '',
                    contact_phone: data.contact_phone || '',
                    user_notes: data.user_notes || ''
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
                return true; // Notes are optional
            case 6:
                return true; // Final confirmation
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

            const bookingData = {
                user_id: user?.id,
                mentor_id: formData.mentor_id,
                scheduled_date: new Date(formData.scheduled_date).toISOString(),
                duration: formData.duration,
                session_type: formData.session_type,
                contact_email: formData.contact_email,
                contact_phone: formData.contact_phone || null,
                user_notes: `${formData.selectedSkills.length > 0 ? 'Kỹ năng: ' + formData.selectedSkills.join(', ') : ''}${formData.otherSkills ? (formData.selectedSkills.length > 0 ? '; ' : '') + 'Kỹ năng khác: ' + formData.otherSkills : ''}${formData.user_notes ? '; Ghi chú: ' + formData.user_notes : ''}`,
                status: 'pending'
            };

            if (editingBooking) {
                const { error } = await supabase
                    .from('mentor_bookings')
                    .update(bookingData)
                    .eq('id', editingBooking.id)
                    .eq('user_id', user?.id);

                if (error) throw error;
                showNotification('success', 'Đã cập nhật đặt lịch thành công');
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

        // Xóa cả edit param và mentor param từ URL
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

    // Review functions
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

        try {
            setSubmitting(true);

            const { error } = await supabase
                .from('mentor_reviews')
                .insert([{
                    booking_id: reviewingBooking.id,
                    user_id: user?.id,
                    mentor_id: reviewingBooking.mentor_id,
                    rating: reviewData.rating,
                    comment: reviewData.comment || null,
                    is_published: reviewData.is_published
                }]);

            if (error) throw error;

            showNotification('success', 'Đánh giá đã được gửi thành công');
            setShowReviewModal(false);
            loadUserBookings(); // Reload để cập nhật has_review
        } catch (error) {
            console.error('Error submitting review:', error);
            showNotification('error', 'Lỗi khi gửi đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    // Filter and paginate mentors
    const filteredMentors = mentors.filter(mentor =>
        mentor.full_name.toLowerCase().includes(searchMentor.toLowerCase()) ||
        mentor.headline?.toLowerCase().includes(searchMentor.toLowerCase())
    );

    const totalMentorPages = Math.ceil(filteredMentors.length / MENTORS_PER_PAGE);
    const startIndex = (mentorPage - 1) * MENTORS_PER_PAGE;
    const paginatedMentors = filteredMentors.slice(startIndex, startIndex + MENTORS_PER_PAGE);

    // Get selected mentor
    const selectedMentor = mentors.find(m => m.id === formData.mentor_id);
    const selectedMentorSkills = mentorSkills[formData.mentor_id] || [];

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


    useEffect(() => {
        if (showForm) {
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
    }, [showForm]);

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Select Mentor
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn Mentor</h3>

                            {/* Search */}
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

                            {/* Mentor Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                {paginatedMentors.map((mentor) => (
                                    <div
                                        key={mentor.id}
                                        onClick={() => handleInputChange('mentor_id', mentor.id)}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                            formData.mentor_id === mentor.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {mentor.avatar ? (
                                                <Image
                                                    src={mentor.avatar}
                                                    alt={mentor.full_name}
                                                    width={60}
                                                    height={60}
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-15 h-15 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <User className="w-8 h-8 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">{mentor.full_name}</h4>
                                                {mentor.headline && (
                                                    <p className="text-sm text-gray-600 mb-2">{mentor.headline}</p>
                                                )}
                                                {mentor.description && (
                                                    <p className="text-sm text-gray-500 line-clamp-2">{mentor.description}</p>
                                                )}

                                                {/* Skills preview */}
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

                            {/* Pagination */}
                            {totalMentorPages > 1 && (
                                <div className="flex justify-center items-center gap-4 mt-4">
                                    <button
                                        onClick={() => setMentorPage(p => Math.max(1, p - 1))}
                                        disabled={mentorPage === 1}
                                        className="px-3 py-1 border rounded disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        {mentorPage} / {totalMentorPages}
                                    </span>
                                    <button
                                        onClick={() => setMentorPage(p => Math.min(totalMentorPages, p + 1))}
                                        disabled={mentorPage === totalMentorPages}
                                        className="px-3 py-1 border rounded disabled:opacity-50"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 2: // Select Skills
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn Kỹ năng</h3>

                            {selectedMentor && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        Mentor đã chọn: <span className="font-semibold">{selectedMentor.full_name}</span>
                                    </p>
                                </div>
                            )}

                            {/* Mentor Skills */}
                            {selectedMentorSkills.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-medium text-gray-900 mb-3">Kỹ năng của mentor</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                                        formData.selectedSkills.includes(skillRel.mentor_skills.name)
                                                            ? 'border-blue-500 bg-blue-500'
                                                            : 'border-gray-300'
                                                    }`}>
                                                        {formData.selectedSkills.includes(skillRel.mentor_skills.name) && (
                                                            <Check className="w-3 h-3 text-white" />
                                                        )}
                                                    </div>
                                                    <span className="font-medium">{skillRel.mentor_skills.name}</span>
                                                </div>
                                                {skillRel.mentor_skills.description && (
                                                    <p className="text-sm text-gray-600 mt-1 ml-6">
                                                        {skillRel.mentor_skills.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Other Skills */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Kỹ năng khác (tùy chọn)</h4>
                                <textarea
                                    value={formData.otherSkills}
                                    onChange={(e) => handleInputChange('otherSkills', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập kỹ năng khác bạn muốn học (cách nhau bằng dấu phẩy)..."
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    VD: Phỏng vấn, Xây dựng CV, Lập kế hoạch nghề nghiệp
                                </p>
                            </div>

                            {/* Selected Skills Summary */}
                            {(formData.selectedSkills.length > 0 || formData.otherSkills) && (
                                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                    <h5 className="font-medium text-green-800 mb-2">Kỹ năng đã chọn:</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.selectedSkills.map((skill, index) => (
                                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                                {skill}
                                            </span>
                                        ))}
                                        {formData.otherSkills && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                                Khác: {formData.otherSkills}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 3: // Session Type & Time
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hình thức và Thời gian</h3>

                            {/* Session Type */}
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-900 mb-3">Hình thức tư vấn</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`p-2 rounded-lg ${
                                                    formData.session_type === type.value
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {type.icon}
                                                </div>
                                                <span className="font-semibold">{type.label}</span>
                                            </div>
                                            <p className="text-sm text-gray-600">{type.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ngày và giờ mong muốn *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduled_date}
                                        onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Thời lượng (phút) *
                                    </label>
                                    <select
                                        value={formData.duration}
                                        onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={30}>30 phút</option>
                                        <option value={60}>60 phút</option>
                                        <option value={90}>90 phút</option>
                                        <option value={120}>120 phút</option>
                                    </select>
                                </div>
                            </div>

                            {/* Quick Duration Buttons */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-sm text-gray-600 mr-2">Thời lượng phổ biến:</span>
                                {[30, 60, 90, 120].map((duration) => (
                                    <button
                                        key={duration}
                                        type="button"
                                        onClick={() => handleInputChange('duration', duration)}
                                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
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
                    </div>
                );

            case 4: // Contact Information
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin liên hệ</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email liên hệ *
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.contact_email}
                                        onChange={(e) => handleInputChange('contact_email', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="0123456789"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Số điện thoại để liên lạc nhanh hơn (nếu cần)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 5: // Notes
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ghi chú thêm</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi chú cho mentor (tùy chọn)
                                </label>
                                <textarea
                                    value={formData.user_notes}
                                    onChange={(e) => handleInputChange('user_notes', e.target.value)}
                                    rows={5}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Chia sẻ thêm về mục tiêu, tình huống cụ thể bạn cần tư vấn, hoặc bất kỳ thông tin nào giúp mentor chuẩn bị tốt hơn cho buổi tư vấn..."
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Thông tin này sẽ giúp mentor hiểu rõ hơn về nhu cầu của bạn và chuẩn bị tốt hơn cho buổi tư vấn.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 6: // Confirmation
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận đặt lịch</h3>

                            {/* Summary */}
                            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                                <div className="flex items-start gap-4">
                                    {selectedMentor?.avatar ? (
                                        <Image
                                            src={selectedMentor.avatar}
                                            alt={selectedMentor.full_name}
                                            width={60}
                                            height={60}
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-15 h-15 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{selectedMentor?.full_name}</h4>
                                        {selectedMentor?.headline && (
                                            <p className="text-sm text-gray-600">{selectedMentor.headline}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>
                                            <strong>Thời gian:</strong> {formData.scheduled_date ?
                                            new Date(formData.scheduled_date).toLocaleString('vi-VN') :
                                            'Chưa chọn'
                                        }
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span><strong>Thời lượng:</strong> {formData.duration} phút</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {formData.session_type === 'online' && <Video className="w-4 h-4 text-gray-400" />}
                                        {formData.session_type === 'offline' && <Coffee className="w-4 h-4 text-gray-400" />}
                                        {formData.session_type === 'hybrid' && <MapPin className="w-4 h-4 text-gray-400" />}
                                        <span>
                                            <strong>Hình thức:</strong> {
                                            formData.session_type === 'online' ? 'Online' :
                                                formData.session_type === 'offline' ? 'Offline' : 'Hybrid'
                                        }
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span><strong>Email:</strong> {formData.contact_email}</span>
                                    </div>
                                    {formData.contact_phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span><strong>SĐT:</strong> {formData.contact_phone}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Skills */}
                                {(formData.selectedSkills.length > 0 || formData.otherSkills) && (
                                    <div>
                                        <strong className="text-sm text-gray-700">Kỹ năng muốn học:</strong>
                                        <div className="flex flex-wrap gap-2 mt-2">
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

                                {/* Notes */}
                                {formData.user_notes && (
                                    <div>
                                        <strong className="text-sm text-gray-700">Ghi chú:</strong>
                                        <p className="text-sm text-gray-600 mt-1 bg-white p-3 rounded border">
                                            {formData.user_notes}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-yellow-800 mb-1">Lưu ý quan trọng:</p>
                                        <ul className="text-yellow-700 space-y-1 list-disc list-inside">
                                            <li>Đây chỉ là yêu cầu đặt lịch, mentor sẽ xác nhận sau</li>
                                            <li>Bạn sẽ nhận được thông báo qua email khi có phản hồi</li>
                                            <li>Có thể mentor sẽ đề xuất thay đổi thời gian phù hợp hơn</li>
                                            <li>Vui lòng kiểm tra email thường xuyên</li>
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
                    subtitle="Đăng ký lịch tư vấn 1-1 với các mentor chuyên nghiệp"
                />

                {/* Action Buttons */}
                <div className="mb-6 sm:mb-8">
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
                                                <div className="flex items-center gap-3">
                                                    {booking.mentors?.avatar ? (
                                                        <Image
                                                            src={booking.mentors.avatar}
                                                            alt={booking.mentors.full_name}
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
                                                            {booking.mentors?.full_name || 'Mentor không xác định'}
                                                        </h4>
                                                        {booking.mentors?.headline && (
                                                            <p className="text-sm text-gray-600">{booking.mentors.headline}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                                                    {getStatusIcon(booking.status)}
                                                    {getStatusText(booking.status)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span>
                                                        <strong>Thời gian:</strong> {booking.scheduled_date ?
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
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span><strong>Thời lượng:</strong> {booking.duration} phút</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {booking.session_type === 'online' && <Video className="w-4 h-4 text-gray-400" />}
                                                    {booking.session_type === 'offline' && <Coffee className="w-4 h-4 text-gray-400" />}
                                                    {booking.session_type === 'hybrid' && <MapPin className="w-4 h-4 text-gray-400" />}
                                                    <span>
                                                        <strong>Hình thức:</strong> {
                                                        booking.session_type === 'online' ? 'Online' :
                                                            booking.session_type === 'offline' ? 'Offline' : 'Hybrid'
                                                    }
                                                    </span>
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
                                            </div>

                                            {booking.user_notes && (
                                                <div className="mt-3 text-sm text-gray-600">
                                                    <strong>Ghi chú:</strong> {booking.user_notes}
                                                </div>
                                            )}

                                            {booking.mentor_notes && (
                                                <div className="mt-3 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                                                    <strong>Phản hồi từ mentor:</strong> {booking.mentor_notes}
                                                </div>
                                            )}

                                            {booking.admin_notes && (
                                                <div className="mt-3 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                                                    <strong>Ghi chú từ admin:</strong> {booking.admin_notes}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            {/* Review button - chỉ hiện khi status = completed và chưa có review */}
                                            {booking.status === 'completed' && !booking.has_review && (
                                                <button
                                                    onClick={() => openReviewModal(booking)}
                                                    className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50"
                                                    title="Đánh giá mentor"
                                                >
                                                    <Star className="w-4 h-4" />
                                                </button>
                                            )}

                                            {['pending', 'cancelled'].includes(booking.status) && (
                                                <button
                                                    onClick={() => editBooking(booking)}
                                                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            )}

                                            {['pending', 'cancelled'].includes(booking.status) && (
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

                {/* Multi-step Booking Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={resetForm}
                        />

                        <div className="relative bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between mb-4">
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

                                {/* Progress Steps */}
                                <div className="flex items-center justify-between">
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
                                                <div className={`mt-2 text-xs text-center max-w-16 ${
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

                            {/* Content */}
                            <div className="p-6 min-h-[400px]">
                                {renderStepContent()}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-gray-200">
                                <div className="flex justify-between">
                                    <div>
                                        {currentStep > 1 && (
                                            <Button
                                                variant="outline"
                                                onClick={prevStep}
                                                className="flex items-center gap-2"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Quay lại
                                            </Button>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={resetForm}
                                            disabled={submitting}
                                        >
                                            Hủy
                                        </Button>

                                        {currentStep < 6 ? (
                                            <Button
                                                onClick={nextStep}
                                                disabled={!validateStep(currentStep)}
                                                className="flex items-center gap-2"
                                            >
                                                Tiếp tục
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={submitBooking}
                                                disabled={submitting || !validateStep(6)}
                                                className="flex items-center gap-2"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Đang gửi...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        {editingBooking ? 'Cập nhật đặt lịch' : 'Gửi đặt lịch'}
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

                {/* Review Modal */}
                {showReviewModal && reviewingBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={() => setShowReviewModal(false)}
                        />

                        <div className="relative bg-white rounded-xl max-w-md w-full">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Đánh giá Mentor</h3>
                                    <button
                                        onClick={() => setShowReviewModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Mentor Info */}
                                <div className="flex items-center gap-3">
                                    {reviewingBooking.mentors?.avatar ? (
                                        <Image
                                            src={reviewingBooking.mentors.avatar}
                                            alt={reviewingBooking.mentors.full_name}
                                            width={50}
                                            height={50}
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-semibold">{reviewingBooking.mentors?.full_name}</h4>
                                        <p className="text-sm text-gray-600">
                                            {reviewingBooking.scheduled_date && new Date(reviewingBooking.scheduled_date).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>

                                {/* Rating */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Đánh giá chất lượng tư vấn *
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                                                className={`text-2xl transition-colors ${
                                                    star <= reviewData.rating
                                                        ? 'text-yellow-400 hover:text-yellow-500'
                                                        : 'text-gray-300 hover:text-yellow-300'
                                                }`}
                                            >
                                                <Star className={`w-8 h-8 ${star <= reviewData.rating ? 'fill-current' : ''}`} />
                                            </button>
                                        ))}
                                        <span className="ml-3 text-sm text-gray-600">
                                            {reviewData.rating > 0 ? `${reviewData.rating}/5 sao` : 'Chọn số sao'}
                                        </span>
                                    </div>

                                    {/* Rating labels */}
                                    <div className="mt-2 text-sm text-gray-500">
                                        {reviewData.rating === 1 && "Rất không hài lòng"}
                                        {reviewData.rating === 2 && "Không hài lòng"}
                                        {reviewData.rating === 3 && "Bình thường"}
                                        {reviewData.rating === 4 && "Hài lòng"}
                                        {reviewData.rating === 5 && "Rất hài lòng"}
                                    </div>
                                </div>

                                {/* Comment */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nhận xét (tùy chọn)
                                    </label>
                                    <textarea
                                        value={reviewData.comment}
                                        onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Chia sẻ cảm nhận về buổi tư vấn: mentor có hữu ích không? Những điểm tốt và cần cải thiện?"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Nhận xét của bạn sẽ giúp mentor cải thiện chất lượng tư vấn
                                    </p>
                                </div>

                                {/* Publish option */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="publish_review"
                                        checked={reviewData.is_published}
                                        onChange={(e) => setReviewData(prev => ({ ...prev, is_published: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="publish_review" className="text-sm text-gray-700">
                                        Công khai đánh giá (giúp người khác tham khảo khi chọn mentor)
                                    </label>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowReviewModal(false)}
                                    disabled={submitting}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={submitReview}
                                    disabled={submitting || reviewData.rating === 0}
                                    className="flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Đang gửi...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Gửi đánh giá
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