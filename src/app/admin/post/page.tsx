// src/app/admin/post/page.tsx - PART 1
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { SectionHeader } from '@/component/SectionHeader';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/component/Button';
import {
    Plus, Search, Upload, X, Save, Check, XCircle,
    AlertCircle, CheckCircle, Loader2, RefreshCw,
    MessageSquare, Calendar, Clock, Eye, Tag, Settings, Edit
} from 'lucide-react';
import Image from 'next/image';
import { Editor } from '@tinymce/tinymce-react';

// Import types
import { Tag as TagType, Post, PostSubmission, PostFormData, TabType } from '@/types/post_admin';

// Import tab components
import PostsTab from '@/component/admin/post/PostsTab';
import SubmissionsTab from '@/component/admin/post/SubmissionsTab';
import TagsTab from '@/component/admin/post/TagsTab';

// Helper functions
function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err && 'message' in err) {
        const m = (err as { message?: unknown }).message;
        return typeof m === 'string' ? m : JSON.stringify(m);
    }
    return typeof err === 'string' ? err : JSON.stringify(err);
}

function getErrorCode(err: unknown): string | undefined {
    return typeof err === 'object' && err !== null && 'code' in err
        ? (err as { code?: string }).code
        : undefined;
}

const PostPage: React.FC = () => {
    const { user } = useAuthStore();
    const editorRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const liveEditorRef = useRef<any>(null);

    // Tab refs for reloading
    const postsTabRef = useRef<{ reload: () => void }>(null);
    const submissionsTabRef = useRef<{ reload: () => void }>(null);
    const tagsTabRef = useRef<{ reload: () => void }>(null);

    // State management
    const [activeTab, setActiveTab] = useState<TabType>('posts');
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [reviewingSubmission, setReviewingSubmission] = useState<PostSubmission | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [tags, setTags] = useState<TagType[]>([]);
    const [tagSearch, setTagSearch] = useState('');
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [showTagForm, setShowTagForm] = useState(false);
    const [editingTag, setEditingTag] = useState<TagType | null>(null);
    const [tagFormData, setTagFormData] = useState({
        name: '',
        description: ''
    });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'activity' | 'blog'>('all');
    const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [filterTag, setFilterTag] = useState<string>('all');

    // Form state
    const [formData, setFormData] = useState<PostFormData>({
        title: '',
        description: '',
        type: 'activity',
        content: '',
        thumbnail: null,
        published: false,
        selectedTags: []
    });
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    // Notification
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
    } | null>(null);

    // Preview states
    const [showPreview, setShowPreview] = useState(false);
    const [showLivePreview, setShowLivePreview] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [livePreviewContent, setLivePreviewContent] = useState('');
    const [isLivePreviewClosing, setIsLivePreviewClosing] = useState(false);
    const [pendingLiveContent, setPendingLiveContent] = useState('');

    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // Load Tags for form
    const loadTags = async () => {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setTags(data || []);
        } catch (error) {
            console.error('Error loading tags:', error);
            showNotification('error', 'Không thể tải danh sách tag: ' + getErrorMessage(error));
        }
    };

    // FIXED: Upload image with better error handling
    const uploadImage = async (file: File): Promise<string> => {
        // Validate file
        if (!file || !file.name) {
            throw new Error('File không hợp lệ');
        }

        // Get extension safely
        const fileName = file.name || 'unnamed';
        const fileExt = fileName.includes('.')
            ? fileName.split('.').pop()
            : 'jpg';

        const newFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `posts/${newFileName}`;

        try {
            const { data, error } = await supabase.storage
                .from('images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (error) {
            console.error('Upload error:', error);
            throw new Error(`Lỗi upload ảnh: ${getErrorMessage(error)}`);
        }
    };

    // Preview handlers
    const handlePreview = () => {
        const content = editorRef.current?.getContent() || '';
        setPreviewContent(content);
        setShowPreview(true);
    };

    const handleLivePreview = () => {
        const content = editorRef.current?.getContent() || '';
        setPreviewContent(content);
        setLivePreviewContent(content);
        setPendingLiveContent(content);
        setShowLivePreview(true);
    };

    const handleCloseLivePreview = async () => {
        setIsLivePreviewClosing(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 150));

            let finalContent = '';

            if (liveEditorRef.current) {
                try {
                    finalContent = liveEditorRef.current.getContent();
                } catch (error) {
                    console.warn('Could not get content from live editor:', error);
                }
            }

            if (!finalContent) {
                finalContent = pendingLiveContent || livePreviewContent || '';
            }

            if (finalContent && editorRef.current) {
                try {
                    editorRef.current.setContent(finalContent);
                    editorRef.current.fire('change');
                    editorRef.current.fire('input');
                    setFormData(prev => ({ ...prev, content: finalContent }));
                } catch (error) {
                    console.error('Error syncing content to main editor:', error);
                }
            }

        } catch (error) {
            console.error('Error during live preview close:', error);
        } finally {
            setShowLivePreview(false);
            setPreviewContent('');
            setIsLivePreviewClosing(false);
            setLivePreviewContent('');
            setPendingLiveContent('');
        }
    };

    // Handle thumbnail upload
    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, thumbnail: file }));

            const reader = new FileReader();
            reader.onload = (e) => {
                setThumbnailPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle tags
    const toggleTag = (tagId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedTags: prev.selectedTags.includes(tagId)
                ? prev.selectedTags.filter(id => id !== tagId)
                : [...prev.selectedTags, tagId]
        }));
    };

    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(tagSearch.toLowerCase())
    );

    // Save post using RPC
    const savePost = async () => {
        if (!user) return;

        try {
            setUploading(true);

            let thumbnailUrl = editingPost?.thumbnail || '';
            if (formData.thumbnail) {
                thumbnailUrl = await uploadImage(formData.thumbnail);
            }

            const content = editorRef.current?.getContent() || formData.content || '';

            const { data, error } = await supabase.rpc('posts_admin_save_post', {
                p_post_id: editingPost?.id || null,
                p_title: formData.title,
                p_description: formData.description,
                p_type: formData.type,
                p_content: content,
                p_thumbnail: thumbnailUrl || null,
                p_published: formData.published,
                p_author_id: editingPost ? undefined : user.id,
                p_tag_ids: formData.selectedTags
            });

            if (error) throw error;

            showNotification('success', editingPost ? 'Cập nhật bài viết thành công' : 'Tạo bài viết thành công');
            resetForm();
            postsTabRef.current?.reload();

        } catch (error) {
            console.error('Error saving post:', error);
            showNotification('error', 'Lỗi khi lưu bài viết: ' + getErrorMessage(error));
        } finally {
            setUploading(false);
        }
    };

    // Approve submission
    const approveSubmission = async () => {
        if (!reviewingSubmission || !user) return;

        try {
            setUploading(true);

            const { error } = await supabase.rpc('approve_post_submission', {
                submission_id: reviewingSubmission.id,
                admin_note: adminNotes
            });

            if (error) throw error;

            showNotification('success', 'Duyệt bài viết thành công');
            setShowReviewModal(false);
            setReviewingSubmission(null);
            setAdminNotes('');
            submissionsTabRef.current?.reload();
            if (activeTab === 'posts') postsTabRef.current?.reload();

        } catch (error) {
            console.error('Error approving submission:', error);
            showNotification('error', 'Lỗi khi duyệt bài viết: ' + getErrorMessage(error));
        } finally {
            setUploading(false);
        }
    };

    // Reject submission
    const rejectSubmission = async () => {
        if (!reviewingSubmission || !user || !adminNotes.trim()) {
            showNotification('error', 'Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            setUploading(true);

            const { error } = await supabase.rpc('reject_post_submission', {
                submission_id: reviewingSubmission.id,
                reason: adminNotes
            });

            if (error) throw error;

            showNotification('success', 'Từ chối bài viết thành công');
            setShowReviewModal(false);
            setReviewingSubmission(null);
            setAdminNotes('');
            submissionsTabRef.current?.reload();

        } catch (error) {
            console.error('Error rejecting submission:', error);
            showNotification('error', 'Lỗi khi từ chối bài viết: ' + getErrorMessage(error));
        } finally {
            setUploading(false);
        }
    };

    // Tag management functions
    const createTag = async () => {
        if (!tagFormData.name.trim()) {
            showNotification('error', 'Tên tag không được để trống');
            return;
        }

        try {
            setUploading(true);

            const { error } = await supabase.rpc('posts_admin_create_tag', {
                p_name: tagFormData.name.trim(),
                p_description: tagFormData.description.trim() || null
            });

            if (error) throw error;

            showNotification('success', 'Tạo tag thành công');
            resetTagForm();
            loadTags();
            tagsTabRef.current?.reload();
        } catch (err) {
            console.error('Error creating tag:', err);
            const code = getErrorCode(err);
            if (code === '23505') {
                showNotification('error', 'Tag với tên này đã tồn tại');
            } else {
                showNotification('error', 'Lỗi khi tạo tag: ' + getErrorMessage(err));
            }
        } finally {
            setUploading(false);
        }
    };

    const updateTag = async () => {
        if (!editingTag || !tagFormData.name.trim()) {
            showNotification('error', 'Tên tag không được để trống');
            return;
        }

        try {
            setUploading(true);

            const { error } = await supabase.rpc('posts_admin_update_tag', {
                p_tag_id: editingTag.id,
                p_name: tagFormData.name.trim(),
                p_description: tagFormData.description.trim() || null
            });

            if (error) throw error;

            showNotification('success', 'Cập nhật tag thành công');
            resetTagForm();
            loadTags();
            tagsTabRef.current?.reload();
        } catch (err) {
            console.error('Error updating tag:', err);
            const code = getErrorCode(err);
            if (code === '23505') {
                showNotification('error', 'Tag với tên này đã tồn tại');
            } else {
                showNotification('error', 'Lỗi khi cập nhật tag: ' + getErrorMessage(err));
            }
        } finally {
            setUploading(false);
        }
    };

    const editTag = (tag: TagType) => {
        setEditingTag(tag);
        setTagFormData({
            name: tag.name,
            description: tag.description || ''
        });
        setShowTagForm(true);
    };

    const resetTagForm = () => {
        setShowTagForm(false);
        setEditingTag(null);
        setTagFormData({
            name: '',
            description: ''
        });
    };

    // Edit post handler
    const handleEditPost = (post: Post) => {
        setEditingPost(post);
        setFormData({
            title: post.title,
            description: post.description || '',
            type: post.type,
            content: post.content || '',
            thumbnail: null,
            published: post.published,
            selectedTags: post.tags?.map(tag => tag.id) || []
        });
        if (post.thumbnail) {
            setThumbnailPreview(post.thumbnail);
        }
        setShowForm(true);
    };

    // Review submission handler
    const handleReviewSubmission = (submission: PostSubmission) => {
        setReviewingSubmission(submission);
        setAdminNotes('');
        setShowReviewModal(true);
    };

    // Reset form
    const resetForm = () => {
        setShowForm(false);
        setEditingPost(null);
        setFormData({
            title: '',
            description: '',
            type: 'activity',
            content: '',
            thumbnail: null,
            published: false,
            selectedTags: []
        });
        setThumbnailPreview('');
        setTagSearch('');
        setShowTagDropdown(false);
        setPreviewContent('');
        setLivePreviewContent('');
        setPendingLiveContent('');
        if (editorRef.current) {
            editorRef.current.setContent('');
        }
    };

    // Handle tab reload
    const handleTabReload = () => {
        switch (activeTab) {
            case 'posts':
                postsTabRef.current?.reload();
                break;
            case 'submissions':
                submissionsTabRef.current?.reload();
                break;
            case 'tags':
                tagsTabRef.current?.reload();
                break;
        }
    };

    // Effects
    useEffect(() => {
        loadTags();
    }, []);

    useEffect(() => {
        if (showForm) {
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
    }, [showForm]);

    useEffect(() => {
        return () => {
            if (showLivePreview && !isLivePreviewClosing) {
                handleCloseLivePreview();
            }
        };
    }, []);

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h2>
                    <p className="text-gray-600">Bạn cần quyền admin để truy cập trang này.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            {/* Notification */}
            {notification && (
                <div
                    className={`fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg max-w-sm w-full ${
                        notification.type === 'success'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : notification.type === 'error'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}
                >
                    <div className="flex items-center">
                        {notification.type === 'success' && <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                        {notification.type === 'error' && <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                        {notification.type === 'warning' && <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                        <span className="flex-1">{notification.message}</span>
                        <button
                            onClick={() => setNotification(null)}
                            className="ml-4 text-gray-500 hover:text-gray-700 flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <SectionHeader
                    title="QUẢN LÝ BÀI VIẾT"
                    subtitle="Tạo và quản lý các bài viết hoạt động và blog, duyệt bài viết của mentor"
                />

                {/* Tabs */}
                <div className="mb-8 bg-white rounded-xl shadow-sm">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={`${
                                    activeTab === 'posts'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                            >
                                <Edit className="w-4 h-4" />
                                Quản lý bài viết
                            </button>
                            <button
                                onClick={() => setActiveTab('submissions')}
                                className={`${
                                    activeTab === 'submissions'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Duyệt bài viết
                            </button>
                            <button
                                onClick={() => setActiveTab('tags')}
                                className={`${
                                    activeTab === 'tags'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                            >
                                <Tag className="w-4 h-4" />
                                Quản lý Tag
                            </button>
                        </nav>
                    </div>

                    {/* Controls */}
                    <div className="p-6">
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex gap-4">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả loại</option>
                                    <option value="activity">Hoạt động</option>
                                    <option value="blog">Blog</option>
                                </select>

                                <select
                                    value={filterTag}
                                    onChange={(e) => setFilterTag(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả tag</option>
                                    {tags.map(tag => (
                                        <option key={tag.id} value={tag.id}>
                                            {tag.name} ({tag.post_count || 0})
                                        </option>
                                    ))}
                                </select>

                                {activeTab === 'posts' ? (
                                    <select
                                        value={filterPublished}
                                        onChange={(e) => setFilterPublished(e.target.value as typeof filterPublished)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="published">Đã xuất bản</option>
                                        <option value="draft">Bản nháp</option>
                                    </select>
                                ) : activeTab === 'submissions' ? (
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="pending">Chờ duyệt</option>
                                        <option value="approved">Đã duyệt</option>
                                        <option value="rejected">Từ chối</option>
                                    </select>
                                ) : null}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    onClick={handleTabReload}
                                    disabled={loading}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    Tải lại
                                </Button>
                                {activeTab === 'posts' && (
                                    <Button
                                        onClick={() => setShowForm(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Bài viết mới
                                    </Button>
                                )}
                                {activeTab === 'tags' && (
                                    <Button
                                        onClick={() => setShowTagForm(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Tag mới
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {activeTab === 'posts' && (
                        <PostsTab
                            ref={postsTabRef}
                            searchTerm={searchTerm}
                            filterType={filterType}
                            filterPublished={filterPublished}
                            filterTag={filterTag}
                            onEditPost={handleEditPost}
                            showNotification={showNotification}
                        />
                    )}

                    {activeTab === 'submissions' && (
                        <SubmissionsTab
                            ref={submissionsTabRef}
                            searchTerm={searchTerm}
                            filterType={filterType}
                            filterStatus={filterStatus}
                            filterTag={filterTag}
                            onReviewSubmission={handleReviewSubmission}
                            showNotification={showNotification}
                        />
                    )}

                    {activeTab === 'tags' && (
                        <TagsTab
                            ref={tagsTabRef}
                            searchTerm={searchTerm}
                            onEditTag={editTag}
                            showNotification={showNotification}
                        />
                    )}
                </div>

                {/* Post Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={resetForm}
                        />

                        <div className="relative bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">
                                        {editingPost ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
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
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tiêu đề bài viết
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập tiêu đề bài viết..."
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mô tả bài viết
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập mô tả ngắn về bài viết..."
                                    />
                                </div>

                                {/* Post Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loại bài viết
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'activity' | 'blog' }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="activity">Hoạt động</option>
                                        <option value="blog">Blog</option>
                                    </select>
                                </div>

                                {/* Thumbnail */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ảnh đại diện
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleThumbnailChange}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            <Upload className="w-5 h-5" />
                                            Chọn ảnh
                                        </button>
                                        {thumbnailPreview && (
                                            <div className="relative w-20 h-20">
                                                <Image
                                                    src={thumbnailPreview}
                                                    alt="Preview"
                                                    fill
                                                    className="object-cover rounded-lg"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tags
                                    </label>

                                    {/* Selected Tags */}
                                    {formData.selectedTags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {formData.selectedTags.map(tagId => {
                                                const tag = tags.find(t => t.id === tagId);
                                                return tag ? (
                                                    <span
                                                        key={tagId}
                                                        className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800"
                                                    >
                                                        <Tag className="w-3 h-3 mr-1" />
                                                        {tag.name}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleTag(tagId)}
                                                            className="ml-2 text-blue-600 hover:text-blue-800"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    )}

                                    {/* Tag Search & Dropdown */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={tagSearch}
                                            onChange={(e) => setTagSearch(e.target.value)}
                                            onFocus={() => setShowTagDropdown(true)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Tìm kiếm và chọn tags..."
                                        />

                                        {showTagDropdown && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setShowTagDropdown(false)}
                                                />
                                                <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {filteredTags.length > 0 ? (
                                                        filteredTags.map(tag => (
                                                            <button
                                                                key={tag.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    toggleTag(tag.id);
                                                                    setTagSearch('');
                                                                    setShowTagDropdown(false);
                                                                }}
                                                                className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                                                                    formData.selectedTags.includes(tag.id) ? 'bg-blue-50 text-blue-800' : ''
                                                                }`}
                                                            >
                                                                <Tag className="w-3 h-3" />
                                                                <span className="font-medium">{tag.name}</span>
                                                                {tag.description && (
                                                                    <span className="text-xs text-gray-500 ml-auto">
                                                                        {tag.description}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-2 text-gray-500 text-sm">
                                                            Không tìm thấy tag nào
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Content Editor */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nội dung bài viết
                                    </label>

                                    {/* Preview Controls */}
                                    <div className="flex gap-4 mb-4">
                                        <button
                                            type="button"
                                            onClick={handlePreview}
                                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Preview
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleLivePreview}
                                            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Live Preview
                                        </button>
                                    </div>

                                    <Editor
                                        key={editingPost ? editingPost.id : 'new'}
                                        tinymceScriptSrc="/tinymce/tinymce.min.js"
                                        onInit={(evt, editor) => {
                                            editorRef.current = editor;
                                            if (editingPost?.content) {
                                                setTimeout(() => editor.setContent(editingPost.content), 100);
                                            }
                                        }}
                                        licenseKey="gpl"
                                        initialValue={editingPost?.content || ''}
                                        init={{
                                            base_url: '/tinymce',
                                            suffix: '.min',
                                            height: 560,
                                            menubar: 'file edit view insert format tools table help',
                                            plugins: [
                                                'advlist', 'anchor', 'autolink', 'autosave', 'charmap', 'code', 'codesample',
                                                'directionality', 'emoticons', 'fullscreen', 'help', 'image', 'importcss',
                                                'insertdatetime', 'link', 'lists', 'media', 'nonbreaking', 'pagebreak',
                                                'preview', 'quickbars', 'searchreplace', 'table', 'visualblocks',
                                                'visualchars', 'wordcount'
                                            ],
                                            toolbar: [
                                                'undo redo | restoredraft',
                                                'blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor removeformat',
                                                'alignleft aligncenter alignright alignjustify | lineheight | ltr rtl',
                                                'bullist numlist outdent indent',
                                                'link anchor | image media | table codesample charmap emoticons pagebreak nonbreaking insertdatetime',
                                                'searchreplace visualblocks visualchars code help'
                                            ].join(' | '),
                                            font_family_formats:
                                                'Inter=Inter,sans-serif;Arial=arial,helvetica,sans-serif;Georgia=georgia,serif;Courier New=courier new,courier,monospace',
                                            fontsize_formats: '12px 14px 16px 18px 20px 24px 28px 32px',
                                            line_height_formats: '1 1.15 1.33 1.5 1.75 2',
                                            quickbars_selection_toolbar:
                                                'bold italic underline | forecolor backcolor | link | h2 h3 blockquote | bullist numlist',
                                            quickbars_insert_toolbar: 'image media table | hr pagebreak',
                                            quickbars_image_toolbar: 'wrapleft wrapright wrapcenter | clearwrap',
                                            image_advtab: true,
                                            image_dimensions: false,
                                            image_title: true,
                                            file_picker_types: 'image media',
                                            content_css: [
                                                'data:text/css;charset=UTF-8,' + encodeURIComponent(`
                                                    body {
                                                        font-family: Inter, Arial, sans-serif;
                                                        font-size: 14px;
                                                        line-height: 1.7;
                                                        padding: 1rem;
                                                    }
                                                    img {
                                                        border-radius: 8px;
                                                        height: auto;
                                                    }
                                                    .wrap-left {
                                                        float: left !important;
                                                        margin: 0 2rem 1rem 0 !important;
                                                        clear: none !important;
                                                    }
                                                    .wrap-right {
                                                        float: right !important;
                                                        margin: 0 0 1rem 2rem !important;
                                                        clear: none !important;
                                                    }
                                                    .wrap-center {
                                                        display: block !important;
                                                        float: none !important;
                                                        margin: 2rem auto !important;
                                                        clear: both !important;
                                                    }
                                                    p {
                                                        margin-bottom: 1rem;
                                                        overflow: visible !important;
                                                    }
                                                    p:has(.wrap-left),
                                                    p:has(.wrap-right) {
                                                        overflow: visible !important;
                                                        min-height: 50px !important;
                                                    }
                                                    .clear-wrap {
                                                        clear: both !important;
                                                        height: 0 !important;
                                                        margin: 1rem 0 !important;
                                                        font-size: 0 !important;
                                                        line-height: 0 !important;
                                                    }
                                                    table {
                                                        border-collapse: collapse;
                                                        width: 100%;
                                                    }
                                                    table td, table th {
                                                        border: 1px solid #e5e7eb;
                                                        padding: .5rem;
                                                    }
                                                    @media (max-width: 768px) {
                                                        .wrap-left,
                                                        .wrap-right {
                                                            float: none !important;
                                                            display: block !important;
                                                            margin: 1rem auto !important;
                                                        }
                                                    }
                                                `)
                                            ],
                                            setup: function (editor) {
                                                const fireWrapChange = (img: HTMLElement) => {
                                                    editor.fire('ObjectResized', { target: img } as any);
                                                };

                                                editor.addCommand('WrapImageLeft', function () {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                        img.classList.add('wrap-left');
                                                        const parent = img.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') parent.style.overflow = 'visible';
                                                        editor.undoManager.add();
                                                        fireWrapChange(img);
                                                    }
                                                });

                                                editor.addCommand('WrapImageRight', function () {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                        img.classList.add('wrap-right');
                                                        const parent = img.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') parent.style.overflow = 'visible';
                                                        editor.undoManager.add();
                                                        fireWrapChange(img);
                                                    }
                                                });

                                                editor.addCommand('WrapImageCenter', function () {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                        img.classList.add('wrap-center');
                                                        const parent = img.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') (parent as HTMLElement).style.textAlign = 'center';
                                                        editor.undoManager.add();
                                                        fireWrapChange(img);
                                                    }
                                                });

                                                editor.addCommand('ClearImageWrap', function () {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        const hasWrap =
                                                            img.classList.contains('wrap-left') ||
                                                            img.classList.contains('wrap-right') ||
                                                            img.classList.contains('wrap-center');
                                                        if (hasWrap) {
                                                            img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                            const parent = img.parentNode as HTMLElement;
                                                            if (parent && parent.tagName === 'P') parent.removeAttribute('style');
                                                        }
                                                        editor.undoManager.add();
                                                        fireWrapChange(img);
                                                    }
                                                });

                                                editor.ui.registry.addButton('wrapleft', {
                                                    icon: 'align-left',
                                                    tooltip: 'Text wrap bên phải ảnh',
                                                    onAction: function () {
                                                        const img = editor.selection.getNode() as HTMLElement;
                                                        if (img && img.tagName === 'IMG') {
                                                            if (img.classList.contains('wrap-left')) {
                                                                editor.execCommand('ClearImageWrap');
                                                            } else {
                                                                editor.execCommand('WrapImageLeft');
                                                            }
                                                        }
                                                    }
                                                });

                                                editor.ui.registry.addButton('wrapright', {
                                                    icon: 'align-right',
                                                    tooltip: 'Text wrap bên trái ảnh',
                                                    onAction: function () {
                                                        const img = editor.selection.getNode() as HTMLElement;
                                                        if (img && img.tagName === 'IMG') {
                                                            if (img.classList.contains('wrap-right')) {
                                                                editor.execCommand('ClearImageWrap');
                                                            } else {
                                                                editor.execCommand('WrapImageRight');
                                                            }
                                                        }
                                                    }
                                                });

                                                editor.ui.registry.addButton('wrapcenter', {
                                                    icon: 'align-center',
                                                    tooltip: 'Căn giữa ảnh',
                                                    onAction: function () {
                                                        const img = editor.selection.getNode() as HTMLElement;
                                                        if (img && img.tagName === 'IMG') {
                                                            if (img.classList.contains('wrap-center')) {
                                                                editor.execCommand('ClearImageWrap');
                                                            } else {
                                                                editor.execCommand('WrapImageCenter');
                                                            }
                                                        }
                                                    }
                                                });

                                                editor.ui.registry.addButton('clearwrap', {
                                                    icon: 'remove',
                                                    tooltip: 'Xóa text wrap',
                                                    onAction: function () {
                                                        editor.execCommand('ClearImageWrap');
                                                    }
                                                });

                                                editor.on('NodeChange', function () {
                                                    const wrappedImages = editor.dom.select('img.wrap-left, img.wrap-right');
                                                    wrappedImages.forEach((imgEl) => {
                                                        const parent = imgEl.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') parent.style.overflow = 'visible';
                                                    });
                                                });
                                            },
                                            images_upload_handler: async (blobInfo: any) => {
                                                try {
                                                    const blob = blobInfo.blob();
                                                    if (!blob) {
                                                        throw new Error('Không thể lấy dữ liệu ảnh');
                                                    }
                                                    const file = new File(
                                                        [blob],
                                                        blobInfo.filename() || `image-${Date.now()}.jpg`,
                                                        { type: blob.type || 'image/jpeg' }
                                                    );
                                                    const url = await uploadImage(file);
                                                    return url;
                                                } catch (err) {
                                                    console.error('Upload error:', err);
                                                    throw new Error('Lỗi upload ảnh: ' + getErrorMessage(err));
                                                }
                                            },
                                            file_picker_callback: (cb: any, value: any, meta: any) => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = meta.filetype === 'media' ? 'video/*,audio/*' : 'image/*';
                                                input.onchange = async () => {
                                                    const f = (input as HTMLInputElement).files?.[0];
                                                    if (!f) return;
                                                    try {
                                                        const url = await uploadImage(f);
                                                        cb(url, { title: f.name });
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                };
                                                input.click();
                                            },
                                            media_live_embeds: true,
                                            media_url_resolver: (data: any, resolve: any) => {
                                                const url = data.url;
                                                const yt = /(?:youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_-]+)/.exec(url);
                                                if (yt) {
                                                    resolve({
                                                        html: `<iframe width="560" height="315" src="https://www.youtube.com/embed/${yt[1]}" frameborder="0" allowfullscreen></iframe>`
                                                    });
                                                    return;
                                                }
                                                resolve({ url });
                                            },
                                            table_header_type: 'sectionCells',
                                            table_toolbar:
                                                'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | cellprops',
                                            table_resize_bars: true,
                                            autosave_ask_before_unload: true,
                                            autosave_interval: '20s',
                                            autosave_retention: '30m',
                                            link_default_target: '_blank',
                                            link_assume_external_targets: true,
                                            branding: false,
                                            promotion: false,
                                            statusbar: true,
                                            elementpath: false,
                                            toolbar_mode: 'sliding',
                                            extended_valid_elements: 'div[class|style],img[class|src|alt|title|width|height]',
                                            keep_styles: false,
                                            contextmenu: 'link image table spellchecker',
                                        }}
                                    />
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
                                        Xuất bản ngay
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
                                    onClick={savePost}
                                    disabled={uploading || !formData.title.trim()}
                                    className="flex items-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {editingPost ? 'Cập nhật' : 'Tạo bài viết'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Preview Modal */}
                        {showPreview && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                                <div
                                    className="absolute inset-0 bg-gray-900/50"
                                    onClick={() => setShowPreview(false)}
                                />

                                <div className="relative bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
                                    <div className="p-6 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold">Preview Bài Viết</h3>
                                            <button
                                                onClick={() => setShowPreview(false)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                                        <div className="mb-8 pb-6 border-b border-gray-200">
                                            <div className="mb-3">
                                                <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 text-sm font-semibold rounded-full">
                                                    {formData.type === 'activity' ? 'TIN TỨC & SỰ KIỆN' : 'BLOG HR COMPANION'}
                                                </span>
                                            </div>

                                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                                                {formData.title || 'Tiêu đề bài viết'}
                                            </h1>

                                            {formData.description && (
                                                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                                                    {formData.description}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-5 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-5 h-5" />
                                                    <span>{new Date().toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <span className="hidden sm:inline text-gray-300">•</span>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-5 h-5" />
                                                    <span>5 phút đọc</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className="preview-content tinymce-content prose prose-lg max-w-none"
                                            dangerouslySetInnerHTML={{ __html: previewContent }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Live Preview Modal */}
                        {showLivePreview && (
                            <div
                                className="fixed inset-0 z-[60] bg-white"
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        handleCloseLivePreview();
                                    }
                                }}
                                tabIndex={-1}
                            >
                                <div className="h-full flex flex-col">
                                    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                        <h3 className="text-lg font-bold">Live Preview - {formData.title || 'Bài viết mới'}</h3>
                                        <button
                                            onClick={handleCloseLivePreview}
                                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                            Thoát
                                        </button>
                                    </div>

                                    <div className="flex-1 flex overflow-hidden">
                                        {/* Editor Side */}
                                        <div className="w-1/2 border-r border-gray-200 flex flex-col">
                                            <div className="p-3 bg-gray-50 border-b border-gray-200">
                                                <h4 className="font-semibold text-gray-700">Editor</h4>
                                            </div>
                                            <div className="flex-1">
                                                <Editor
                                                    key={`live-editor-${editingPost?.id || 'new'}`}
                                                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                                                    onInit={(evt, editor) => {
                                                        liveEditorRef.current = editor;
                                                        const currentContent = livePreviewContent || editorRef.current?.getContent() || editingPost?.content || '';
                                                        if (currentContent) {
                                                            setTimeout(() => {
                                                                editor.setContent(currentContent);
                                                                setPreviewContent(currentContent);
                                                                setLivePreviewContent(currentContent);
                                                                setPendingLiveContent(currentContent);
                                                            }, 100);
                                                        }
                                                    }}
                                                    licenseKey="gpl"
                                                    init={{
                                                        base_url: '/tinymce',
                                                        suffix: '.min',
                                                        height: 'calc(100vh - 140px)',
                                                        menubar: 'file edit view insert format tools table help',
                                                        branding: false,
                                                        promotion: false,
                                                        statusbar: false,
                                                        plugins: [
                                                            'advlist', 'anchor', 'autolink', 'autosave', 'charmap', 'code', 'codesample',
                                                            'directionality', 'emoticons', 'fullscreen', 'help', 'image', 'importcss',
                                                            'insertdatetime', 'link', 'lists', 'media', 'nonbreaking', 'pagebreak',
                                                            'preview', 'quickbars', 'searchreplace', 'table', 'visualblocks',
                                                            'visualchars', 'wordcount'
                                                        ],
                                                        toolbar: [
                                                            'undo redo | restoredraft',
                                                            'blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor removeformat',
                                                            'alignleft aligncenter alignright alignjustify | lineheight | ltr rtl',
                                                            'bullist numlist outdent indent',
                                                            'link anchor | image media | table codesample charmap emoticons pagebreak nonbreaking insertdatetime',
                                                            'searchreplace visualblocks visualchars code help'
                                                        ].join(' | '),
                                                        font_family_formats:
                                                            'Inter=Inter,sans-serif;Arial=arial,helvetica,sans-serif;Georgia=georgia,serif;Courier New=courier new,courier,monospace',
                                                        fontsize_formats: '12px 14px 16px 18px 20px 24px 28px 32px',
                                                        line_height_formats: '1 1.15 1.33 1.5 1.75 2',
                                                        quickbars_selection_toolbar:
                                                            'bold italic underline | forecolor backcolor | link | h2 h3 blockquote | bullist numlist',
                                                        quickbars_insert_toolbar: 'image media table | hr pagebreak',
                                                        quickbars_image_toolbar: 'wrapleft wrapright wrapcenter | clearwrap',
                                                        image_advtab: true,
                                                        image_dimensions: false,
                                                        image_title: true,
                                                        file_picker_types: 'image media',
                                                        content_css: [
                                                            'data:text/css;charset=UTF-8,' + encodeURIComponent(`
                                                                body {
                                                                    font-family: Inter, Arial, sans-serif;
                                                                    font-size: 14px;
                                                                    line-height: 1.7;
                                                                    padding: 1rem;
                                                                }
                                                                img {
                                                                    border-radius: 8px;
                                                                    height: auto;
                                                                }
                                                                .wrap-left {
                                                                    float: left !important;
                                                                    margin: 0 2rem 1rem 0 !important;
                                                                    clear: none !important;
                                                                }
                                                                .wrap-right {
                                                                    float: right !important;
                                                                    margin: 0 0 1rem 2rem !important;
                                                                    clear: none !important;
                                                                }
                                                                .wrap-center {
                                                                    display: block !important;
                                                                    float: none !important;
                                                                    margin: 2rem auto !important;
                                                                    clear: both !important;
                                                                }
                                                                p {
                                                                    margin-bottom: 1rem;
                                                                    overflow: visible !important;
                                                                }
                                                                p:has(.wrap-left),
                                                                p:has(.wrap-right) {
                                                                    overflow: visible !important;
                                                                    min-height: 50px !important;
                                                                }
                                                                table {
                                                                    border-collapse: collapse;
                                                                    width: 100%;
                                                                }
                                                                table td, table th {
                                                                    border: 1px solid #e5e7eb;
                                                                    padding: .5rem;
                                                                }
                                                                @media (max-width: 768px) {
                                                                    .wrap-left,
                                                                    .wrap-right {
                                                                        float: none !important;
                                                                        display: block !important;
                                                                        margin: 1rem auto !important;
                                                                    }
                                                                }
                                                            `)
                                                        ],
                                                        setup: function(editor) {
                                                            const fireWrapChange = (img: HTMLElement) => {
                                                                editor.fire('ObjectResized', { target: img } as any);
                                                            };

                                                            editor.addCommand('WrapImageLeft', function () {
                                                                const img = editor.selection.getNode() as HTMLElement;
                                                                if (img && img.tagName === 'IMG') {
                                                                    img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                                    img.classList.add('wrap-left');
                                                                    const parent = img.parentNode as HTMLElement;
                                                                    if (parent && parent.tagName === 'P') parent.style.overflow = 'visible';
                                                                    editor.undoManager.add();
                                                                    fireWrapChange(img);
                                                                }
                                                            });

                                                            editor.addCommand('WrapImageRight', function () {
                                                                const img = editor.selection.getNode() as HTMLElement;
                                                                if (img && img.tagName === 'IMG') {
                                                                    img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                                    img.classList.add('wrap-right');
                                                                    const parent = img.parentNode as HTMLElement;
                                                                    if (parent && parent.tagName === 'P') parent.style.overflow = 'visible';
                                                                    editor.undoManager.add();
                                                                    fireWrapChange(img);
                                                                }
                                                            });

                                                            editor.addCommand('WrapImageCenter', function () {
                                                                const img = editor.selection.getNode() as HTMLElement;
                                                                if (img && img.tagName === 'IMG') {
                                                                    img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                                    img.classList.add('wrap-center');
                                                                    const parent = img.parentNode as HTMLElement;
                                                                    if (parent && parent.tagName === 'P') (parent as HTMLElement).style.textAlign = 'center';
                                                                    editor.undoManager.add();
                                                                    fireWrapChange(img);
                                                                }
                                                            });

                                                            editor.addCommand('ClearImageWrap', function () {
                                                                const img = editor.selection.getNode() as HTMLElement;
                                                                if (img && img.tagName === 'IMG') {
                                                                    const hasWrap =
                                                                        img.classList.contains('wrap-left') ||
                                                                        img.classList.contains('wrap-right') ||
                                                                        img.classList.contains('wrap-center');
                                                                    if (hasWrap) {
                                                                        img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                                        const parent = img.parentNode as HTMLElement;
                                                                        if (parent && parent.tagName === 'P') parent.removeAttribute('style');
                                                                    }
                                                                    editor.undoManager.add();
                                                                    fireWrapChange(img);
                                                                }
                                                            });

                                                            editor.ui.registry.addButton('wrapleft', {
                                                                icon: 'align-left',
                                                                tooltip: 'Text wrap bên phải ảnh',
                                                                onAction: function () {
                                                                    const img = editor.selection.getNode() as HTMLElement;
                                                                    if (img && img.tagName === 'IMG') {
                                                                        if (img.classList.contains('wrap-left')) {
                                                                            editor.execCommand('ClearImageWrap');
                                                                        } else {
                                                                            editor.execCommand('WrapImageLeft');
                                                                        }
                                                                    }
                                                                }
                                                            });

                                                            editor.ui.registry.addButton('wrapright', {
                                                                icon: 'align-right',
                                                                tooltip: 'Text wrap bên trái ảnh',
                                                                onAction: function () {
                                                                    const img = editor.selection.getNode() as HTMLElement;
                                                                    if (img && img.tagName === 'IMG') {
                                                                        if (img.classList.contains('wrap-right')) {
                                                                            editor.execCommand('ClearImageWrap');
                                                                        } else {
                                                                            editor.execCommand('WrapImageRight');
                                                                        }
                                                                    }
                                                                }
                                                            });

                                                            editor.ui.registry.addButton('wrapcenter', {
                                                                icon: 'align-center',
                                                                tooltip: 'Căn giữa ảnh',
                                                                onAction: function () {
                                                                    const img = editor.selection.getNode() as HTMLElement;
                                                                    if (img && img.tagName === 'IMG') {
                                                                        if (img.classList.contains('wrap-center')) {
                                                                            editor.execCommand('ClearImageWrap');
                                                                        } else {
                                                                            editor.execCommand('WrapImageCenter');
                                                                        }
                                                                    }
                                                                }
                                                            });

                                                            editor.ui.registry.addButton('clearwrap', {
                                                                icon: 'remove',
                                                                tooltip: 'Xóa text wrap',
                                                                onAction: function () {
                                                                    editor.execCommand('ClearImageWrap');
                                                                }
                                                            });

                                                            let syncTimeout: NodeJS.Timeout;
                                                            let lastSyncTime = 0;

                                                            const performSync = () => {
                                                                const now = Date.now();
                                                                if (now - lastSyncTime < 100) return;

                                                                lastSyncTime = now;
                                                                const content = editor.getContent();

                                                                setPreviewContent(content);
                                                                setPendingLiveContent(content);

                                                                clearTimeout(syncTimeout);
                                                                syncTimeout = setTimeout(() => {
                                                                    if (editorRef.current && !isLivePreviewClosing) {
                                                                        try {
                                                                            editorRef.current.setContent(content);
                                                                            setFormData(prev => ({ ...prev, content }));
                                                                        } catch (error) {
                                                                            console.warn('Sync to main editor failed:', error);
                                                                        }
                                                                    }
                                                                }, 300);
                                                            };

                                                            editor.on('KeyUp Change Input NodeChange', performSync);
                                                            editor.on('Paste Undo Redo ExecCommand', () => {
                                                                setTimeout(performSync, 50);
                                                            });

                                                            const intervalSync = setInterval(() => {
                                                                if (!isLivePreviewClosing) {
                                                                    performSync();
                                                                } else {
                                                                    clearInterval(intervalSync);
                                                                }
                                                            }, 2000);

                                                            editor.on('blur', () => {
                                                                setTimeout(performSync, 100);
                                                            });

                                                            editor.on('remove', () => {
                                                                clearTimeout(syncTimeout);
                                                                clearInterval(intervalSync);
                                                            });
                                                        },
                                                        images_upload_handler: async (blobInfo: any) => {
                                                            try {
                                                                const blob = blobInfo.blob();
                                                                if (!blob) {
                                                                    throw new Error('Không thể lấy dữ liệu ảnh');
                                                                }
                                                                const file = new File(
                                                                    [blob],
                                                                    blobInfo.filename() || `image-${Date.now()}.jpg`,
                                                                    { type: blob.type || 'image/jpeg' }
                                                                );
                                                                const url = await uploadImage(file);
                                                                return url;
                                                            } catch (err) {
                                                                throw 'Lỗi upload ảnh: ' + err;
                                                            }
                                                        },
                                                        file_picker_callback: (cb: any, value: any, meta: any) => {
                                                            const input = document.createElement('input');
                                                            input.type = 'file';
                                                            input.accept = meta.filetype === 'media' ? 'video/*,audio/*' : 'image/*';
                                                            input.onchange = async () => {
                                                                const f = (input as HTMLInputElement).files?.[0];
                                                                if (!f) return;
                                                                try {
                                                                    const url = await uploadImage(f);
                                                                    cb(url, { title: f.name });
                                                                } catch (e) {
                                                                    console.error(e);
                                                                }
                                                            };
                                                            input.click();
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Preview Side */}
                                        <div className="w-1/2 flex flex-col">
                                            <div className="p-3 bg-gray-50 border-b border-gray-200">
                                                <h4 className="font-semibold text-gray-700">Preview</h4>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-white">
                                                <div className="mb-8 pb-6 border-b border-gray-200">
                                                    <div className="mb-3">
                                                        <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 text-sm font-semibold rounded-full">
                                                            {formData.type === 'activity' ? 'TIN TỨC & SỰ KIỆN' : 'BLOG HR COMPANION'}
                                                        </span>
                                                    </div>

                                                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                                                        {formData.title || 'Tiêu đề bài viết'}
                                                    </h1>

                                                    {formData.description && (
                                                        <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                                                            {formData.description}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-5 text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-5 h-5" />
                                                            <span>{new Date().toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                        <span className="hidden sm:inline text-gray-300">•</span>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-5 h-5" />
                                                            <span>5 phút đọc</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    className="live-preview-content tinymce-content prose prose-lg max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: previewContent }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Review Modal */}
                {showReviewModal && reviewingSubmission && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={() => setShowReviewModal(false)}
                        />

                        <div className="relative bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">
                                        Duyệt bài viết
                                    </h3>
                                    <button
                                        onClick={() => setShowReviewModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Post Info */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                        {reviewingSubmission.posts?.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Tác giả: {reviewingSubmission.profiles?.full_name}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>Loại: {reviewingSubmission.posts?.type === 'activity' ? 'Hoạt động' : 'Blog'}</span>
                                        <span>Gửi lúc: {new Date(reviewingSubmission.submitted_at).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>

                                {/* Admin Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ghi chú của admin
                                    </label>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập ghi chú hoặc lý do từ chối..."
                                    />
                                </div>

                                {/* Previous Notes */}
                                {reviewingSubmission.admin_notes && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ghi chú trước đó
                                        </label>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-700">{reviewingSubmission.admin_notes}</p>
                                            {reviewingSubmission.reviewed_by_profile && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Được duyệt bởi: {reviewingSubmission.reviewed_by_profile.full_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Review Actions */}
                            <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowReviewModal(false)}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={rejectSubmission}
                                    disabled={uploading}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-4 h-4" />
                                            Từ chối
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={approveSubmission}
                                    disabled={uploading}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Duyệt bài
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tag Form Modal */}
                {showTagForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                            onClick={resetTagForm}
                        />

                        <div className="relative bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">
                                        {editingTag ? 'Chỉnh sửa Tag' : 'Tạo Tag Mới'}
                                    </h3>
                                    <button
                                        onClick={resetTagForm}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Tag Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên tag *
                                    </label>
                                    <input
                                        type="text"
                                        value={tagFormData.name}
                                        onChange={(e) => setTagFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập tên tag..."
                                        maxLength={50}
                                    />
                                </div>

                                {/* Tag Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mô tả
                                    </label>
                                    <textarea
                                        value={tagFormData.description}
                                        onChange={(e) => setTagFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập mô tả cho tag..."
                                    />
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={resetTagForm}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={editingTag ? updateTag : createTag}
                                    disabled={uploading || !tagFormData.name.trim()}
                                    className="flex items-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {editingTag ? 'Đang cập nhật...' : 'Đang tạo...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {editingTag ? 'Cập nhật' : 'Tạo tag'}
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

export default PostPage;