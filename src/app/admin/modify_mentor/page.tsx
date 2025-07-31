'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { SectionHeader } from '@/component/SectionHeader';
import { Button } from '@/component/Button';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Upload,
    X,
    Save,
    User,
    Building,
    GraduationCap,
    Calendar,
    Award,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import Image from 'next/image';

// Interfaces
interface MentorEducation {
    id?: string;
    avatar?: string;
    school: string;
    degree: string;
    start_date: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

interface MentorWorkExperience {
    id?: string;
    avatar?: string;
    company: string;
    position: string;
    start_date: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

interface MentorActivity {
    id?: string;
    avatar?: string;
    organization: string;
    role: string;
    activity_name: string;
    start_date: string;
    end_date?: string;
    description: string[];
    published: boolean;
}

interface Mentor {
    id: string;
    email: string;
    full_name: string;
    avatar?: string;
    headline?: string;
    description?: string;
    skill: string[];
    published: boolean;
    created_at: string;
    updated_at: string;
    mentor_work_experiences?: MentorWorkExperience[];
    mentor_educations?: MentorEducation[];
    mentor_activities?: MentorActivity[];
}

interface MentorFormData {
    email: string;
    full_name: string;
    avatar?: string;
    headline: string;
    description: string;
    skill: string[];
    published: boolean;
    work_experiences: MentorWorkExperience[];
    educations: MentorEducation[];
    activities: MentorActivity[];
}

const ManagerMentor: React.FC = () => {
    const { user } = useAuthStore();
    const supabase = createClient();

    // State management
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
    const [expandedMentor, setExpandedMentor] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState<MentorFormData>({
        email: '',
        full_name: '',
        avatar: '',
        headline: '',
        description: '',
        skill: [],
        published: false,
        work_experiences: [],
        educations: [],
        activities: []
    });

    const [uploading, setUploading] = useState(false);
    const [uploadingStates, setUploadingStates] = useState<{[key: string]: boolean}>({});

    // Load mentors
    const loadMentors = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('mentors')
                .select(`
                    *,
                    mentor_work_experiences (*),
                    mentor_educations (*),
                    mentor_activities (*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMentors(data || []);
        } catch (error) {
            console.error('Error loading mentors:', error);
        } finally {
            setLoading(false);
        }
    };

    // Upload image
    const uploadImage = async (file: File, uploadKey?: string): Promise<string> => {
        if (uploadKey) {
            setUploadingStates(prev => ({ ...prev, [uploadKey]: true }));
        }

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
            const filePath = `mentors/${fileName}`;

            const { data, error } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } finally {
            if (uploadKey) {
                setUploadingStates(prev => ({ ...prev, [uploadKey]: false }));
            }
        }
    };

    // Save mentor
    const saveMentor = async () => {
        if (!user) return;

        try {
            setUploading(true);

            const mentorData = {
                email: formData.email,
                full_name: formData.full_name,
                avatar: formData.avatar || null,
                headline: formData.headline || null,
                description: formData.description || null,
                skill: formData.skill,
                published: formData.published
            };

            let mentorId: string;

            if (editingMentor) {
                // Update existing mentor
                const { error } = await supabase
                    .from('mentors')
                    .update(mentorData)
                    .eq('id', editingMentor.id);

                if (error) throw error;
                mentorId = editingMentor.id;
            } else {
                // Create new mentor
                const { data, error } = await supabase
                    .from('mentors')
                    .insert([mentorData])
                    .select('id')
                    .single();

                if (error) throw error;
                mentorId = data.id;
            }

            // Save work experiences
            if (editingMentor) {
                // Delete existing work experiences
                await supabase
                    .from('mentor_work_experiences')
                    .delete()
                    .eq('mentor_id', mentorId);
            }

            if (formData.work_experiences.length > 0) {
                const workExperiencesData = formData.work_experiences.map(exp => ({
                    ...exp,
                    mentor_id: mentorId
                }));

                const { error } = await supabase
                    .from('mentor_work_experiences')
                    .insert(workExperiencesData);

                if (error) throw error;
            }

            // Save educations
            if (editingMentor) {
                await supabase
                    .from('mentor_educations')
                    .delete()
                    .eq('mentor_id', mentorId);
            }

            if (formData.educations.length > 0) {
                const educationsData = formData.educations.map(edu => ({
                    ...edu,
                    mentor_id: mentorId
                }));

                const { error } = await supabase
                    .from('mentor_educations')
                    .insert(educationsData);

                if (error) throw error;
            }

            // Save activities
            if (editingMentor) {
                await supabase
                    .from('mentor_activities')
                    .delete()
                    .eq('mentor_id', mentorId);
            }

            if (formData.activities.length > 0) {
                const activitiesData = formData.activities.map(act => ({
                    ...act,
                    mentor_id: mentorId
                }));

                const { error } = await supabase
                    .from('mentor_activities')
                    .insert(activitiesData);

                if (error) throw error;
            }

            resetForm();
            loadMentors();

        } catch (error) {
            console.error('Error saving mentor:', error);
            alert('Lỗi khi lưu mentor');
        } finally {
            setUploading(false);
        }
    };

    // Delete mentor
    const deleteMentor = async (mentorId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa mentor này?')) return;

        try {
            const { error } = await supabase
                .from('mentors')
                .delete()
                .eq('id', mentorId);

            if (error) throw error;
            loadMentors();
        } catch (error) {
            console.error('Error deleting mentor:', error);
            alert('Lỗi khi xóa mentor');
        }
    };

    // Toggle publish status
    const togglePublishStatus = async (mentorId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('mentors')
                .update({ published: !currentStatus })
                .eq('id', mentorId);

            if (error) throw error;
            loadMentors();
        } catch (error) {
            console.error('Error updating publish status:', error);
        }
    };

    // Edit mentor
    const editMentor = (mentor: Mentor) => {
        setEditingMentor(mentor);
        setFormData({
            email: mentor.email,
            full_name: mentor.full_name,
            avatar: mentor.avatar || '',
            headline: mentor.headline || '',
            description: mentor.description || '',
            skill: mentor.skill || [],
            published: mentor.published,
            work_experiences: mentor.mentor_work_experiences || [],
            educations: mentor.mentor_educations || [],
            activities: mentor.mentor_activities || []
        });
        setShowForm(true);
    };

    // Reset form
    const resetForm = () => {
        setShowForm(false);
        setEditingMentor(null);
        setSkillInputValue('');
        setFormData({
            email: '',
            full_name: '',
            avatar: '',
            headline: '',
            description: '',
            skill: [],
            published: false,
            work_experiences: [],
            educations: [],
            activities: []
        });
    };


    // Add new experience/education/activity
    const addWorkExperience = () => {
        setFormData(prev => ({
            ...prev,
            work_experiences: [...prev.work_experiences, {
                company: '',
                position: '',
                start_date: '',
                end_date: '',
                description: [''],
                published: true,
                avatar: ''
            }]
        }));
    };

    const addEducation = () => {
        setFormData(prev => ({
            ...prev,
            educations: [...prev.educations, {
                school: '',
                degree: '',
                start_date: '',
                end_date: '',
                description: [''],
                published: true,
                avatar: ''
            }]
        }));
    };

    const addActivity = () => {
        setFormData(prev => ({
            ...prev,
            activities: [...prev.activities, {
                organization: '',
                role: '',
                activity_name: '',
                start_date: '',
                end_date: '',
                description: [''],
                published: true,
                avatar: ''
            }]
        }));
    };

    // Handle image upload for work experience
    const handleWorkExperienceImageUpload = async (index: number, file: File) => {
        const uploadKey = `work-exp-${index}`;
        try {
            const imageUrl = await uploadImage(file, uploadKey);
            const newExps = [...formData.work_experiences];
            newExps[index].avatar = imageUrl;
            setFormData(prev => ({ ...prev, work_experiences: newExps }));
        } catch (error) {
            console.error('Error uploading work experience image:', error);
            alert('Lỗi khi upload ảnh');
        }
    };

    // Handle image upload for education
    const handleEducationImageUpload = async (index: number, file: File) => {
        const uploadKey = `education-${index}`;
        try {
            const imageUrl = await uploadImage(file, uploadKey);
            const newEdus = [...formData.educations];
            newEdus[index].avatar = imageUrl;
            setFormData(prev => ({ ...prev, educations: newEdus }));
        } catch (error) {
            console.error('Error uploading education image:', error);
            alert('Lỗi khi upload ảnh');
        }
    };

    // Handle image upload for activity
    const handleActivityImageUpload = async (index: number, file: File) => {
        const uploadKey = `activity-${index}`;
        try {
            const imageUrl = await uploadImage(file, uploadKey);
            const newActivities = [...formData.activities];
            newActivities[index].avatar = imageUrl;
            setFormData(prev => ({ ...prev, activities: newActivities }));
        } catch (error) {
            console.error('Error uploading activity image:', error);
            alert('Lỗi khi upload ảnh');
        }
    };

    // Filter mentors
    const filteredMentors = mentors.filter(mentor => {
        const matchesSearch = mentor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mentor.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPublished =
            filterPublished === 'all' ||
            (filterPublished === 'published' && mentor.published) ||
            (filterPublished === 'draft' && !mentor.published);

        return matchesSearch && matchesPublished;
    });

    // Effects
    useEffect(() => {
        loadMentors();
    }, []);

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Không có quyền truy cập</h2>
                    <p className="text-gray-600">Bạn cần quyền admin để truy cập trang này.</p>
                </div>
            </div>
        );
    }

    // Skill Input
    const [skillInputValue, setSkillInputValue] = useState('');

    useEffect(() => {
        if (editingMentor) {
            // Sync skill input value
            const skillString = editingMentor.skill
                ? (Array.isArray(editingMentor.skill)
                    ? editingMentor.skill.join(', ')
                    : editingMentor.skill.toString())
                : '';
            setSkillInputValue(skillString);

            // Set form data
            setFormData({
                email: editingMentor.email,
                full_name: editingMentor.full_name,
                avatar: editingMentor.avatar || '',
                headline: editingMentor.headline || '',
                description: editingMentor.description || '',
                skill: editingMentor.skill || [],
                published: editingMentor.published,
                work_experiences: editingMentor.mentor_work_experiences || [],
                educations: editingMentor.mentor_educations || [],
                activities: editingMentor.mentor_activities || []
            });
            setShowForm(true);
        } else {
            // Reset skill input khi không edit
            setSkillInputValue('');
        }
    }, [editingMentor]);


    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <SectionHeader
                    title="QUẢN LÝ MENTOR"
                    subtitle="Tạo và quản lý thông tin mentor"
                />

                {/* Controls */}
                <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm mentor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-4">
                            <select
                                value={filterPublished}
                                onChange={(e) => setFilterPublished(e.target.value as typeof filterPublished)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="published">Đã xuất bản</option>
                                <option value="draft">Bản nháp</option>
                            </select>
                        </div>

                        {/* New Mentor Button */}
                        <Button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Mentor mới
                        </Button>
                    </div>
                </div>

                {/* Mentor Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">
                                        {editingMentor ? 'Chỉnh sửa mentor' : 'Tạo mentor mới'}
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
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Họ và tên *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tiêu đề chuyên môn
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.headline}
                                        onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="VD: HR Manager tại VinGroup"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mô tả
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Mô tả về mentor..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Avatar
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    try {
                                                        setUploading(true);
                                                        const imageUrl = await uploadImage(file);
                                                        setFormData(prev => ({ ...prev, avatar: imageUrl }));
                                                    } catch (error) {
                                                        console.error('Error uploading image:', error);
                                                        alert('Lỗi khi upload ảnh');
                                                    } finally {
                                                        setUploading(false);
                                                    }
                                                }
                                            }}
                                            className="hidden"
                                            id="avatar-upload"
                                        />
                                        <label
                                            htmlFor="avatar-upload"
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Chọn ảnh
                                        </label>
                                        {formData.avatar && (
                                            <div className="relative w-16 h-16">
                                                <Image
                                                    src={formData.avatar}
                                                    alt="Avatar preview"
                                                    fill
                                                    className="object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Skill Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Kỹ năng (nhập từng kỹ năng, cách nhau bởi dấu phẩy)
                                    </label>
                                    <input
                                        type="text"
                                        value={skillInputValue}
                                        onChange={(e) => {
                                            setSkillInputValue(e.target.value);
                                        }}
                                        onBlur={() => {
                                            const skills = skillInputValue
                                                .split(',')
                                                .map(s => s.trim())
                                                .filter(s => s.length > 0);

                                            setFormData(prev => ({
                                                ...prev,
                                                skill: skills
                                            }));
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="VD: Tuyển dụng, Quản trị nhân sự, Văn hóa doanh nghiệp"
                                    />

                                    {formData.skill && formData.skill.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-600 mb-1">Kỹ năng đã lưu:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(Array.isArray(formData.skill) ? formData.skill : [formData.skill]).map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <p className="mt-1 text-xs text-gray-500">
                                        Click ra ngoài để lưu kỹ năng
                                    </p>
                                </div>

                                {/* Work Experiences */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold">Kinh nghiệm làm việc</h4>
                                        <button
                                            type="button"
                                            onClick={addWorkExperience}
                                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                        >
                                            Thêm kinh nghiệm
                                        </button>
                                    </div>
                                    {formData.work_experiences.map((exp, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                                            {/* Image Upload for Work Experience */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Ảnh đại diện
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                handleWorkExperienceImageUpload(index, file);
                                                            }
                                                        }}
                                                        className="hidden"
                                                        id={`work-exp-image-${index}`}
                                                    />
                                                    <label
                                                        htmlFor={`work-exp-image-${index}`}
                                                        className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                                                    >
                                                        {uploadingStates[`work-exp-${index}`] ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                                        ) : (
                                                            <Upload className="w-4 h-4" />
                                                        )}
                                                        Chọn ảnh
                                                    </label>
                                                    {exp.avatar && (
                                                        <div className="relative w-12 h-12">
                                                            <Image
                                                                src={exp.avatar}
                                                                alt="Work experience preview"
                                                                fill
                                                                className="object-cover rounded-lg"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newExps = [...formData.work_experiences];
                                                                    newExps[index].avatar = '';
                                                                    setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                                }}
                                                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <input
                                                    type="text"
                                                    placeholder="Công ty"
                                                    value={exp.company}
                                                    onChange={(e) => {
                                                        const newExps = [...formData.work_experiences];
                                                        newExps[index].company = e.target.value;
                                                        setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Vị trí"
                                                    value={exp.position}
                                                    onChange={(e) => {
                                                        const newExps = [...formData.work_experiences];
                                                        newExps[index].position = e.target.value;
                                                        setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <input
                                                    type="date"
                                                    placeholder="Ngày bắt đầu"
                                                    value={exp.start_date}
                                                    onChange={(e) => {
                                                        const newExps = [...formData.work_experiences];
                                                        newExps[index].start_date = e.target.value;
                                                        setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <input
                                                    type="date"
                                                    placeholder="Ngày kết thúc"
                                                    value={exp.end_date || ''}
                                                    onChange={(e) => {
                                                        const newExps = [...formData.work_experiences];
                                                        newExps[index].end_date = e.target.value;
                                                        setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Mô tả công việc (mỗi dòng một mô tả)
                                                </label>
                                                <textarea
                                                    placeholder="Nhập mô tả công việc, mỗi dòng một mô tả"
                                                    value={exp.description.join('\n')}
                                                    onChange={(e) => {
                                                        const newExps = [...formData.work_experiences];
                                                        newExps[index].description = e.target.value.split('\n').filter(d => d.trim());
                                                        setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                    }}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`work-exp-published-${index}`}
                                                        checked={exp.published}
                                                        onChange={(e) => {
                                                            const newExps = [...formData.work_experiences];
                                                            newExps[index].published = e.target.checked;
                                                            setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                        }}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                    <label htmlFor={`work-exp-published-${index}`} className="text-sm text-gray-700">
                                                        Xuất bản
                                                    </label>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newExps = formData.work_experiences.filter((_, i) => i !== index);
                                                        setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                    }}
                                                    className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Educations */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold">Học vấn</h4>
                                        <button
                                            type="button"
                                            onClick={addEducation}
                                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                                        >
                                            Thêm học vấn
                                        </button>
                                    </div>
                                    {formData.educations.map((edu, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                                            {/* Image Upload for Education */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Ảnh đại diện
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                handleEducationImageUpload(index, file);
                                                            }
                                                        }}
                                                        className="hidden"
                                                        id={`education-image-${index}`}
                                                    />
                                                    <label
                                                        htmlFor={`education-image-${index}`}
                                                        className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                                                    >
                                                        {uploadingStates[`education-${index}`] ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                                        ) : (
                                                            <Upload className="w-4 h-4" />
                                                        )}
                                                        Chọn ảnh
                                                    </label>
                                                    {edu.avatar && (
                                                        <div className="relative w-12 h-12">
                                                            <Image
                                                                src={edu.avatar}
                                                                alt="Education preview"
                                                                fill
                                                                className="object-cover rounded-lg"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newEdus = [...formData.educations];
                                                                    newEdus[index].avatar = '';
                                                                    setFormData(prev => ({ ...prev, educations: newEdus }));
                                                                }}
                                                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <input
                                                    type="text"
                                                    placeholder="Trường học"
                                                    value={edu.school}
                                                    onChange={(e) => {
                                                        const newEdus = [...formData.educations];
                                                        newEdus[index].school = e.target.value;
                                                        setFormData(prev => ({ ...prev, educations: newEdus }));
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Bằng cấp"
                                                    value={edu.degree}
                                                    onChange={(e) => {
                                                        const newEdus = [...formData.educations];
                                                        newEdus[index].degree = e.target.value;
                                                        setFormData(prev => ({ ...prev, educations: newEdus }));
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <input
                                                    type="date"
                                                    placeholder="Ngày bắt đầu"
                                                    value={edu.start_date}
                                                    onChange={(e) => {
                                                        const newEdus = [...formData.educations];
                                                        newEdus[index].start_date = e.target.value;
                                                        setFormData(prev => ({ ...prev, educations: newEdus }));
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <input
                                                    type="date"
                                                    placeholder="Ngày kết thúc"
                                                    value={edu.end_date || ''}
                                                    onChange={(e) => {
                                                        const newEdus = [...formData.educations];
                                                        newEdus[index].end_date = e.target.value;
                                                        setFormData(prev => ({ ...prev, educations: newEdus }));
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Mô tả học tập (mỗi dòng một mô tả)
                                                </label>
                                                <textarea
                                                    placeholder="Nhập mô tả quá trình học tập, mỗi dòng một mô tả"
                                                    value={edu.description.join('\n')}
                                                    onChange={(e) => {
                                                        const newEdus = [...formData.educations];
                                                        newEdus[index].description = e.target.value.split('\n').filter(d => d.trim());
                                                        setFormData(prev => ({ ...prev, educations: newEdus }));
                                                    }}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`education-published-${index}`}
                                                        checked={edu.published}
                                                        onChange={(e) => {
                                                            const newEdus = [...formData.educations];
                                                            newEdus[index].published = e.target.checked;
                                                            setFormData(prev => ({ ...prev, educations: newEdus }));
                                                        }}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                    <label htmlFor={`education-published-${index}`} className="text-sm text-gray-700">
                                                        Xuất bản
                                                    </label>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newEdus = formData.educations.filter((_, i) => i !== index);
                                                        setFormData(prev => ({ ...prev, educations: newEdus }));
                                                    }}
                                                    className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Activities */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold">Hoạt động</h4>
                                        <button
                                            type="button"
                                            onClick={addActivity}
                                            className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                                        >
                                            Thêm hoạt động
                                        </button>
                                    </div>
                                    {formData.activities.map((activity, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                                            {/* Image Upload for Activity */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Ảnh đại diện
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                handleActivityImageUpload(index, file);
                                                            }
                                                        }}
                                                        className="hidden"
                                                        id={`activity-image-${index}`}
                                                    />
                                                    <label
                                                        htmlFor={`activity-image-${index}`}
                                                        className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                                                    >
                                                        {uploadingStates[`activity-${index}`] ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                                        ) : (
                                                            <Upload className="w-4 h-4" />
                                                        )}
                                                        Chọn ảnh
                                                    </label>
                                                    {activity.avatar && (
                                                        <div className="relative w-12 h-12">
                                                            <Image
                                                                src={activity.avatar}
                                                                alt="Activity preview"
                                                                fill
                                                                className="object-cover rounded-lg"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newActivities = [...formData.activities];
                                                                    newActivities[index].avatar = '';
                                                                    setFormData(prev => ({ ...prev, activities: newActivities }));
                                                                }}
                                                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <input
                                                    type="text"
                                                    placeholder="Tên hoạt động"
                                                    value={activity.activity_name}
                                                    onChange={(e) => {
                                                        const newActivities = [...formData.activities];
                                                        newActivities[index].activity_name = e.target.value;
                                                        setFormData(prev => ({ ...prev, activities: newActivities }));
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Tổ chức"
                                                    value={activity.organization}
                                                    onChange={(e) => {
                                                        const newActivities = [...formData.activities];
                                                        newActivities[index].organization = e.target.value;
                                                        setFormData(prev => ({ ...prev, activities: newActivities }));
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Vai trò"
                                                    value={activity.role}
                                                    onChange={(e) => {
                                                        const newActivities = [...formData.activities];
                                                        newActivities[index].role = e.target.value;
                                                        setFormData(prev => ({ ...prev, activities: newActivities }));
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <div></div>
                                                <input
                                                    type="date"
                                                    placeholder="Ngày bắt đầu"
                                                    value={activity.start_date}
                                                    onChange={(e) => {
                                                        const newActivities = [...formData.activities];
                                                        newActivities[index].start_date = e.target.value;
                                                        setFormData(prev => ({ ...prev, activities: newActivities }));
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <input
                                                    type="date"
                                                    placeholder="Ngày kết thúc"
                                                    value={activity.end_date || ''}
                                                    onChange={(e) => {
                                                        const newActivities = [...formData.activities];
                                                        newActivities[index].end_date = e.target.value;
                                                        setFormData(prev => ({ ...prev, activities: newActivities }));
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Mô tả hoạt động (mỗi dòng một mô tả)
                                                </label>
                                                <textarea
                                                    placeholder="Nhập mô tả hoạt động, mỗi dòng một mô tả"
                                                    value={activity.description.join('\n')}
                                                    onChange={(e) => {
                                                        const newActivities = [...formData.activities];
                                                        newActivities[index].description = e.target.value.split('\n').filter(d => d.trim());
                                                        setFormData(prev => ({ ...prev, activities: newActivities }));
                                                    }}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`activity-published-${index}`}
                                                        checked={activity.published}
                                                        onChange={(e) => {
                                                            const newActivities = [...formData.activities];
                                                            newActivities[index].published = e.target.checked;
                                                            setFormData(prev => ({ ...prev, activities: newActivities }));
                                                        }}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                    <label htmlFor={`activity-published-${index}`} className="text-sm text-gray-700">
                                                        Xuất bản
                                                    </label>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newActivities = formData.activities.filter((_, i) => i !== index);
                                                        setFormData(prev => ({ ...prev, activities: newActivities }));
                                                    }}
                                                    className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Publish Status */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="published"
                                        checked={formData.published}
                                        onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="published" className="text-sm font-medium text-gray-700">
                                        Xuất bản mentor
                                    </label>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={resetForm}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={saveMentor}
                                    disabled={uploading || !formData.full_name.trim() || !formData.email.trim()}
                                    className="flex items-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {editingMentor ? 'Cập nhật' : 'Tạo mentor'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mentors List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Đang tải...</p>
                        </div>
                    ) : filteredMentors.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-600">Không có mentor nào.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredMentors.map((mentor) => (
                                <div key={mentor.id} className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            {mentor.avatar ? (
                                                <Image
                                                    src={mentor.avatar}
                                                    alt={mentor.full_name}
                                                    width={64}
                                                    height={64}
                                                    className="rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <User className="w-8 h-8 text-gray-400" />
                                                </div>
                                            )}

                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {mentor.full_name}
                                                </h3>
                                                <p className="text-gray-600 text-sm">{mentor.email}</p>
                                                {mentor.headline && (
                                                    <p className="text-blue-600 text-sm font-medium mt-1">
                                                        {mentor.headline}
                                                    </p>
                                                )}
                                                {mentor.skill && mentor.skill.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {mentor.skill.slice(0, 3).map((skill, index) => (
                                                            <span
                                                                key={index}
                                                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                        {mentor.skill.length > 3 && (
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                +{mentor.skill.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => togglePublishStatus(mentor.id, mentor.published)}
                                                className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                                    mentor.published
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                }`}
                                            >
                                                {mentor.published ? (
                                                    <>
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        Đã xuất bản
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeOff className="w-3 h-3 mr-1" />
                                                        Bản nháp
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => setExpandedMentor(
                                                    expandedMentor === mentor.id ? null : mentor.id
                                                )}
                                                className="text-gray-600 hover:text-blue-600"
                                            >
                                                {expandedMentor === mentor.id ? (
                                                    <ChevronUp className="w-5 h-5" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5" />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => editMentor(mentor)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => deleteMentor(mentor.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedMentor === mentor.id && (
                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            {mentor.description && (
                                                <div className="mb-6">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Mô tả</h4>
                                                    <p className="text-gray-600 text-sm leading-relaxed">
                                                        {mentor.description}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Work Experiences */}
                                            {mentor.mentor_work_experiences && mentor.mentor_work_experiences.length > 0 && (
                                                <div className="mb-6">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                        <Building className="w-4 h-4" />
                                                        Kinh nghiệm làm việc
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {mentor.mentor_work_experiences.map((exp, index) => (
                                                            <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                                                <div className="flex-shrink-0">
                                                                    {exp.avatar ? (
                                                                        <Image
                                                                            src={exp.avatar}
                                                                            alt={exp.company}
                                                                            width={32}
                                                                            height={32}
                                                                            className="rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                            <Building className="w-4 h-4 text-blue-600" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-start justify-between">
                                                                        <div>
                                                                            <h5 className="font-medium text-gray-900 text-sm">
                                                                                {exp.position}
                                                                            </h5>
                                                                            <p className="text-blue-600 text-sm">{exp.company}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                                <Calendar className="w-3 h-3" />
                                                                                {exp.start_date} - {exp.end_date || 'Hiện tại'}
                                                                            </div>
                                                                            {exp.published ? (
                                                                                <Eye className="w-3 h-3 text-green-600" />
                                                                            ) : (
                                                                                <EyeOff className="w-3 h-3 text-gray-400" />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {exp.description && exp.description.length > 0 && (
                                                                        <div className="mt-2">
                                                                            {exp.description.map((desc, descIndex) => (
                                                                                <p key={descIndex} className="text-xs text-gray-600">
                                                                                    • {desc}
                                                                                </p>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Education */}
                                            {mentor.mentor_educations && mentor.mentor_educations.length > 0 && (
                                                <div className="mb-6">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                        <GraduationCap className="w-4 h-4" />
                                                        Học vấn
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {mentor.mentor_educations.map((edu, index) => (
                                                            <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                                                <div className="flex-shrink-0">
                                                                    {edu.avatar ? (
                                                                        <Image
                                                                            src={edu.avatar}
                                                                            alt={edu.school}
                                                                            width={32}
                                                                            height={32}
                                                                            className="rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                                            <GraduationCap className="w-4 h-4 text-green-600" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-start justify-between">
                                                                        <div>
                                                                            <h5 className="font-medium text-gray-900 text-sm">
                                                                                {edu.degree}
                                                                            </h5>
                                                                            <p className="text-green-600 text-sm">{edu.school}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                                <Calendar className="w-3 h-3" />
                                                                                {edu.start_date} - {edu.end_date || 'Hiện tại'}
                                                                            </div>
                                                                            {edu.published ? (
                                                                                <Eye className="w-3 h-3 text-green-600" />
                                                                            ) : (
                                                                                <EyeOff className="w-3 h-3 text-gray-400" />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {edu.description && edu.description.length > 0 && (
                                                                        <div className="mt-2">
                                                                            {edu.description.map((desc, descIndex) => (
                                                                                <p key={descIndex} className="text-xs text-gray-600">
                                                                                    • {desc}
                                                                                </p>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Activities */}
                                            {mentor.mentor_activities && mentor.mentor_activities.length > 0 && (
                                                <div className="mb-6">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                        <Award className="w-4 h-4" />
                                                        Hoạt động
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {mentor.mentor_activities.map((activity, index) => (
                                                            <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                                                <div className="flex-shrink-0">
                                                                    {activity.avatar ? (
                                                                        <Image
                                                                            src={activity.avatar}
                                                                            alt={activity.activity_name}
                                                                            width={32}
                                                                            height={32}
                                                                            className="rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                                            <Award className="w-4 h-4 text-purple-600" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-start justify-between">
                                                                        <div>
                                                                            <h5 className="font-medium text-gray-900 text-sm">
                                                                                {activity.activity_name}
                                                                            </h5>
                                                                            <p className="text-purple-600 text-sm">
                                                                                {activity.role} tại {activity.organization}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                                <Calendar className="w-3 h-3" />
                                                                                {activity.start_date} - {activity.end_date || 'Hiện tại'}
                                                                            </div>
                                                                            {activity.published ? (
                                                                                <Eye className="w-3 h-3 text-green-600" />
                                                                            ) : (
                                                                                <EyeOff className="w-3 h-3 text-gray-400" />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {activity.description && activity.description.length > 0 && (
                                                                        <div className="mt-2">
                                                                            {activity.description.map((desc, descIndex) => (
                                                                                <p key={descIndex} className="text-xs text-gray-600">
                                                                                    • {desc}
                                                                                </p>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-xs text-gray-500 pt-4 border-t border-gray-100">
                                                Tạo: {new Date(mentor.created_at).toLocaleDateString('vi-VN')} |
                                                Cập nhật: {new Date(mentor.updated_at).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerMentor;
