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
    Filter
} from 'lucide-react';
import Image from 'next/image';
import { Editor } from '@tinymce/tinymce-react';

// Bắt lỗi
function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err && 'message' in err) {
        const m = (err as { message?: unknown }).message;
        return typeof m === 'string' ? m : JSON.stringify(m);
    }
    return typeof err === 'string' ? err : JSON.stringify(err);
}

interface Post {
    id: string;
    title: string;
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
    type: 'activity' | 'blog';
    content: string;
    thumbnail: File | null;
    published: boolean;
}

type TabType = 'posts' | 'submissions';

const PostPage: React.FC = () => {
    const { user } = useAuthStore();
    const editorRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'activity' | 'blog'>('all');
    const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    // Form state
    const [formData, setFormData] = useState<PostFormData>({
        title: '',
        type: 'activity',
        content: '',
        thumbnail: null,
        published: false
    });
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    // Notification
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
    } | null>(null);

    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
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
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error('Error loading posts:', error);
            showNotification('error', 'Không thể tải bài viết: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
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
            setSubmissions(data || []);
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
                type: formData.type,
                content: content,
                thumbnail: thumbnailUrl || null,
                published: formData.published,
                published_at: formData.published ? new Date().toISOString() : null,
                author_id: user.id
            };

            let result;
            if (editingPost) {
                // Update existing post
                result = await supabase
                    .from('posts')
                    .update(postData)
                    .eq('id', editingPost.id);
            } else {
                // Create new post
                result = await supabase
                    .from('posts')
                    .insert([postData]);
            }

            if (result.error) throw result.error;

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
            type: post.type,
            content: '', // Will be set by TinyMCE
            thumbnail: null,
            published: post.published
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
            type: 'activity',
            content: '',
            thumbnail: null,
            published: false
        });
        setThumbnailPreview('');
        if (editorRef.current) {
            editorRef.current.setContent('');
        }
    };

    // Filter functions
    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || post.type === filterType;
        const matchesPublished =
            filterPublished === 'all' ||
            (filterPublished === 'published' && post.published) ||
            (filterPublished === 'draft' && !post.published);

        return matchesSearch && matchesType && matchesPublished;
    });

    const filteredSubmissions = submissions.filter(submission => {
        const matchesSearch = submission.posts?.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || submission.posts?.type === filterType;
        const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;

        return matchesSearch && matchesType && matchesStatus;
    });

    // Effects
    useEffect(() => {
        if (activeTab === 'posts') {
            loadPosts();
        } else {
            loadSubmissions();
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
                );

                export default PostPage;
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
                                <Button variant="outline" onClick={activeTab === 'posts' ? loadPosts : loadSubmissions} disabled={loading} className="flex items-center gap-2">
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
                                                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                                            {post.title}
                                                        </div>
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

                                {/* Content Editor với Text Wrap Quickbar */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nội dung bài viết
                                    </label>

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
                                                'undo redo | preview fullscreen | restoredraft',
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

                                            setup: function(editor) {
                                                // Command: Wrap Left
                                                editor.addCommand('WrapImageLeft', function() {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        // Remove existing wrap classes
                                                        img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');

                                                        // Add wrap-left class
                                                        img.classList.add('wrap-left');

                                                        // Fix parent container
                                                        const parent = img.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') {
                                                            parent.style.overflow = 'visible';
                                                        }

                                                        editor.undoManager.add();
                                                        editor.fire('ObjectResized', { target: img as HTMLElement });
                                                    }
                                                });

                                                // Command: Wrap Right
                                                editor.addCommand('WrapImageRight', function() {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                        img.classList.add('wrap-right');

                                                        const parent = img.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') {
                                                            parent.style.overflow = 'visible';
                                                        }

                                                        editor.undoManager.add();
                                                        editor.fire('ObjectResized', { target: img as HTMLElement });
                                                    }
                                                });

                                                // Command: Wrap Center
                                                editor.addCommand('WrapImageCenter', function() {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');
                                                        img.classList.add('wrap-center');

                                                        const parent = img.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') {
                                                            (parent as HTMLElement).style.textAlign = 'center';
                                                        }

                                                        editor.undoManager.add();
                                                        editor.fire('ObjectResized', { target: img as HTMLElement });
                                                    }
                                                });

                                                // Command: Clear Wrap (toggle function)
                                                editor.addCommand('ClearImageWrap', function() {
                                                    const img = editor.selection.getNode() as HTMLElement;
                                                    if (img && img.tagName === 'IMG') {
                                                        // Kiểm tra xem ảnh có wrap class nào không
                                                        const hasWrap = img.classList.contains('wrap-left') ||
                                                            img.classList.contains('wrap-right') ||
                                                            img.classList.contains('wrap-center');

                                                        if (hasWrap) {
                                                            // Clear tất cả wrap classes
                                                            img.classList.remove('wrap-left', 'wrap-right', 'wrap-center');

                                                            const parent = img.parentNode as HTMLElement;
                                                            if (parent && parent.tagName === 'P') {
                                                                parent.removeAttribute('style');
                                                            }
                                                        }

                                                        editor.undoManager.add();
                                                        editor.fire('ObjectResized', { target: img as HTMLElement });
                                                    }
                                                });

                                                // Command: Insert Clear Div
                                                editor.addCommand('InsertClearDiv', function() {
                                                    editor.insertContent('<div class="clear-wrap">&nbsp;</div>');
                                                });

                                                // Register buttons cho quickbar (không dùng setActive)
                                                editor.ui.registry.addButton('wrapleft', {
                                                    icon: 'align-left',
                                                    tooltip: 'Text wrap bên phải ảnh',
                                                    onAction: function() {
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
                                                    onAction: function() {
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
                                                    onAction: function() {
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
                                                    onAction: function() {
                                                        editor.execCommand('ClearImageWrap');
                                                    }
                                                });

                                                // Optional: Thêm button vào toolbar chính
                                                editor.ui.registry.addButton('insertclear', {
                                                    icon: 'new-document',
                                                    tooltip: 'Thêm dòng clear',
                                                    onAction: function() {
                                                        editor.execCommand('InsertClearDiv');
                                                    }
                                                });

                                                // Auto-fix container khi có ảnh wrap
                                                editor.on('NodeChange', function() {
                                                    const wrappedImages = editor.dom.select('img.wrap-left, img.wrap-right');
                                                    wrappedImages.forEach(img => {
                                                        const parent = img.parentNode as HTMLElement;
                                                        if (parent && parent.tagName === 'P') {
                                                            parent.style.overflow = 'visible';
                                                        }
                                                    });
                                                });

                                                // Preserve classes when content changes
                                                editor.on('PreProcess', function(e) {
                                                    const images = e.node.querySelectorAll('img[class*="wrap-"]');
                                                    images.forEach(img => {
                                                        const classes = img.getAttribute('class');
                                                        if (classes) {
                                                            img.setAttribute('data-mce-classes', classes);
                                                        }
                                                    });
                                                });

                                                editor.on('PostProcess', function(e) {
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
            </div>
        </div>
    );
};

export default PostPage;