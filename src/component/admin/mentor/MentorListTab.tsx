'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/component/Button';
import Image from 'next/image';

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
    ChevronUp,
    Link,
    Unlink,
    UserCheck,
    AlertTriangle,
    Mail,
    Phone,
    ExternalLink,
    Users,
    RefreshCw
} from 'lucide-react';

 import type {
     Mentor,
     MentorFormData,
     MentorSkill,
     ProfileInfo,
 } from '@/types/mentor_admin';


interface MentorListTabProps {
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    showNotification?: (type: 'success' | 'error' | 'warning', message: string) => void;
}

const MentorListTab: React.FC<MentorListTabProps> = ({
                                                         loading,
                                                         setLoading,
                                                         showNotification = () => {}
                                                     }) => {
    // State management
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [availableSkills, setAvailableSkills] = useState<MentorSkill[]>([]);
    const [availableProfiles, setAvailableProfiles] = useState<ProfileInfo[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
    const [filterConnection, setFilterConnection] = useState<'all' | 'connected' | 'disconnected'>('all');
    const [expandedMentor, setExpandedMentor] = useState<string | null>(null);
    const [showProfileLinkModal, setShowProfileLinkModal] = useState(false);
    const [linkingMentor, setLinkingMentor] = useState<Mentor | null>(null);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [searchedUsers, setSearchedUsers] = useState<ProfileInfo[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [userSearchPage, setUserSearchPage] = useState(1);
    const [hasMoreUsers, setHasMoreUsers] = useState(false);
    const [userSearchDebounce, setUserSearchDebounce] = useState<NodeJS.Timeout | null>(null);

    // Form state
    const [formData, setFormData] = useState<MentorFormData>({
        email: '',
        full_name: '',
        avatar: '',
        headline: '',
        description: '',
        phone_number: '',
        selected_skills: [],
        published: false,
        work_experiences: [],
        educations: [],
        activities: []
    });

    const [uploading, setUploading] = useState(false);
    const [uploadingStates, setUploadingStates] = useState<{[key: string]: boolean}>({});

    // Load available skills
    const loadAvailableSkills = async () => {
        try {
            const { data, error } = await supabase
                .rpc('mentor_admin_get_skills', { published_only: true });

            if (error) throw error;
            setAvailableSkills(data || []);
        } catch (error) {
            console.error('Error loading skills:', error);
            showNotification('error', 'Không thể tải danh sách skills');
        }
    };

    // Load available profiles (not connected to any mentor)
    const loadAvailableProfiles = async () => {
        try {
            // Sử dụng RPC function mới để lấy chỉ users có role 'user'
            const { data: userRoleData, error: usersError } = await supabase
                .rpc('get_user_role_profiles');

            if (usersError) {
                console.warn('RPC function get_user_role_profiles error:', usersError);

                // Fallback: Lấy tất cả profiles nếu RPC không work
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select(`
                        id,
                        full_name,
                        image_url,
                        phone_number,
                        created_at
                    `);

                if (profilesError) throw profilesError;

                const profilesWithBasicInfo = (profilesData || []).map(profile => ({
                    ...profile,
                    auth_email: 'Email không khả dụng',
                    role: 'unknown'
                }));

                setAvailableProfiles(profilesWithBasicInfo);
                showNotification('warning', 'RPC function get_user_role_profiles không hoạt động. Hiển thị tất cả profiles.');
                return;
            }

            // Map to correct format với auth_email
            const profilesWithAuthEmail = (userRoleData ?? []).map(
                (profile: { email?: string } & Record<string, any>) => ({
                    ...profile,
                    auth_email: profile.email ?? ''
                })
            );

            setAvailableProfiles(profilesWithAuthEmail);

            console.log(`Loaded ${profilesWithAuthEmail.length} user-role profiles`);

            if (profilesWithAuthEmail.length === 0) {
                showNotification('error', 'Không có user nào có role "user" để liên kết với mentor');
            }

        } catch (error) {
            console.error('Error loading user profiles:', error);
            showNotification('error', 'Không thể tải danh sách user profiles: ' + (error as Error).message);
        }
    };

    // Load mentors with all related data using RPC
    const loadMentors = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .rpc('mentor_admin_get_mentors', { include_unpublished: true });

            if (error) throw error;

            // Parse JSONB fields to proper types
            const mentorsWithParsedData: Mentor[] = (data || []).map((mentor: any) => ({
                ...mentor,
                mentor_work_experiences: mentor.work_experiences || [],
                mentor_educations: mentor.educations || [],
                mentor_activities: mentor.activities || [],
                skills: mentor.skills || [],
                profile_connection: mentor.profile_connection || null,
                reviews: mentor.reviews || []
            }));

            setMentors(mentorsWithParsedData);
        } catch (error) {
            console.error('Error loading mentors:', error);
            showNotification('error', 'Không thể tải danh sách mentors');
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

    // Link mentor to profile using RPC
    const linkMentorToProfile = async (mentorId: string, profileId: string) => {
        try {
            const { error } = await supabase
                .rpc('mentor_admin_link_profile', {
                    p_mentor_id: mentorId,
                    p_profile_id: profileId
                });

            if (error) throw error;

            showNotification('success', 'Đã liên kết mentor với profile thành công!');
            loadMentors();
            setShowProfileLinkModal(false);
            setLinkingMentor(null);

        } catch (error: any) {
            console.error('Error linking mentor to profile:', error);
            if (error.message?.includes('already linked')) {
                showNotification('warning', 'Profile này đã được liên kết với mentor khác');
            } else {
                showNotification('error', 'Lỗi khi liên kết mentor với profile');
            }
        }
    };

    // Unlink mentor from profile using RPC
    const unlinkMentorFromProfile = async (mentorId: string) => {
        if (!confirm('Bạn có chắc chắn muốn ngắt kết nối mentor này với profile?')) return;

        try {
            const { error } = await supabase
                .rpc('mentor_admin_unlink_profile', {
                    p_mentor_id: mentorId
                });

            if (error) throw error;

            showNotification('success', 'Đã ngắt kết nối mentor với profile thành công!');
            loadMentors();

        } catch (error) {
            console.error('Error unlinking mentor from profile:', error);
            showNotification('error', 'Lỗi khi ngắt kết nối mentor với profile');
        }
    };

    // Save mentor using RPC functions
    const saveMentor = async () => {
        setUploading(true);
        try {
            // Validate
            if (!formData.full_name || !formData.email) {
                showNotification('warning', 'Vui lòng điền đầy đủ Họ tên và Email.');
                return;
            }

            let mentorId: string;

            if (editingMentor) {
                // Update mentor
                const { error: updateError } = await supabase.rpc('mentor_admin_update_mentor', {
                    p_mentor_id: editingMentor.id,
                    p_email: formData.email.trim(),
                    p_full_name: formData.full_name.trim(),
                    p_avatar: formData.avatar?.trim() || null,
                    p_headline: formData.headline?.trim() || null,
                    p_description: formData.description?.trim() || null,
                    p_phone_number: formData.phone_number?.trim() || null,
                    p_published: formData.published
                });

                if (updateError) throw updateError;
                mentorId = editingMentor.id;
            } else {
                // Create mentor
                const { data: newMentorId, error: createError } = await supabase.rpc('mentor_admin_create_mentor', {
                    p_email: formData.email.trim(),
                    p_full_name: formData.full_name.trim(),
                    p_avatar: formData.avatar?.trim() || null,
                    p_headline: formData.headline?.trim() || null,
                    p_description: formData.description?.trim() || null,
                    p_phone_number: formData.phone_number?.trim() || null,
                    p_published: formData.published
                });

                if (createError) throw createError;
                mentorId = newMentorId;
            }

            // Save skills
            const { error: skillsError } = await supabase.rpc('mentor_admin_save_skills', {
                p_mentor_id: mentorId,
                p_skill_ids: formData.selected_skills
            });
            if (skillsError) throw skillsError;

            // Save work experiences
            const { error: expError } = await supabase.rpc('mentor_admin_save_experiences', {
                p_mentor_id: mentorId,
                p_experiences: formData.work_experiences.map(exp => ({
                    avatar: exp.avatar?.trim() || null,
                    company: exp.company?.trim() || '',
                    position: exp.position?.trim() || '',
                    start_date: exp.start_date?.trim() || null,
                    end_date: exp.end_date?.trim() || null,
                    description: exp.description.filter(d => d.trim() !== ''),
                    published: exp.published
                }))
            });
            if (expError) throw expError;

            // Save educations
            const { error: eduError } = await supabase.rpc('mentor_admin_save_educations', {
                p_mentor_id: mentorId,
                p_educations: formData.educations.map(edu => ({
                    avatar: edu.avatar?.trim() || null,
                    school: edu.school?.trim() || '',
                    degree: edu.degree?.trim() || '',
                    start_date: edu.start_date?.trim() || null,
                    end_date: edu.end_date?.trim() || null,
                    description: edu.description.filter(d => d.trim() !== ''),
                    published: edu.published
                }))
            });
            if (eduError) throw eduError;

            // Save activities
            const { error: actError } = await supabase.rpc('mentor_admin_save_activities', {
                p_mentor_id: mentorId,
                p_activities: formData.activities.map(act => ({
                    avatar: act.avatar?.trim() || null,
                    organization: act.organization?.trim() || '',
                    role: act.role?.trim() || '',
                    activity_name: act.activity_name?.trim() || '',
                    start_date: act.start_date?.trim() || null,
                    end_date: act.end_date?.trim() || null,
                    description: act.description.filter(d => d.trim() !== ''),
                    published: act.published
                }))
            });
            if (actError) throw actError;

            resetForm();
            await loadMentors();
            showNotification('success', `Mentor đã được ${editingMentor ? 'cập nhật' : 'tạo'} thành công`);
        } catch (err: any) {
            console.error('Error saving mentor:', err);
            showNotification('error', `Lỗi khi lưu mentor: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };


    // Delete mentor using RPC
    const deleteMentor = async (mentorId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa mentor này? Hành động này sẽ xóa tất cả dữ liệu liên quan.')) return;

        try {
            const { error } = await supabase.rpc('mentor_admin_delete_mentor', {
                p_mentor_id: mentorId
            });

            if (error) throw error;

            showNotification('success', 'Đã xóa mentor thành công');
            loadMentors();
        } catch (error) {
            console.error('Error deleting mentor:', error);
            showNotification('error', 'Lỗi khi xóa mentor');
        }
    };

    // Toggle publish status using RPC
    const togglePublishStatus = async (mentorId: string, currentStatus: boolean) => {
        try {
            // We can use the update RPC, just passing the publish status
            const { error } = await supabase
                .from('mentors')
                .update({ published: !currentStatus })
                .eq('id', mentorId);

            if (error) throw error;
            loadMentors();
        } catch (error) {
            console.error('Error updating publish status:', error);
            showNotification('error', 'Lỗi khi cập nhật trạng thái');
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
            phone_number: mentor.phone_number || '',
            selected_skills: mentor.skills?.map(skill => skill.id) || [],
            published: mentor.published,
            work_experiences: mentor.mentor_work_experiences || [],
            educations: mentor.mentor_educations || [],
            activities: mentor.mentor_activities || [],
            connected_profile_id: mentor.profile_connection?.profile_id || ''
        });
        setShowForm(true);
    };

    // Reset form
    const resetForm = () => {
        setShowForm(false);
        setEditingMentor(null);
        setFormData({
            email: '',
            full_name: '',
            avatar: '',
            headline: '',
            description: '',
            phone_number: '',
            selected_skills: [],
            published: false,
            work_experiences: [],
            educations: [],
            activities: []
        });
    };

    // Filter mentors
    const filteredMentors = mentors.filter(mentor => {
        const matchesSearch = mentor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mentor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (mentor.headline && mentor.headline.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesPublished =
            filterPublished === 'all' ||
            (filterPublished === 'published' && mentor.published) ||
            (filterPublished === 'draft' && !mentor.published);

        const matchesConnection =
            filterConnection === 'all' ||
            (filterConnection === 'connected' && mentor.profile_connection) ||
            (filterConnection === 'disconnected' && !mentor.profile_connection);

        return matchesSearch && matchesPublished && matchesConnection;
    });

    // Search users with RPC
    const searchUsers = async (searchTerm: string, page: number = 1, reset: boolean = true) => {
        if (!searchTerm.trim()) {
            if (reset) {
                setSearchedUsers([]);
                setHasMoreUsers(false);
            }
            return;
        }

        try {
            setSearchingUsers(true);

            const { data, error } = await supabase.rpc('mentor_admin_search_user_profiles', {
                search_term: searchTerm.trim(),
                page_number: page,
                page_size: 10
            });

            if (error) throw error;

            const results = data?.[0]?.results || [];
            const totalCount = data?.[0]?.total_count || 0;

            if (reset) {
                setSearchedUsers(results);
            } else {
                setSearchedUsers(prev => [...prev, ...results]);
            }

            setHasMoreUsers((page * 10) < totalCount);

        } catch (error) {
            console.error('Error searching users:', error);
            showNotification('error', 'Lỗi khi tìm kiếm users');
            setSearchedUsers([]);
            setHasMoreUsers(false);
        } finally {
            setSearchingUsers(false);
        }
    };

    // Debounced search
    const handleUserSearchChange = (value: string) => {
        setUserSearchTerm(value);
        setUserSearchPage(1);

        // Clear previous debounce
        if (userSearchDebounce) {
            clearTimeout(userSearchDebounce);
        }

        // Set new debounce
        const timeout = setTimeout(() => {
            searchUsers(value, 1, true);
        }, 300); // 300ms delay

        setUserSearchDebounce(timeout);
    };

    // Load more users
    const loadMoreUsers = () => {
        const nextPage = userSearchPage + 1;
        setUserSearchPage(nextPage);
        searchUsers(userSearchTerm, nextPage, false);
    };

    // Get unconnected users from search results
    const getUnconnectedUsers = () => {
        const connectedProfileIds = mentors
            .filter(m => m.profile_connection?.profile_id)
            .map(m => m.profile_connection!.profile_id);

        return searchedUsers.filter(p => !connectedProfileIds.includes(p.id));
    };

    // ===== Helpers: add row =====
    const addWorkExperience = () => {
        setFormData(prev => ({
            ...prev,
            work_experiences: [
                ...prev.work_experiences,
                {
                    company: '',
                    position: '',
                    start_date: undefined, // Can be empty
                    end_date: undefined, // Can be empty
                    description: [''],
                    published: true,
                    avatar: ''
                }
            ]
        }));
    };

    const addEducation = () => {
        setFormData(prev => ({
            ...prev,
            educations: [
                ...prev.educations,
                {
                    school: '',
                    degree: '',
                    start_date: undefined, // Can be empty
                    end_date: undefined, // Can be empty
                    description: [''],
                    published: true,
                    avatar: ''
                }
            ]
        }));
    };

    const addActivity = () => {
        setFormData(prev => ({
            ...prev,
            activities: [
                ...prev.activities,
                {
                    organization: '',
                    role: '',
                    activity_name: '',
                    start_date: undefined, // Can be empty
                    end_date: undefined, // Can be empty
                    description: [''],
                    published: true,
                    avatar: ''
                }
            ]
        }));
    };

    // ===== Helpers: upload image per row =====
    const handleWorkExperienceImageUpload = async (index: number, file: File) => {
        try {
            const url = await uploadImage(file, `work_${index}`);
            setFormData(prev => {
                const next = [...prev.work_experiences];
                next[index] = { ...next[index], avatar: url };
                return { ...prev, work_experiences: next };
            });
            showNotification('success', 'Đã tải logo công ty.');
        } catch (e) {
            console.error(e);
            showNotification('error', 'Tải ảnh thất bại (Work Experience).');
        }
    };

    const handleEducationImageUpload = async (index: number, file: File) => {
        try {
            const url = await uploadImage(file, `edu_${index}`);
            setFormData(prev => {
                const next = [...prev.educations];
                next[index] = { ...next[index], avatar: url };
                return { ...prev, educations: next };
            });
            showNotification('success', 'Đã tải logo trường.');
        } catch (e) {
            console.error(e);
            showNotification('error', 'Tải ảnh thất bại (Education).');
        }
    };

    const handleActivityImageUpload = async (index: number, file: File) => {
        try {
            const url = await uploadImage(file, `act_${index}`);
            setFormData(prev => {
                const next = [...prev.activities];
                next[index] = { ...next[index], avatar: url };
                return { ...prev, activities: next };
            });
            showNotification('success', 'Đã tải ảnh hoạt động.');
        } catch (e) {
            console.error(e);
            showNotification('error', 'Tải ảnh thất bại (Activity).');
        }
    };


    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (userSearchDebounce) {
                clearTimeout(userSearchDebounce);
            }
        };
    }, [userSearchDebounce]);

    useEffect(() => {
        if (showForm || showProfileLinkModal) {
            // Lưu scroll position hiện tại
            const scrollY = window.scrollY;

            // Lock body scroll với position fixed
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.overflow = 'hidden';

            return () => {
                // Restore scroll khi đóng modal
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.left = '';
                document.body.style.right = '';
                document.body.style.overflow = '';

                // Restore scroll position
                window.scrollTo(0, scrollY);
            };
        }
    }, [showForm, showProfileLinkModal]);

    // Effects for data loading
    useEffect(() => {
        loadMentors();
        loadAvailableSkills();
        loadAvailableProfiles();
    }, []);

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm p-6">
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

                        <select
                            value={filterConnection}
                            onChange={(e) => setFilterConnection(e.target.value as typeof filterConnection)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả kết nối</option>
                            <option value="connected">Đã kết nối</option>
                            <option value="disconnected">Chưa kết nối</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={loadMentors}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>

                        <Button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Mentor mới
                        </Button>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Users className="h-6 w-6 text-blue-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Tổng mentors</p>
                            <p className="text-lg font-semibold text-gray-900">{mentors.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Eye className="h-6 w-6 text-green-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Đã xuất bản</p>
                            <p className="text-lg font-semibold text-green-600">
                                {mentors.filter(m => m.published).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Link className="h-6 w-6 text-blue-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Đã kết nối</p>
                            <p className="text-lg font-semibold text-blue-600">
                                {mentors.filter(m => m.profile_connection).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Chưa kết nối</p>
                            <p className="text-lg font-semibold text-yellow-600">
                                {mentors.filter(m => !m.profile_connection).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Link Modal */}
            {showProfileLinkModal && linkingMentor && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm w-full h-full"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            width: '100vw',
                            height: '100vh'
                        }}
                        onClick={() => {
                            setShowProfileLinkModal(false);
                            setLinkingMentor(null);
                            setUserSearchTerm('');
                            setSearchedUsers([]);
                        }}
                    />

                    <div className="relative bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-gray-200 z-10">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Liên kết Mentor với Profile
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowProfileLinkModal(false);
                                        setLinkingMentor(null);
                                        setUserSearchTerm('');
                                        setSearchedUsers([]);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {linkingMentor && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                                        Mentor: {linkingMentor.full_name}
                                    </h4>
                                    <p className="text-sm text-gray-600">{linkingMentor.email}</p>
                                </div>
                            )}

                            {/* Search Input */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tìm kiếm User để liên kết:
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Nhập tên hoặc email để tìm kiếm..."
                                        value={userSearchTerm}
                                        onChange={(e) => handleUserSearchChange(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Chỉ hiển thị users có role 'user' chưa được liên kết
                                </p>
                            </div>

                            {/* Search Results */}
                            <div className="space-y-4">
                                {!userSearchTerm.trim() ? (
                                    <div className="text-center py-8">
                                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">Nhập từ khóa để tìm kiếm users</p>
                                    </div>
                                ) : searchingUsers && searchedUsers.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <p className="text-gray-600">Đang tìm kiếm...</p>
                                    </div>
                                ) : getUnconnectedUsers().length === 0 ? (
                                    <div className="text-center py-8">
                                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">
                                            {searchedUsers.length === 0
                                                ? 'Không tìm thấy user nào'
                                                : 'Tất cả users đã được liên kết hoặc không có quyền phù hợp'}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="max-h-96 overflow-y-auto space-y-2">
                                            {getUnconnectedUsers().map((profile) => (
                                                <div
                                                    key={profile.id}
                                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {profile.image_url ? (
                                                            <Image
                                                                src={profile.image_url}
                                                                alt={profile.full_name}
                                                                width={40}
                                                                height={40}
                                                                className="rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                                                <User className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                        )}

                                                        <div>
                                                            <h6 className="font-medium text-gray-900">{profile.full_name}</h6>
                                                            <p className="text-sm text-gray-600">{profile.auth_email}</p>
                                                            {profile.phone_number && (
                                                                <p className="text-xs text-gray-500">{profile.phone_number}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Button
                                                        onClick={() => linkingMentor && linkMentorToProfile(linkingMentor.id, profile.id)}
                                                        className="flex items-center gap-2"
                                                        size="sm"
                                                    >
                                                        <Link className="w-4 h-4" />
                                                        Liên kết
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Load More Button */}
                                        {hasMoreUsers && (
                                            <div className="text-center pt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={loadMoreUsers}
                                                    disabled={searchingUsers}
                                                    className="flex items-center gap-2"
                                                >
                                                    {searchingUsers ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                            Đang tải...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RefreshCw className="w-4 h-4" />
                                                            Tải thêm
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Mentor Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm w-full h-full"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            width: '100vw',
                            height: '100vh'
                        }}
                        onClick={resetForm}
                    />

                    <div className="relative bg-white rounded-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto z-10">
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-20">
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

                        <div className="p-6 space-y-8">
                            {/* BASIC INFO SECTION */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Thông tin cơ bản
                                </h4>

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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tiêu đề chuyên môn
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.headline}
                                            onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="VD: Senior Software Engineer tại Google"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Số điện thoại
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone_number}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="VD: 0901234567"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
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

                                {/* Avatar */}
                                <div className="mt-4">
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
                                                        showNotification('error', 'Lỗi khi upload ảnh');
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

                                {/* Publish Status */}
                                <div className="flex items-center gap-2 mt-4">
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

                            {/* SKILLS SECTION */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Award className="w-5 h-5" />
                                    Kỹ năng
                                </h4>
                                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {availableSkills.map((skill) => (
                                            <label key={skill.id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.selected_skills.includes(skill.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                selected_skills: [...prev.selected_skills, skill.id]
                                                            }));
                                                        } else {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                selected_skills: prev.selected_skills.filter(id => id !== skill.id)
                                                            }));
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">{skill.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* WORK EXPERIENCE SECTION */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <Building className="w-5 h-5" />
                                        Kinh nghiệm làm việc ({formData.work_experiences.length})
                                    </h4>
                                    <Button
                                        type="button"
                                        onClick={addWorkExperience}
                                        className="flex items-center gap-2"
                                        size="sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Thêm kinh nghiệm
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {formData.work_experiences.map((exp, index) => (
                                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-4">
                                                <h5 className="font-medium text-gray-900">Kinh nghiệm #{index + 1}</h5>
                                                <div className="flex items-center gap-2">
                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={exp.published}
                                                            onChange={(e) => {
                                                                const newExps = [...formData.work_experiences];
                                                                newExps[index].published = e.target.checked;
                                                                setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                            }}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-600">Hiển thị</span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newExps = formData.work_experiences.filter((_, i) => i !== index);
                                                            setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                        }}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Công ty
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={exp.company}
                                                        onChange={(e) => {
                                                            const newExps = [...formData.work_experiences];
                                                            newExps[index].company = e.target.value;
                                                            setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="VD: Google, Meta, Microsoft..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Vị trí
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={exp.position}
                                                        onChange={(e) => {
                                                            const newExps = [...formData.work_experiences];
                                                            newExps[index].position = e.target.value;
                                                            setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="VD: Senior Software Engineer"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Ngày bắt đầu
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={exp.start_date || ''}
                                                        onChange={(e) => {
                                                            const newExps = [...formData.work_experiences];
                                                            newExps[index].start_date = e.target.value || undefined;
                                                            setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Ngày kết thúc (để trống nếu đang làm)
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={exp.end_date || ''}
                                                        onChange={(e) => {
                                                            const newExps = [...formData.work_experiences];
                                                            newExps[index].end_date = e.target.value || undefined;
                                                            setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* Company Logo */}
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Logo công ty
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleWorkExperienceImageUpload(index, e.target.files?.[0]!)}
                                                        className="hidden"
                                                        id={`work-exp-image-${index}`}
                                                    />
                                                    <label
                                                        htmlFor={`work-exp-image-${index}`}
                                                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        Chọn logo
                                                    </label>
                                                    {exp.avatar && (
                                                        <div className="relative w-12 h-12">
                                                            <Image
                                                                src={exp.avatar}
                                                                alt="Company logo"
                                                                fill
                                                                className="object-contain rounded-lg"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newExps = [...formData.work_experiences];
                                                                    newExps[index].avatar = '';
                                                                    setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                                }}
                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}
                                                    {uploadingStates[`work_${index}`] && (
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Mô tả công việc
                                                </label>
                                                <div className="space-y-2">
                                                    {exp.description.map((desc, descIndex) => (
                                                        <div key={descIndex} className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={desc}
                                                                onChange={(e) => {
                                                                    const newExps = [...formData.work_experiences];
                                                                    newExps[index].description[descIndex] = e.target.value;
                                                                    setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                                }}
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                placeholder="VD: Phát triển ứng dụng web sử dụng React và Node.js"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newExps = [...formData.work_experiences];
                                                                    newExps[index].description = newExps[index].description.filter((_, i) => i !== descIndex);
                                                                    setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                                }}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newExps = [...formData.work_experiences];
                                                            newExps[index].description.push('');
                                                            setFormData(prev => ({ ...prev, work_experiences: newExps }));
                                                        }}
                                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Thêm mô tả
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* EDUCATION SECTION */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <GraduationCap className="w-5 h-5" />
                                        Học vấn ({formData.educations.length})
                                    </h4>
                                    <Button
                                        type="button"
                                        onClick={addEducation}
                                        className="flex items-center gap-2"
                                        size="sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Thêm học vấn
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {formData.educations.map((edu, index) => (
                                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-4">
                                                <h5 className="font-medium text-gray-900">Học vấn #{index + 1}</h5>
                                                <div className="flex items-center gap-2">
                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={edu.published}
                                                            onChange={(e) => {
                                                                const newEdus = [...formData.educations];
                                                                newEdus[index].published = e.target.checked;
                                                                setFormData(prev => ({ ...prev, educations: newEdus }));
                                                            }}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-600">Hiển thị</span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newEdus = formData.educations.filter((_, i) => i !== index);
                                                            setFormData(prev => ({ ...prev, educations: newEdus }));
                                                        }}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Trường học
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={edu.school}
                                                        onChange={(e) => {
                                                            const newEdus = [...formData.educations];
                                                            newEdus[index].school = e.target.value;
                                                            setFormData(prev => ({ ...prev, educations: newEdus }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="VD: Đại học Bách Khoa Hà Nội"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Bằng cấp
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={edu.degree}
                                                        onChange={(e) => {
                                                            const newEdus = [...formData.educations];
                                                            newEdus[index].degree = e.target.value;
                                                            setFormData(prev => ({ ...prev, educations: newEdus }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="VD: Cử nhân Công nghệ Thông tin"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Ngày bắt đầu
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={edu.start_date || ''}
                                                        onChange={(e) => {
                                                            const newEdus = [...formData.educations];
                                                            newEdus[index].start_date = e.target.value || undefined;
                                                            setFormData(prev => ({ ...prev, educations: newEdus }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Ngày kết thúc (để trống nếu đang học)
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={edu.end_date || ''}
                                                        onChange={(e) => {
                                                            const newEdus = [...formData.educations];
                                                            newEdus[index].end_date = e.target.value || undefined;
                                                            setFormData(prev => ({ ...prev, educations: newEdus }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* School Logo */}
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Logo trường học
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleEducationImageUpload(index, e.target.files?.[0]!)}
                                                        className="hidden"
                                                        id={`education-image-${index}`}
                                                    />
                                                    <label
                                                        htmlFor={`education-image-${index}`}
                                                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        Chọn logo
                                                    </label>
                                                    {edu.avatar && (
                                                        <div className="relative w-12 h-12">
                                                            <Image
                                                                src={edu.avatar}
                                                                alt="School logo"
                                                                fill
                                                                className="object-contain rounded-lg"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newEdus = [...formData.educations];
                                                                    newEdus[index].avatar = '';
                                                                    setFormData(prev => ({ ...prev, educations: newEdus }));
                                                                }}
                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}
                                                    {uploadingStates[`edu_${index}`] && (
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Education Description */}
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Mô tả học tập
                                                </label>
                                                <div className="space-y-2">
                                                    {edu.description.map((desc, descIndex) => (
                                                        <div key={descIndex} className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={desc}
                                                                onChange={(e) => {
                                                                    const newEdus = [...formData.educations];
                                                                    newEdus[index].description[descIndex] = e.target.value;
                                                                    setFormData(prev => ({ ...prev, educations: newEdus }));
                                                                }}
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                placeholder="VD: GPA 3.8/4.0, Tốt nghiệp loại Giỏi"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newEdus = [...formData.educations];
                                                                    newEdus[index].description = newEdus[index].description.filter((_, i) => i !== descIndex);
                                                                    setFormData(prev => ({ ...prev, educations: newEdus }));
                                                                }}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newEdus = [...formData.educations];
                                                            newEdus[index].description.push('');
                                                            setFormData(prev => ({ ...prev, educations: newEdus }));
                                                        }}
                                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Thêm mô tả
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ACTIVITIES SECTION */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <Award className="w-5 h-5" />
                                        Hoạt động & Thành tích ({formData.activities.length})
                                    </h4>
                                    <Button
                                        type="button"
                                        onClick={addActivity}
                                        className="flex items-center gap-2"
                                        size="sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Thêm hoạt động
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {formData.activities.map((activity, index) => (
                                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-4">
                                                <h5 className="font-medium text-gray-900">Hoạt động #{index + 1}</h5>
                                                <div className="flex items-center gap-2">
                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={activity.published}
                                                            onChange={(e) => {
                                                                const newActivities = [...formData.activities];
                                                                newActivities[index].published = e.target.checked;
                                                                setFormData(prev => ({ ...prev, activities: newActivities }));
                                                            }}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-600">Hiển thị</span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newActivities = formData.activities.filter((_, i) => i !== index);
                                                            setFormData(prev => ({ ...prev, activities: newActivities }));
                                                        }}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Tổ chức
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={activity.organization}
                                                        onChange={(e) => {
                                                            const newActivities = [...formData.activities];
                                                            newActivities[index].organization = e.target.value;
                                                            setFormData(prev => ({ ...prev, activities: newActivities }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="VD: Startup Việt Nam, TEDx Hanoi"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Vai trò
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={activity.role}
                                                        onChange={(e) => {
                                                            const newActivities = [...formData.activities];
                                                            newActivities[index].role = e.target.value;
                                                            setFormData(prev => ({ ...prev, activities: newActivities }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="VD: Speaker, Organizer, Volunteer"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tên hoạt động
                                                </label>
                                                <input
                                                    type="text"
                                                    value={activity.activity_name}
                                                    onChange={(e) => {
                                                        const newActivities = [...formData.activities];
                                                        newActivities[index].activity_name = e.target.value;
                                                        setFormData(prev => ({ ...prev, activities: newActivities }));
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="VD: Hội thảo Công nghệ 2024, Startup Weekend"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Ngày bắt đầu
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={activity.start_date || ''}
                                                        onChange={(e) => {
                                                            const newActivities = [...formData.activities];
                                                            newActivities[index].start_date = e.target.value || undefined;
                                                            setFormData(prev => ({ ...prev, activities: newActivities }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Ngày kết thúc (để trống nếu đang tham gia)
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={activity.end_date || ''}
                                                        onChange={(e) => {
                                                            const newActivities = [...formData.activities];
                                                            newActivities[index].end_date = e.target.value || undefined;
                                                            setFormData(prev => ({ ...prev, activities: newActivities }));
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* Activity Logo */}
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Logo/Ảnh hoạt động
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleActivityImageUpload(index, e.target.files?.[0]!)}
                                                        className="hidden"
                                                        id={`activity-image-${index}`}
                                                    />
                                                    <label
                                                        htmlFor={`activity-image-${index}`}
                                                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        Chọn ảnh
                                                    </label>
                                                    {activity.avatar && (
                                                        <div className="relative w-12 h-12">
                                                            <Image
                                                                src={activity.avatar}
                                                                alt="Activity image"
                                                                fill
                                                                className="object-contain rounded-lg"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newActivities = [...formData.activities];
                                                                    newActivities[index].avatar = '';
                                                                    setFormData(prev => ({ ...prev, activities: newActivities }));
                                                                }}
                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}
                                                    {uploadingStates[`act_${index}`] && (
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Activity Description */}
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Mô tả hoạt động & thành tích
                                                </label>
                                                <div className="space-y-2">
                                                    {activity.description.map((desc, descIndex) => (
                                                        <div key={descIndex} className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={desc}
                                                                onChange={(e) => {
                                                                    const newActivities = [...formData.activities];
                                                                    newActivities[index].description[descIndex] = e.target.value;
                                                                    setFormData(prev => ({ ...prev, activities: newActivities }));
                                                                }}
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                placeholder="VD: Diễn giả chính với 500+ người tham dự"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newActivities = [...formData.activities];
                                                                    newActivities[index].description = newActivities[index].description.filter((_, i) => i !== descIndex);
                                                                    setFormData(prev => ({ ...prev, activities: newActivities }));
                                                                }}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newActivities = [...formData.activities];
                                                            newActivities[index].description.push('');
                                                            setFormData(prev => ({ ...prev, activities: newActivities }));
                                                        }}
                                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Thêm mô tả
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PROFILE CONNECTION INFO */}
                            {editingMentor?.profile_connection && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                    <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                                        <UserCheck className="w-5 h-5" />
                                        Thông tin kết nối Profile
                                    </h4>
                                    <div className="flex items-start gap-4">
                                        {editingMentor.profile_connection.profiles.image_url ? (
                                            <Image
                                                src={editingMentor.profile_connection.profiles.image_url}
                                                alt={editingMentor.profile_connection.profiles.full_name}
                                                width={60}
                                                height={60}
                                                className="rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-15 h-15 bg-gray-200 rounded-lg flex items-center justify-center">
                                                <User className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}

                                        <div className="flex-1">
                                            <h5 className="font-medium text-green-900 text-lg">
                                                {editingMentor.profile_connection.profiles.full_name}
                                            </h5>
                                            <div className="text-sm text-green-700 space-y-1 mt-2">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4" />
                                                    <span>{editingMentor.profile_connection.profiles.auth_email}</span>
                                                </div>
                                                {editingMentor.profile_connection.profiles.phone_number && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4" />
                                                        <span>{editingMentor.profile_connection.profiles.phone_number}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Liên kết từ: {new Date(editingMentor.profile_connection.created_at).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => unlinkMentorFromProfile(editingMentor.id)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            <Unlink className="w-4 h-4" />
                                            Ngắt kết nối
                                        </button>
                                    </div>
                                    <div className="mt-4 p-3 bg-white rounded border border-green-200">
                                        <p className="text-sm text-green-800">
                                            <strong>Lưu ý:</strong> User này đã được cấp quyền mentor. Ngắt kết nối sẽ tự động chuyển role về "user".
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* STATISTICS PREVIEW */}
                            {editingMentor && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                    <h4 className="text-lg font-semibold text-blue-900 mb-4">Thống kê Mentor</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                                            <div className="text-2xl font-bold text-blue-900">{editingMentor.total_bookings || 0}</div>
                                            <div className="text-sm text-blue-700">Tổng lượt đặt lịch</div>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                                            <div className="text-2xl font-bold text-green-900">{editingMentor.completed_bookings || 0}</div>
                                            <div className="text-sm text-green-700">Đã hoàn thành</div>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                                            <div className="text-2xl font-bold text-yellow-900">
                                                {editingMentor.average_rating && editingMentor.average_rating > 0
                                                    ? `${editingMentor.average_rating.toFixed(1)} ⭐`
                                                    : 'Chưa có'}
                                            </div>
                                            <div className="text-sm text-yellow-700">Đánh giá trung bình</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Form Actions - STICKY FOOTER */}
                        <div className="p-6 border-t border-gray-200 flex gap-4 justify-end sticky bottom-0 bg-white z-20">
                            <Button
                                variant="outline"
                                onClick={resetForm}
                                disabled={uploading}
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
                                        {editingMentor ? 'Cập nhật mentor' : 'Tạo mentor mới'}
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
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Không có mentor nào phù hợp với bộ lọc.</p>
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
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {mentor.full_name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                        <Mail className="w-4 h-4" />
                                                        <span>{mentor.email}</span>
                                                        {mentor.phone_number && (
                                                            <>
                                                                <span>•</span>
                                                                <Phone className="w-4 h-4" />
                                                                <span>{mentor.phone_number}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {mentor.headline && (
                                                        <p className="text-blue-600 text-sm font-medium mt-1">
                                                            {mentor.headline}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Connection Status */}
                                            {mentor.profile_connection ? (
                                                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg mb-2">
                                                    <UserCheck className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm text-green-800">
                                                        Đã kết nối với: <strong>{mentor.profile_connection.profiles.full_name}</strong>
                                                    </span>
                                                    <span className="text-xs text-green-600">
                                                        ({mentor.profile_connection.profiles.auth_email})
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-2">
                                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                                    <span className="text-sm text-yellow-800">
                                                        Chưa kết nối với profile nào
                                                    </span>
                                                </div>
                                            )}

                                            {/* Skills */}
                                            {mentor.skills && mentor.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {mentor.skills.slice(0, 3).map((skill, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                                        >
                                                            {skill.name}
                                                        </span>
                                                    ))}
                                                    {mentor.skills.length > 3 && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                            +{mentor.skills.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Statistics */}
                                            {mentor.total_bookings !== undefined && (
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                    <span>{mentor.total_bookings} lượt đặt lịch</span>
                                                    <span>{mentor.completed_bookings} hoàn thành</span>
                                                    {mentor.average_rating > 0 && (
                                                        <span>⭐ {mentor.average_rating.toFixed(1)}</span>
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

                                        {/* Connection Actions */}
                                        {mentor.profile_connection ? (
                                            <button
                                                onClick={() => unlinkMentorFromProfile(mentor.id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                title="Ngắt kết nối"
                                            >
                                                <Unlink className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setLinkingMentor(mentor);
                                                    setShowProfileLinkModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                title="Kết nối với profile"
                                            >
                                                <Link className="w-4 h-4" />
                                            </button>
                                        )}

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

                                        {/* All Skills */}
                                        {mentor.skills && mentor.skills.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Tất cả kỹ năng</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {mentor.skills.map((skill, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                                        >
                                                            {skill.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Work Experiences */}
                                        {mentor.mentor_work_experiences && mentor.mentor_work_experiences.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <Building className="w-4 h-4" />
                                                    Kinh nghiệm làm việc ({mentor.mentor_work_experiences.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {mentor.mentor_work_experiences.map((exp, index) => (
                                                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <h5 className="font-medium text-gray-900">{exp.position}</h5>
                                                                    <p className="text-sm text-gray-600">{exp.company}</p>
                                                                </div>
                                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                                    exp.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {exp.published ? 'Hiển thị' : 'Ẩn'}
                                                                </span>
                                                            </div>
                                                            {exp.start_date && (
                                                                <p className="text-xs text-gray-500">
                                                                    {exp.start_date} - {exp.end_date || 'Hiện tại'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Educations */}
                                        {mentor.mentor_educations && mentor.mentor_educations.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <GraduationCap className="w-4 h-4" />
                                                    Học vấn ({mentor.mentor_educations.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {mentor.mentor_educations.map((edu, index) => (
                                                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <h5 className="font-medium text-gray-900">{edu.degree}</h5>
                                                                    <p className="text-sm text-gray-600">{edu.school}</p>
                                                                </div>
                                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                                    edu.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {edu.published ? 'Hiển thị' : 'Ẩn'}
                                                                </span>
                                                            </div>
                                                            {edu.start_date && (
                                                                <p className="text-xs text-gray-500">
                                                                    {edu.start_date} - {edu.end_date || 'Hiện tại'}
                                                                </p>
                                                            )}
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
                                                    Hoạt động ({mentor.mentor_activities.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {mentor.mentor_activities.map((activity, index) => (
                                                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <h5 className="font-medium text-gray-900">{activity.role}</h5>
                                                                    <p className="text-sm text-gray-600">{activity.activity_name}</p>
                                                                    <p className="text-sm text-gray-500">{activity.organization}</p>
                                                                </div>
                                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                                    activity.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                    {activity.published ? 'Hiển thị' : 'Ẩn'}
                                                </span>
                                                            </div>
                                                            {activity.start_date && (
                                                                <p className="text-xs text-gray-500">
                                                                    {activity.start_date} - {activity.end_date || 'Hiện tại'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Reviews Section */}
                                        {mentor.reviews && mentor.reviews.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <Award className="w-4 h-4" />
                                                    Đánh giá từ học viên ({mentor.reviews.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {mentor.reviews.slice(0, 5).map((review, index) => (
                                                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-yellow-500">
                                                                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                                                    </span>
                                                                    <span className="text-sm text-gray-600">
                                                                        {review.profiles?.full_name || 'Ẩn danh'}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(review.created_at).toLocaleDateString('vi-VN')}
                                                                </span>
                                                            </div>
                                                            {review.comment && (
                                                                <p className="text-sm text-gray-700">{review.comment}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {mentor.reviews.length > 5 && (
                                                        <p className="text-xs text-gray-500 text-center">
                                                            và {mentor.reviews.length - 5} đánh giá khác...
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}


                                        {/* Profile Connection Details */}
                                        {mentor.profile_connection && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <UserCheck className="w-4 h-4" />
                                                    Thông tin kết nối Profile
                                                </h4>
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                    <div className="flex items-start gap-3">
                                                        {mentor.profile_connection.profiles.image_url ? (
                                                            <Image
                                                                src={mentor.profile_connection.profiles.image_url}
                                                                alt={mentor.profile_connection.profiles.full_name}
                                                                width={40}
                                                                height={40}
                                                                className="rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                                                <User className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                        )}

                                                        <div className="flex-1">
                                                            <h5 className="font-medium text-green-900">
                                                                {mentor.profile_connection.profiles.full_name}
                                                            </h5>
                                                            <div className="text-sm text-green-700 space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Mail className="w-3 h-3" />
                                                                    <span>{mentor.profile_connection.profiles.auth_email}</span>
                                                                </div>
                                                                {mentor.profile_connection.profiles.phone_number && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Phone className="w-3 h-3" />
                                                                        <span>{mentor.profile_connection.profiles.phone_number}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-3 h-3" />
                                                                    <span>Liên kết từ: {new Date(mentor.profile_connection.created_at).toLocaleDateString('vi-VN')}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => unlinkMentorFromProfile(mentor.id)}
                                                            className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                        >
                                                            <Unlink className="w-3 h-3" />
                                                            Ngắt kết nối
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Booking Statistics */}
                                        {mentor.total_bookings !== undefined && mentor.total_bookings > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Thống kê đặt lịch</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                        <div className="text-lg font-semibold text-blue-900">{mentor.total_bookings}</div>
                                                        <div className="text-sm text-blue-700">Tổng lượt đặt</div>
                                                    </div>
                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                        <div className="text-lg font-semibold text-green-900">{mentor.completed_bookings}</div>
                                                        <div className="text-sm text-green-700">Đã hoàn thành</div>
                                                    </div>
                                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                        <div className="text-lg font-semibold text-yellow-900">
                                                            {mentor.average_rating > 0 ? `${mentor.average_rating.toFixed(1)} ⭐` : 'Chưa có'}
                                                        </div>
                                                        <div className="text-sm text-yellow-700">Đánh giá TB</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="text-xs text-gray-500 pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <div>
                                                    <strong>Tạo:</strong> {new Date(mentor.created_at).toLocaleString('vi-VN')}
                                                </div>
                                                <div>
                                                    <strong>Cập nhật:</strong> {new Date(mentor.updated_at).toLocaleString('vi-VN')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">💡</span>
                        </div>
                    </div>
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Hướng dẫn quản lý Mentor:</p>
                        <ul className="space-y-1 text-xs">
                            <li>• <strong>Kết nối Profile:</strong> Liên kết mentor với tài khoản user để cấp quyền mentor</li>
                            <li>• <strong>Ngắt kết nối:</strong> Tự động chuyển role user về "user", ngắt quyền mentor</li>
                            <li>• <strong>Xuất bản:</strong> Chỉ mentor đã xuất bản mới hiển thị trên website</li>
                            <li>• <strong>Skills:</strong> Thêm skills để user dễ tìm kiếm mentor phù hợp</li>
                            <li>• <strong>Thống kê:</strong> Theo dõi số lượt đặt lịch và đánh giá của mentor</li>
                            <li>• <strong>Hồ sơ chi tiết:</strong> Thêm kinh nghiệm, học vấn, hoạt động để tăng uy tín</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorListTab;