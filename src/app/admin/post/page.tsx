'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { SectionHeader } from '@/component/SectionHeader';
import { supabase } from '@/utils/supabase/client';

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
    Check,
    Clock,
    XCircle,
    AlertCircle,
    CheckCircle,
    Loader2,
    RefreshCw,
    MessageSquare,
    User,
    Filter,
    Settings,
    Calendar
} from 'lucide-react';
import Image from 'next/image';
import { Editor } from '@tinymce/tinymce-react';
import { Tag } from 'lucide-react';
import Link from 'next/link';

// Bắt lỗi
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

// 4. THÊM FUNCTIONS XỬ LÝ PREVIEW (sau các helper functions khác)
const renderPreviewContent = (content: string) => {
    if (!content) return <p className="text-gray-500 italic">Nội dung đang được cập nhật...</p>;

    return (
        <div
            className="tinymce-content prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:text-lg prose-p:leading-relaxed prose-strong:text-gray-900 prose-a:text-cyan-600 prose-a:no-underline hover:prose-a:underline prose-ul:my-6 prose-ol:my-6 prose-li:text-gray-700 prose-li:text-lg prose-li:leading-relaxed prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-gray-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:text-lg prose-blockquote:italic prose-img:rounded-xl prose-img:shadow-lg prose-table:border-collapse prose-table:w-full prose-td:border prose-td:border-gray-300 prose-td:p-3 prose-th:border prose-th:border-gray-300 prose-th:p-3 prose-th:bg-gray-100"
            style={{
                lineHeight: '1.7',
                // Inline styles để thay thế global CSS
                '--tw-prose-ul': 'disc',
                '--tw-prose-ol': 'decimal',
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};


interface Tag {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    post_count?: number;
}

interface Post {
    id: string;
    title: string;
    description?: string;
    thumbnail: string | null;
    content: any;
    author_id: string;
    type: 'activity' | 'blog';
    published: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    profiles: {
        full_name: string;
        image_url?: string;
    };
    tags?: Tag[];
}

interface PostSubmission {
    id: string;
    post_id: string;
    author_id: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by: string | null;
    reviewed_at: string | null;
    admin_notes: string | null;
    submitted_at: string;
    created_at: string;
    updated_at: string;
    posts: Post;
    profiles: {
        full_name: string;
        image_url?: string;
    };
    reviewed_by_profile?: {
        full_name: string;
    };
}

interface PostFormData {
    title: string;
    description: string;
    type: 'activity' | 'blog';
    content: string;
    thumbnail: File | null;
    published: boolean;
    selectedTags: string[];
}

type TabType = 'posts' | 'submissions' | 'tags';

const PostPage: React.FC = () => {
    const { user } = useAuthStore();
    const editorRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const liveEditorRef = useRef<any>(null);

    // State management
    const [activeTab, setActiveTab] = useState<TabType>('posts');
    const [posts, setPosts] = useState<Post[]>([]);
    const [submissions, setSubmissions] = useState<PostSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [reviewingSubmission, setReviewingSubmission] = useState<PostSubmission | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [tags, setTags] = useState<Tag[]>([]);
    const [tagSearch, setTagSearch] = useState('');
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [showTagForm, setShowTagForm] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
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

    const [showPreview, setShowPreview] = useState(false);
    const [showLivePreview, setShowLivePreview] = useState(false);
    const [previewContent, setPreviewContent] = useState('');

    const handlePreview = () => {
        const content = editorRef.current?.getContent() || '';
        setPreviewContent(content);
        setShowPreview(true);
    };

    const handleLivePreview = () => {
        const content = editorRef.current?.getContent() || '';
        setPreviewContent(content);
        setShowLivePreview(true);
    };

    const updateLivePreview = () => {
        if (showLivePreview && liveEditorRef.current) {
            const content = liveEditorRef.current.getContent();
            setPreviewContent(content);
            // Sync ngược lại main editor
            if (editorRef.current) {
                editorRef.current.setContent(content);
            }
        }
    };


    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // Load Tags
    const loadTags = async () => {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select(`
                *,
                post_tags (
                    id
                )
            `)
                .order('name', { ascending: true });

            if (error) throw error;

            // Transform data to include post count
            const tagsWithCount = (data || []).map(tag => ({
                ...tag,
                post_count: tag.post_tags?.length || 0
            }));

            setTags(tagsWithCount);
        } catch (error) {
            console.error('Error loading tags:', error);
            showNotification('error', 'Không thể tải danh sách tag: ' + getErrorMessage(error));
        }
    };

    // Load posts
    const loadPosts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('posts')
                .select(`
                *,
                profiles (
                    full_name,
                    image_url
                ),
                post_tags (
                    tags (
                        id,
                        name,
                        description
                    )
                )
            `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform the data to include tags array
            const postsWithTags = (data || []).map(post => ({
                ...post,
                tags: post.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || []
            }));

            setPosts(postsWithTags);
        } catch (error) {
            console.error('Error loading posts:', error);
            showNotification('error', 'Không thể tải bài viết: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    // 4. tag management functions
    const createTag = async () => {
        if (!tagFormData.name.trim()) {
            showNotification('error', 'Tên tag không được để trống');
            return;
        }

        try {
            setUploading(true);

            const { error } = await supabase
                .from('tags')
                .insert([{
                    name: tagFormData.name.trim(),
                    description: tagFormData.description.trim() || null
                }]);

            if (error) throw error;

            showNotification('success', 'Tạo tag thành công');
            resetTagForm();
            loadTags();
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

            const { error } = await supabase
                .from('tags')
                .update({
                    name: tagFormData.name.trim(),
                    description: tagFormData.description.trim() || null
                })
                .eq('id', editingTag.id);

            if (error) throw error;

            showNotification('success', 'Cập nhật tag thành công');
            resetTagForm();
            loadTags();
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

    const deleteTag = async (tag: Tag) => {
        if (tag.post_count && tag.post_count > 0) {
            if (!confirm(`Tag "${tag.name}" đang được sử dụng bởi ${tag.post_count} bài viết. Bạn có chắc chắn muốn xóa?`)) {
                return;
            }
        } else {
            if (!confirm(`Bạn có chắc chắn muốn xóa tag "${tag.name}"?`)) {
                return;
            }
        }

        try {
            const { error } = await supabase
                .from('tags')
                .delete()
                .eq('id', tag.id);

            if (error) throw error;

            showNotification('success', 'Xóa tag thành công');
            loadTags();
        } catch (error) {
            console.error('Error deleting tag:', error);
            showNotification('error', 'Lỗi khi xóa tag: ' + getErrorMessage(error));
        }
    };

    const editTag = (tag: Tag) => {
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

    // Load post submissions
    const loadSubmissions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('post_submissions')
                .select(`
                *,
                posts (
                    *,
                    profiles (
                        full_name,
                        image_url
                    ),
                    post_tags (
                        tags (
                            id,
                            name,
                            description
                        )
                    )
                ),
                profiles!post_submissions_author_id_fkey (
                    full_name,
                    image_url
                ),
                reviewed_by_profile:profiles!post_submissions_reviewed_by_fkey (
                    full_name
                )
            `)
                .order('submitted_at', { ascending: false });

            if (error) throw error;

            // Transform the data to include tags array
            const submissionsWithTags = (data || []).map(submission => ({
                ...submission,
                posts: submission.posts ? {
                    ...submission.posts,
                    tags: submission.posts.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || []
                } : null
            }));

            setSubmissions(submissionsWithTags);
        } catch (error) {
            console.error('Error loading submissions:', error);
            showNotification('error', 'Không thể tải danh sách duyệt bài: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    // Upload image to Supabase Storage
    const uploadImage = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        const { data, error } = await supabase.storage
            .from('images')
            .upload(filePath, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    };

    // Handle thumbnail upload
    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, thumbnail: file }));

            // Create preview
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

    // Save post
    const savePost = async () => {
        if (!user) return;

        try {
            setUploading(true);

            let thumbnailUrl = editingPost?.thumbnail || '';
            if (formData.thumbnail) {
                thumbnailUrl = await uploadImage(formData.thumbnail);
            }

            // Get content from TinyMCE
            const content = editorRef.current?.getContent() || '';

            const postData = {
                title: formData.title,
                description: formData.description, // THÊM
                type: formData.type,
                content: content,
                thumbnail: thumbnailUrl || null,
                published: formData.published,
                published_at: formData.published ? new Date().toISOString() : null,
                author_id: user.id
            };

            let result;
            let postId;

            if (editingPost) {
                // Update existing post
                result = await supabase
                    .from('posts')
                    .update(postData)
                    .eq('id', editingPost.id)
                    .select('id')
                    .single();

                if (result.error) throw result.error;
                postId = editingPost.id;

                // Remove existing tags
                await supabase
                    .from('post_tags')
                    .delete()
                    .eq('post_id', postId);
            } else {
                // Create new post
                result = await supabase
                    .from('posts')
                    .insert([postData])
                    .select('id')
                    .single();

                if (result.error) throw result.error;
                postId = result.data.id;
            }

            // Add selected tags
            if (formData.selectedTags.length > 0) {
                const tagInserts = formData.selectedTags.map(tagId => ({
                    post_id: postId,
                    tag_id: tagId
                }));

                const tagResult = await supabase
                    .from('post_tags')
                    .insert(tagInserts);

                if (tagResult.error) throw tagResult.error;
            }

            showNotification('success', editingPost ? 'Cập nhật bài viết thành công' : 'Tạo bài viết thành công');
            resetForm();
            loadPosts();

        } catch (error) {
            console.error('Error saving post:', error);
            showNotification('error', 'Lỗi khi lưu bài viết: ' + getErrorMessage(error));
        } finally {
            setUploading(false);
        }
    };

    // Delete post
    const deletePost = async (postId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId);

            if (error) throw error;

            showNotification('success', 'Xóa bài viết thành công');
            loadPosts();
        } catch (error) {
            console.error('Error deleting post:', error);
            showNotification('error', 'Lỗi khi xóa bài viết: ' + getErrorMessage(error));
        }
    };

    // Toggle publish status
    const togglePublishStatus = async (postId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('posts')
                .update({
                    published: !currentStatus,
                    published_at: !currentStatus ? new Date().toISOString() : null
                })
                .eq('id', postId);

            if (error) throw error;

            showNotification('success', 'Cập nhật trạng thái thành công');
            loadPosts();
        } catch (error) {
            console.error('Error updating publish status:', error);
            showNotification('error', 'Lỗi khi cập nhật trạng thái: ' + getErrorMessage(error));
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
            loadSubmissions();
            if (activeTab === 'posts') loadPosts();

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
            loadSubmissions();

        } catch (error) {
            console.error('Error rejecting submission:', error);
            showNotification('error', 'Lỗi khi từ chối bài viết: ' + getErrorMessage(error));
        } finally {
            setUploading(false);
        }
    };

    // Edit post
    const editPost = (post: Post) => {
        setEditingPost(post);
        setFormData({
            title: post.title,
            description: post.description || '',
            type: post.type,
            content: '', // Will be set by TinyMCE
            thumbnail: null,
            published: post.published,
            selectedTags: post.tags?.map(tag => tag.id) || []
        });
        if (post.thumbnail) {
            setThumbnailPreview(post.thumbnail);
        }
        setShowForm(true);
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
        if (editorRef.current) {
            editorRef.current.setContent('');
        }
    };

    // Filter functions
    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (post.description && post.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'all' || post.type === filterType;
        const matchesPublished =
            filterPublished === 'all' ||
            (filterPublished === 'published' && post.published) ||
            (filterPublished === 'draft' && !post.published);
        const matchesTag = filterTag === 'all' ||
            (post.tags && post.tags.some(tag => tag.id === filterTag));

        return matchesSearch && matchesType && matchesPublished && matchesTag;
    });

    const filteredSubmissions = submissions.filter(submission => {
        const matchesSearch = submission.posts?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (submission.posts?.description && submission.posts.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'all' || submission.posts?.type === filterType;
        const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;
        const matchesTag = filterTag === 'all' ||
            (submission.posts?.tags && submission.posts.tags.some(tag => tag.id === filterTag));

        return matchesSearch && matchesType && matchesStatus && matchesTag;
    });

    const filteredTagsList = tags.filter(tag =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tag.description && tag.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Effects
    useEffect(() => {
        loadTags();
    }, []);

    useEffect(() => {
        if (activeTab === 'posts') {
            loadPosts();
        } else if (activeTab === 'submissions') {
            loadSubmissions();
        } else if (activeTab === 'tags') {
            // Tags already loaded in initial useEffect
        }
    }, [activeTab]);

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

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Chờ duyệt
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đã duyệt
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Từ chối
                    </span>
                );
            default:
                return null;
        }
    };

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
                                {submissions.filter(s => s.status === 'pending').length > 0 && (
                                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                        {submissions.filter(s => s.status === 'pending').length}
                                    </span>
                                )}
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
                                    placeholder="Tìm kiếm bài viết..."
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
                                ) : (
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
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => {
                                    if (activeTab === 'posts') loadPosts();
                                    else if (activeTab === 'submissions') loadSubmissions();
                                    else if (activeTab === 'tags') loadTags();
                                }} disabled={loading} className="flex items-center gap-2">
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
                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    ) : activeTab === 'tags' ? (
                        filteredTagsList.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-600">Không có tag nào.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số bài viết</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredTagsList.map((tag) => (
                                        <tr key={tag.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Tag className="w-4 h-4 text-gray-400 mr-2" />
                                                    <span className="text-sm font-medium text-gray-900">
                                    {tag.name}
                                </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">
                                                    {tag.description || 'Chưa có mô tả'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                                    {tag.post_count || 0} bài viết
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(tag.created_at).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => editTag(tag)}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteTag(tag)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : activeTab === 'posts' ? (
                        filteredPosts.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-600">Không có bài viết nào.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bài viết</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tác giả</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPosts.map((post) => (
                                        <tr key={post.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    {post.thumbnail && (
                                                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                                                            <Image
                                                                src={post.thumbnail}
                                                                alt=""
                                                                width={40}
                                                                height={40}
                                                                className="h-10 w-10 rounded-lg object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                                            {post.title}
                                                        </div>
                                                        {post.description && (
                                                            <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                                                                {post.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        post.type === 'activity'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {post.type === 'activity' ? 'Hoạt động' : 'Blog'}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {post.tags && post.tags.length > 0 ? (
                                                        post.tags.slice(0, 2).map((tag) => (
                                                            <span
                                                                key={tag.id}
                                                                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800"
                                                            >
                                                                <Tag className="w-3 h-3 mr-1" />
                                                                {tag.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Chưa có tag</span>
                                                    )}
                                                    {post.tags && post.tags.length > 2 && (
                                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800">
                                                            +{post.tags.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {post.profiles?.full_name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => togglePublishStatus(post.id, post.published)}
                                                    className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                                                        post.published
                                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                    }`}
                                                >
                                                    {post.published ? (
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
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => editPost(post)}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deletePost(post.id)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        // Submissions tab
                        filteredSubmissions.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-600">Không có bài viết nào cần duyệt.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bài viết</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mentor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày gửi</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredSubmissions.map((submission) => (
                                        <tr key={submission.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    {submission.posts?.thumbnail && (
                                                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                                                            <Image
                                                                src={submission.posts.thumbnail}
                                                                alt=""
                                                                width={40}
                                                                height={40}
                                                                className="h-10 w-10 rounded-lg object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                                            {submission.posts?.title}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {submission.profiles?.image_url ? (
                                                        <Image
                                                            src={submission.profiles.image_url}
                                                            alt=""
                                                            width={24}
                                                            height={24}
                                                            className="w-6 h-6 rounded-full mr-2"
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                                                            <User className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                    <span className="text-sm text-gray-900">
                                                            {submission.profiles?.full_name}
                                                        </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        submission.posts?.type === 'activity'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {submission.posts?.type === 'activity' ? 'Hoạt động' : 'Blog'}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(submission.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(submission.submitted_at).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    {submission.status === 'pending' && (
                                                        <button
                                                            onClick={() => {
                                                                setReviewingSubmission(submission);
                                                                setAdminNotes('');
                                                                setShowReviewModal(true);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                            title="Duyệt bài viết"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => window.open(`/posts/${submission.posts?.id}`, '_blank')}
                                                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                                                        title="Xem bài viết"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )

                    )

                    }
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

                                {/* Content Editor với Text Wrap Quickbar */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nội dung bài viết
                                    </label>

                                    {/* Preview Controls - Always visible */}
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
                                                'undo redo | restoredraft', // Bỏ preview và fullscreen
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

                                            /* Quickbars configuration */
                                            quickbars_selection_toolbar:
                                                'bold italic underline | forecolor backcolor | link | h2 h3 blockquote | bullist numlist',
                                            quickbars_insert_toolbar: 'image media table | hr pagebreak',

                                            /* QUICKBAR CHO HÌNH ẢNH - 3 nút wrap + nút clear */
                                            quickbars_image_toolbar: 'wrapleft wrapright wrapcenter | clearwrap',

                                            image_advtab: true,
                                            image_dimensions: false,
                                            image_title: true,
                                            file_picker_types: 'image media',

                                            /* CSS chỉ cho text wrapping - KHÔNG thay đổi kích thước ảnh */
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
                                
                                                    /* Text wrapping classes - KHÔNG THAY ĐỔI KÍCH THƯỚC */
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
                                
                                                    /* Container fixes */
                                                    p {
                                                        margin-bottom: 1rem;
                                                        overflow: visible !important;
                                                    }
                                
                                                    p:has(.wrap-left),
                                                    p:has(.wrap-right) {
                                                        overflow: visible !important;
                                                        min-height: 50px !important;
                                                    }
                                
                                                    /* Clear utility */
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
                                
                                                    /* Responsive */
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
                                                // Helper: báo TinyMCE là đối tượng "đã resize" (ép kiểu để TS không bắt lỗi)
                                                const fireWrapChange = (img: HTMLElement) => {
                                                    editor.fire('ObjectResized', { target: img } as any);
                                                };

                                                editor.on('KeyUp Change', function() {
                                                    setTimeout(updateLivePreview, 100);
                                                });

                                                // Command: Wrap Left
                                                editor.addCommand('WrapImageLeft', function () {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                        img.classList.add('wrap-left');

                                                        const parent = img.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') parent.style.overflow = 'visible';

                                                        editor.undoManager.add();
                                                        fireWrapChange(img); // <-- ép kiểu any
                                                    }
                                                });

                                                // Command: Wrap Right
                                                editor.addCommand('WrapImageRight', function () {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                        img.classList.add('wrap-right');

                                                        const parent = img.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') parent.style.overflow = 'visible';

                                                        editor.undoManager.add();
                                                        fireWrapChange(img); // <-- ép kiểu any
                                                    }
                                                });

                                                // Command: Wrap Center
                                                editor.addCommand('WrapImageCenter', function () {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                        img.classList.add('wrap-center');

                                                        const parent = img.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') (parent as HTMLElement).style.textAlign = 'center';

                                                        editor.undoManager.add();
                                                        fireWrapChange(img); // <-- ép kiểu any
                                                    }
                                                });

                                                // Command: Clear Wrap (toggle)
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
                                                        fireWrapChange(img); // <-- ép kiểu any
                                                    }
                                                });

                                                // Command: Insert Clear Div
                                                editor.addCommand('InsertClearDiv', function () {
                                                    editor.insertContent('<div class="clear-wrap">&nbsp;</div>');
                                                });

                                                // Buttons cho quickbar
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

                                                // Optional: thêm button vào toolbar chính
                                                editor.ui.registry.addButton('insertclear', {
                                                    icon: 'new-document',
                                                    tooltip: 'Thêm dòng clear',
                                                    onAction: function () {
                                                        editor.execCommand('InsertClearDiv');
                                                    }
                                                });

                                                // Auto-fix container khi có ảnh wrap
                                                editor.on('NodeChange', function () {
                                                    const wrappedImages = editor.dom.select('img.wrap-left, img.wrap-right');
                                                    wrappedImages.forEach((imgEl) => {
                                                        const parent = imgEl.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') parent.style.overflow = 'visible';
                                                    });
                                                });

                                                // Preserve classes khi preprocess/postprocess
                                                editor.on('PreProcess', function (e) {
                                                    const images = e.node.querySelectorAll('img[class*="wrap-"]');
                                                    images.forEach((imgEl) => {
                                                        const classes = imgEl.getAttribute('class');
                                                        if (classes) imgEl.setAttribute('data-mce-classes', classes);
                                                    });
                                                });

                                                editor.on('PostProcess', function (e) {
                                                    if (e.content) {
                                                        e.content = e.content.replace(/data-mce-classes="([^"]*)"/g, 'class="$1"');
                                                    }
                                                });
                                            },

                                            /* Upload ảnh vào Supabase Storage */
                                            images_upload_handler: async (blobInfo: any, progress?: (percent: number) => void) => {
                                                return new Promise(async (resolve, reject) => {
                                                    try {
                                                        const file = blobInfo.blob() as File;
                                                        const url = await uploadImage(file);
                                                        resolve(url);
                                                    } catch (err) {
                                                        reject('Lỗi upload ảnh: ' + (err as any));
                                                    }
                                                });
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

                                            /* Media embedding */
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

                                            /* Table settings */
                                            table_header_type: 'sectionCells',
                                            table_toolbar:
                                                'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | cellprops',
                                            table_resize_bars: true,

                                            /* Autosave */
                                            autosave_ask_before_unload: true,
                                            autosave_interval: '20s',
                                            autosave_retention: '30m',

                                            /* Link settings */
                                            link_default_target: '_blank',
                                            link_assume_external_targets: true,

                                            /* UI settings */
                                            branding: false,
                                            promotion: false,
                                            statusbar: true,
                                            elementpath: false,
                                            toolbar_mode: 'sliding',

                                            /* Preserve elements and classes */
                                            extended_valid_elements: 'div[class|style],img[class|src|alt|title|width|height]',
                                            keep_styles: false,

                                            /* Context menu (backup) */
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

                                    {/* Scrollable Content với smooth scrolling */}
                                    <div
                                        className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] scroll-smooth"
                                        style={{
                                            scrollBehavior: 'smooth',
                                            WebkitOverflowScrolling: 'touch',
                                            transform: 'translateZ(0)',
                                            backfaceVisibility: 'hidden',
                                            perspective: 1000,
                                        }}
                                    >
                                        {/* Post Header */}
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

                                        {/* Content - Chỉ cần className, bỏ hết inline styles và styled-jsx */}
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
                            <div className="fixed inset-0 z-[60] bg-white">
                                <div className="h-full flex flex-col">
                                    {/* Header */}
                                    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                        <h3 className="text-lg font-bold">Live Preview - {formData.title || 'Bài viết mới'}</h3>
                                        <button
                                            onClick={() => setShowLivePreview(false)}
                                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                            Thoát
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex overflow-hidden">
                                        {/* Editor Side - GIỮ NGUYÊN */}
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
                                                        // Load content từ main editor hoặc editing post
                                                        const currentContent = editorRef.current?.getContent() || editingPost?.content || '';
                                                        if (currentContent) {
                                                            setTimeout(() => {
                                                                editor.setContent(currentContent);
                                                                setPreviewContent(currentContent);
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

                                                        // Copy toàn bộ setup function từ editor chính
                                                        setup: function(editor) {
                                                            // Tất cả các commands và buttons từ editor chính
                                                            const fireWrapChange = (img: HTMLElement) => {
                                                                editor.fire('ObjectResized', { target: img } as any);
                                                            };

                                                            // Commands
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

                                                            // Buttons
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

                                                            // Real-time sync với throttling
                                                            let updateTimeout: NodeJS.Timeout;
                                                            editor.on('KeyUp Change', function() {
                                                                clearTimeout(updateTimeout);
                                                                updateTimeout = setTimeout(() => {
                                                                    const content = editor.getContent();
                                                                    setPreviewContent(content);
                                                                    if (editorRef.current) {
                                                                        editorRef.current.setContent(content);
                                                                    }
                                                                }, 300);
                                                            });
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="w-1/2 flex flex-col">
                                            <div className="p-3 bg-gray-50 border-b border-gray-200">
                                                <h4 className="font-semibold text-gray-700">Preview</h4>
                                            </div>
                                            <div
                                                className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-white"
                                                style={{
                                                    scrollBehavior: 'smooth',
                                                    WebkitOverflowScrolling: 'touch',
                                                    transform: 'translateZ(0)',
                                                }}
                                            >
                                                {/* Post Header giống PostDetailPage */}
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

                                                {/* Content - Chỉ cần className, bỏ hết inline styles và styled-jsx */}
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