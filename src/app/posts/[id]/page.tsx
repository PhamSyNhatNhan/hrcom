'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { postService, Post, CreatePostData, UpdatePostData } from '@/lib/posts';
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
    AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamic import EditorJS to avoid SSR issues
const EditorJS = dynamic(() => import('@editorjs/editorjs'), { ssr: false });

interface PostFormData {
    title: string;
    type: 'activity' | 'blog';
    content: any;
    thumbnail: File | null;
    published: boolean;
}

const PostPage: React.FC = () => {
    const { user } = useAuthStore();
    const editorRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State management
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'activity' | 'blog'>('all');
    const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
    const [error, setError] = useState<string>('');

    // Form state
    const [formData, setFormData] = useState<PostFormData>({
        title: '',
        type: 'activity',
        content: null,
        thumbnail: null,
        published: false
    });
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    // Load posts
    const loadPosts = async () => {
        try {
            setLoading(true);
            setError('');

            const result = await postService.getPosts({
                type: filterType,
                published: filterPublished === 'all' ? 'all' : filterPublished === 'published',
                search: searchTerm || undefined,
                limit: 100 // Load more posts for admin panel
            });

            setPosts(result.posts);
            console.log('Posts loaded successfully:', result.posts.length);
        } catch (error) {
            console.error('Error loading posts:', error);
            setError('Không thể tải danh sách bài viết. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Test database connection
    const testConnection = async () => {
        try {
            const isConnected = await postService.testConnection();
            console.log('Database connection test:', isConnected ? 'SUCCESS' : 'FAILED');
            return isConnected;
        } catch (error) {
            console.error('Connection test error:', error);
            return false;
        }
    };

    // Initialize Editor.js
    const initializeEditor = async (initialData?: any) => {
        if (typeof window === 'undefined') return;

        try {
            const EditorJS = (await import('@editorjs/editorjs')).default;
            const Header = (await import('@editorjs/header')).default;
            const List = (await import('@editorjs/list')).default;
            const Paragraph = (await import('@editorjs/paragraph')).default;
            const Quote = (await import('@editorjs/quote')).default;
            const Delimiter = (await import('@editorjs/delimiter')).default;
            const ImageTool = (await import('@editorjs/image')).default;

            if (editorRef.current) {
                editorRef.current.destroy();
            }

            editorRef.current = new EditorJS({
                holder: 'editorjs',
                data: initialData || undefined,
                tools: {
                    header: {
                        class: Header,
                        config: {
                            levels: [1, 2, 3, 4],
                            defaultLevel: 2
                        }
                    },
                    list: {
                        class: List,
                        inlineToolbar: true
                    },
                    paragraph: {
                        class: Paragraph,
                        inlineToolbar: true
                    },
                    quote: {
                        class: Quote,
                        inlineToolbar: true
                    },
                    delimiter: Delimiter,
                    image: {
                        class: ImageTool,
                        config: {
                            uploader: {
                                uploadByFile: async (file: File) => {
                                    try {
                                        const imageUrl = await postService.uploadImage(file);
                                        return {
                                            success: 1,
                                            file: {
                                                url: imageUrl
                                            }
                                        };
                                    } catch (error) {
                                        console.error('Error uploading image:', error);
                                        return {
                                            success: 0,
                                            error: 'Upload failed'
                                        };
                                    }
                                }
                            }
                        }
                    }
                },
                placeholder: 'Bắt đầu viết nội dung bài viết...'
            });

            console.log('Editor initialized successfully');
        } catch (error) {
            console.error('Error initializing editor:', error);
            setError('Không thể khởi tạo trình soạn thảo');
        }
    };

    // Handle thumbnail upload
    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Kích thước file không được vượt quá 5MB');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Chỉ được chọn file hình ảnh');
                return;
            }

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
        if (!user || !editorRef.current) {
            setError('Người dùng chưa đăng nhập hoặc trình soạn thảo chưa sẵn sàng');
            return;
        }

        try {
            setUploading(true);
            setError('');

            // Validate form
            if (!formData.title.trim()) {
                setError('Vui lòng nhập tiêu đề bài viết');
                return;
            }

            // Get content from editor
            const savedData = await editorRef.current.save();

            // Validate content
            if (!savedData.blocks || savedData.blocks.length === 0) {
                setError('Vui lòng nhập nội dung bài viết');
                return;
            }

            let thumbnailUrl = '';
            if (formData.thumbnail) {
                thumbnailUrl = await postService.uploadImage(formData.thumbnail);
            }

            const postData: CreatePostData | UpdatePostData = {
                title: formData.title,
                type: formData.type,
                content: savedData,
                thumbnail: thumbnailUrl || undefined,
                published: formData.published,
            };

            let result;
            if (editingPost) {
                // Update existing post
                result = await postService.updatePost({
                    id: editingPost.id,
                    ...postData
                });
                console.log('Post updated successfully:', result);
            } else {
                // Create new post
                result = await postService.createPost(postData, user.id);
                console.log('Post created successfully:', result);
            }

            // Reset form and reload posts
            resetForm();
            await loadPosts();

        } catch (error) {
            console.error('Error saving post:', error);
            setError(`Lỗi khi lưu bài viết: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    // Delete post
    const deletePost = async (postId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

        try {
            setError('');
            await postService.deletePost(postId);
            await loadPosts();
            console.log('Post deleted successfully');
        } catch (error) {
            console.error('Error deleting post:', error);
            setError(`Lỗi khi xóa bài viết: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Toggle publish status
    const togglePublishStatus = async (postId: string) => {
        try {
            setError('');
            await postService.togglePublishStatus(postId);
            await loadPosts();
            console.log('Post publish status toggled successfully');
        } catch (error) {
            console.error('Error updating publish status:', error);
            setError(`Lỗi khi cập nhật trạng thái: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Edit post
    const editPost = (post: Post) => {
        setEditingPost(post);
        setFormData({
            title: post.title,
            type: post.type,
            content: post.content,
            thumbnail: null,
            published: post.published
        });
        if (post.thumbnail) {
            setThumbnailPreview(post.thumbnail);
        }
        setShowForm(true);

        // Initialize editor with existing content
        setTimeout(() => {
            initializeEditor(post.content);
        }, 100);
    };

    // Reset form
    const resetForm = () => {
        setShowForm(false);
        setEditingPost(null);
        setFormData({
            title: '',
            type: 'activity',
            content: null,
            thumbnail: null,
            published: false
        });
        setThumbnailPreview('');
        setError('');
        if (editorRef.current) {
            editorRef.current.destroy();
            editorRef.current = null;
        }
    };

    // Filter posts
    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || post.type === filterType;
        const matchesPublished =
            filterPublished === 'all' ||
            (filterPublished === 'published' && post.published) ||
            (filterPublished === 'draft' && !post.published);

        return matchesSearch && matchesType && matchesPublished;
    });

    // Effects
    useEffect(() => {
        const initializePage = async () => {
            await testConnection();
            await loadPosts();
        };

        initializePage();
    }, [filterType, filterPublished]);

    useEffect(() => {
        if (showForm && !editingPost) {
            setTimeout(() => {
                initializeEditor();
            }, 100);
        }
    }, [showForm]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== '') {
                loadPosts();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Permission check
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

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <SectionHeader
                    title="QUẢN LÝ BÀI VIẾT"
                    subtitle="Tạo và quản lý các bài viết hoạt động và blog"
                />

                {/* Error Display */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                            <span className="text-sm text-red-700">{error}</span>
                            <button
                                onClick={() => setError('')}
                                className="ml-auto text-red-400 hover:text-red-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
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
                                value={filterPublished}
                                onChange={(e) => setFilterPublished(e.target.value as typeof filterPublished)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="published">Đã xuất bản</option>
                                <option value="draft">Bản nháp</option>
                            </select>
                        </div>

                        {/* New Post Button */}
                        <Button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Bài viết mới
                        </Button>
                    </div>
                </div>

                {/* Post Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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

                                {/* Content Editor */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nội dung bài viết
                                    </label>
                                    <div
                                        id="editorjs"
                                        className="border border-gray-300 rounded-lg min-h-[400px] p-4"
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
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

                {/* Posts List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Đang tải...</p>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-600">Không có bài viết nào.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bài viết
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Loại
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tác giả
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày tạo
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
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
                                                onClick={() => togglePublishStatus(post.id)}
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
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deletePost(post.id)}
                                                    className="text-red-600 hover:text-red-900"
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostPage;