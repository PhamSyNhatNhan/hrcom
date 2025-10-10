'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Tag, MessageCircle, Send, MoreVertical } from 'lucide-react';
import { SectionHeader } from '@/component/SectionHeader';
import { LastNewsCard } from '@/component/LastNewsCard';
import { usePublishedPosts } from '@/hooks/usePosts';
import { postService } from '@/lib/posts';
import { getUserFromStore } from '@/lib/auth';
import { Comment, Post as BlogPost } from '@/types/posts_user';

const PostDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const postId = params.id as string;

    // States
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPostIndex, setCurrentPostIndex] = useState(-1);

    // Comment states
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
    const [submitting, setSubmitting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const [relatedPostsType, setRelatedPostsType] = useState<'activity' | 'blog'>('blog');

    const {
        posts: allRelatedPosts,
    } = usePublishedPosts({
        type: relatedPostsType,
        limit: 50
    });

    // Load current post details
    useEffect(() => {
        const loadPost = async () => {
            if (!postId) return;

            try {
                setLoading(true);
                setError(null);
                const postData = await postService.getPost(postId);
                setPost(postData);
                setRelatedPostsType(postData.type);
            } catch (err) {
                console.error('Error loading post:', err);
                setError('Không thể tải bài viết');
            } finally {
                setLoading(false);
            }
        };

        loadPost();
    }, [postId]);

    // Load comments
    useEffect(() => {
        loadComments();
    }, [postId]);

    const loadComments = async () => {
        if (!postId) return;

        try {
            setCommentsLoading(true);
            const commentsData = await postService.getComments(postId);
            setComments(commentsData);
        } catch (err) {
            console.error('Error loading comments:', err);
        } finally {
            setCommentsLoading(false);
        }
    };

    // Find current post index for navigation
    useEffect(() => {
        if (post && allRelatedPosts.length > 0) {
            const index = allRelatedPosts.findIndex(p => p.id === post.id);
            setCurrentPostIndex(index);
        }
    }, [post, allRelatedPosts]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (openMenuId && !(e.target as Element).closest('.comment-menu')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openMenuId]);

    // Helper functions
    const formatCommentDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const extractTextFromContent = (content: string): string => {
        if (!content) return '';
        return content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    };

    const getReadingTime = (content: string): number => {
        const text = extractTextFromContent(content);
        const wordsPerMinute = 200;
        const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    };

    const renderContent = (content: string) => {
        if (!content) return <p className="text-gray-500 italic">Nội dung đang được cập nhật...</p>;

        return (
            <div
                className="tinymce-content prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:text-lg prose-p:leading-relaxed prose-strong:text-gray-900 prose-a:text-cyan-600 prose-a:no-underline hover:prose-a:underline prose-ul:my-6 prose-ol:my-6 prose-li:text-gray-700 prose-li:text-lg prose-li:leading-relaxed prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-gray-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:text-lg prose-blockquote:italic prose-img:rounded-xl prose-img:shadow-lg prose-table:border-collapse prose-table:w-full prose-td:border prose-td:border-gray-300 prose-td:p-3 prose-th:border prose-th:border-gray-300 prose-th:p-3 prose-th:bg-gray-100"
                style={{ lineHeight: '1.7' }}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    };

    const convertToNewsFormat = (post: any) => {
        const excerpt = post.description || extractTextFromContent(post.content || '');
        return {
            date: {
                day: new Date(post.created_at).getDate().toString(),
                month: new Date(post.created_at).toLocaleDateString('vi-VN', { month: 'short' }),
                year: new Date(post.created_at).getFullYear().toString()
            },
            image: post.thumbnail || '/Image-not-found.png',
            title: post.title,
            excerpt: excerpt.substring(0, 200) + (excerpt.length > 200 ? '...' : ''),
            category: post.type === 'activity' ? 'TIN TỨC & SỰ KIỆN' : 'BLOG HR COMPANION',
            href: `/posts/${post.id}`
        };
    };

    // Navigation functions
    const getPreviousPost = () => {
        if (currentPostIndex > 0) {
            return allRelatedPosts[currentPostIndex - 1];
        }
        return null;
    };

    const getNextPost = () => {
        if (currentPostIndex >= 0 && currentPostIndex < allRelatedPosts.length - 1) {
            return allRelatedPosts[currentPostIndex + 1];
        }
        return null;
    };

    // Comment functions
    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = getUserFromStore();

        if (!user) {
            router.push('/login');
            return;
        }

        if (!newComment.trim()) return;

        try {
            setSubmitting(true);
            await postService.createComment({
                post_id: postId,
                content: newComment,
                author_id: user.id
            });
            setNewComment('');
            await loadComments();
        } catch (err) {
            console.error('Error submitting comment:', err);
            alert('Không thể gửi bình luận. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        const user = getUserFromStore();

        if (!user) {
            router.push('/login');
            return;
        }

        const content = replyContent[parentId];
        if (!content || !content.trim()) return;

        try {
            setSubmitting(true);
            await postService.createComment({
                post_id: postId,
                parent_comment_id: parentId,
                content: content,
                author_id: user.id
            });
            setReplyContent(prev => ({ ...prev, [parentId]: '' }));
            setReplyingTo(null);
            await loadComments();
        } catch (err) {
            console.error('Error submitting reply:', err);
            alert('Không thể gửi trả lời. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        const user = getUserFromStore();
        if (!user) return;

        if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

        try {
            await postService.deleteComment(commentId, user.id);
            setOpenMenuId(null);
            await loadComments();
        } catch (err) {
            console.error('Error deleting comment:', err);
            alert('Không thể xóa bình luận. Vui lòng thử lại.');
        }
    };

    // Get post type info
    const getPostTypeInfo = (type: 'activity' | 'blog') => {
        if (type === 'activity') {
            return {
                backUrl: '/news',
                categoryLabel: 'TIN TỨC & SỰ KIỆN',
                pageTitle: 'Tin tức & Sự kiện',
                latestTitle: 'TIN TỨC MỚI NHẤT',
                exploreTitle: 'Khám phá thêm',
                exploreDesc: 'Xem thêm những tin tức & sự kiện hấp dẫn từ HR Companion',
                exploreButton: 'Xem tất cả tin tức & sự kiện'
            };
        } else {
            return {
                backUrl: '/blog',
                categoryLabel: 'BLOG HR COMPANION',
                pageTitle: 'Blog HR Companion',
                latestTitle: 'BÀI VIẾT MỚI NHẤT',
                exploreTitle: 'Khám phá thêm',
                exploreDesc: 'Đọc thêm nhiều bài viết thú vị khác từ HR Companion',
                exploreButton: 'Xem tất cả blog'
            };
        }
    };

    // Count total comments recursively
    const countTotalComments = (comments: Comment[]): number => {
        let count = 0;
        comments.forEach(comment => {
            if (!comment.deleted) {
                count++;
                if (comment.replies && comment.replies.length > 0) {
                    count += countTotalComments(comment.replies);
                }
            }
        });
        return count;
    };

    // Render comment recursively - Optimized for mobile and PC
    const renderComment = (comment: Comment, depth: number = 0) => {
        const user = getUserFromStore();
        const isAuthor = user?.id === comment.author_id;

        // Tối ưu indent: Chỉ indent tối đa 3 level, sau đó không indent nữa
        // Mobile: ml-1 (4px), PC: ml-2 (8px)
        const maxIndentLevel = 3;
        const effectiveDepth = Math.min(depth, maxIndentLevel);
        const indentClass = effectiveDepth > 0 ? 'ml-1.5 sm:ml-2.5 pl-2 border-l-2 border-gray-200' : '';

        if (comment.deleted) {
            return (
                <div key={comment.id} className={`${indentClass} p-3 bg-gray-50 rounded-lg`}>
                    <p className="text-gray-500 italic text-sm">Bình luận này đã bị xóa</p>
                </div>
            );
        }

        return (
            <div key={comment.id} className={indentClass}>
                <div className="flex gap-2 sm:gap-3">
                    {/* Avatar - smaller on mobile */}
                    <div className="flex-shrink-0">
                        {comment.profiles?.image_url ? (
                            <Image
                                src={comment.profiles.image_url}
                                alt={comment.profiles.full_name}
                                width={32}
                                height={32}
                                className="rounded-full object-cover w-8 h-8 sm:w-10 sm:h-10"
                            />
                        ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0 flex-1">
                                    <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                        {comment.profiles?.full_name || 'Người dùng'}
                                    </span>
                                    <span className="text-gray-500 text-xs sm:text-sm">
                                        {formatCommentDate(comment.created_at)}
                                    </span>
                                </div>

                                {/* Three dots menu */}
                                {isAuthor && (
                                    <div className="relative comment-menu">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === comment.id ? null : comment.id);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                                            title="Tùy chọn"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>

                                        {/* Dropdown menu */}
                                        {openMenuId === comment.id && (
                                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Xóa
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-700 text-sm sm:text-base whitespace-pre-wrap break-words">{comment.content}</p>
                        </div>

                        {/* Reply button */}
                        <button
                            onClick={() => setReplyingTo(comment.id)}
                            className="text-xs sm:text-sm text-cyan-600 hover:text-cyan-700 mt-1.5 sm:mt-2 font-medium"
                        >
                            Trả lời
                        </button>

                        {/* Reply form */}
                        {replyingTo === comment.id && (
                            <div className="mt-2 sm:mt-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyContent[comment.id] || ''}
                                        onChange={(e) => setReplyContent(prev => ({
                                            ...prev,
                                            [comment.id]: e.target.value
                                        }))}
                                        placeholder="Viết câu trả lời..."
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmitReply(comment.id);
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => handleSubmitReply(comment.id)}
                                        disabled={submitting || !replyContent[comment.id]?.trim()}
                                        className="px-3 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setReplyingTo(null);
                                            setReplyContent(prev => ({ ...prev, [comment.id]: '' }));
                                        }}
                                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-700"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Render nested replies recursively */}
                        {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                                {comment.replies.map(reply => renderComment(reply, depth + 1))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                <span className="ml-4 text-gray-600 text-lg">Đang tải bài viết...</span>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy bài viết</h2>
                    <p className="text-gray-600 mb-6">{error || 'Bài viết không tồn tại hoặc đã bị xóa'}</p>
                    <Link href={post?.type === 'activity' ? '/news' : '/blog'}>
                        <button className="px-5 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm">
                            Quay lại danh sách
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const readingTime = getReadingTime(post.content || '');
    const previousPost = getPreviousPost();
    const nextPost = getNextPost();
    const typeInfo = getPostTypeInfo(post.type);
    const totalComments = countTotalComments(comments);

    function subFormatDate(dateStr: string) {
        if (!dateStr) return "";
        return new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(new Date(dateStr));
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {/* Hero Section */}
            <section className="relative py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Breadcrumb */}
                    <nav className="mb-4">
                        <ol className="flex items-center justify-center text-sm text-gray-500">
                            <li><Link href="/" className="hover:text-cyan-600">Trang chủ</Link></li>
                            <li className="px-2 text-gray-400">/</li>
                            <li><Link href={typeInfo.backUrl} className="hover:text-cyan-600">{typeInfo.pageTitle}</Link></li>
                            <li className="px-2 text-gray-400">/</li>
                            <li className="text-gray-900 font-medium">Chi tiết bài viết</li>
                        </ol>
                    </nav>

                    {/* Category */}
                    <div className="mb-3">
                        <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 text-sm font-semibold rounded-full">
                            {typeInfo.categoryLabel}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                        {post.title}
                    </h1>

                    {/* Description */}
                    {post.description && (
                        <p className="text-xl text-gray-600 mb-6 leading-relaxed max-w-3xl mx-auto">
                            {post.description}
                        </p>
                    )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag.id}
                                    className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 hover:border-cyan-200 hover:text-cyan-700 transition-colors"
                                >
                                    <Tag className="w-3 h-3 mr-1.5" />
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Meta + Author */}
                    <div className="flex flex-wrap items-center justify-center gap-5 text-gray-600 mb-6">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            <span>{subFormatDate(post.published_at || post.created_at || "")}</span>
                        </div>

                        <span className="hidden sm:inline text-gray-300">•</span>

                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            <span>{readingTime} phút đọc</span>
                        </div>

                        <span className="hidden sm:inline text-gray-300">•</span>

                        {/* Author */}
                        <div className="flex items-center gap-3">
                            {post.profiles?.image_url ? (
                                <Image
                                    src={post.profiles.image_url}
                                    alt={post.profiles.full_name ?? "Người dùng"}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover ring-2 ring-cyan-100 shadow"
                                />
                            ) : (
                                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-cyan-100 shadow">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <span className="text-sm font-medium text-gray-800">
                                {post.profiles?.full_name ?? "HR Companion"}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Article Content - Left Side */}
                        <div className="lg:col-span-2">
                            {/* Article Body */}
                            <div className="mb-12">
                                {renderContent(post.content || '')}
                            </div>

                            {/* Post Navigation */}
                            <div className="mt-12 pt-8 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Previous Post */}
                                    {previousPost && (
                                        <Link href={`/posts/${previousPost.id}`}>
                                            <div className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-cyan-200">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <ChevronLeft className="w-5 h-5 text-cyan-600" />
                                                    <span className="text-sm text-cyan-600 font-medium">Bài trước</span>
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors line-clamp-2">
                                                    {previousPost.title}
                                                </h3>
                                                {previousPost.description && (
                                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                        {previousPost.description}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    )}

                                    {/* Next Post */}
                                    {nextPost && (
                                        <Link href={`/posts/${nextPost.id}`}>
                                            <div className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-cyan-200 text-right md:text-left">
                                                <div className="flex items-center justify-end md:justify-start gap-3 mb-3">
                                                    <span className="text-sm text-cyan-600 font-medium">Bài sau</span>
                                                    <ChevronRight className="w-5 h-5 text-cyan-600" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors line-clamp-2">
                                                    {nextPost.title}
                                                </h3>
                                                {nextPost.description && (
                                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                        {nextPost.description}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="mt-16 pt-8 border-t border-gray-200">
                                <div className="flex items-center gap-3 mb-8">
                                    <MessageCircle className="w-6 h-6 text-cyan-600" />
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Bình luận ({totalComments})
                                    </h2>
                                </div>

                                {/* Comment Form */}
                                <form onSubmit={handleSubmitComment} className="mb-8">
                                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Viết bình luận của bạn..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm sm:text-base"
                                        />
                                        <div className="flex justify-end mt-3">
                                            <button
                                                type="submit"
                                                disabled={submitting || !newComment.trim()}
                                                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
                                            >
                                                <Send className="w-4 h-4" />
                                                {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                {/* Comments List */}
                                {commentsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                                    </div>
                                ) : comments.length > 0 ? (
                                    <div className="space-y-4 sm:space-y-6">
                                        {comments.map(comment => renderComment(comment))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600 text-sm sm:text-base">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar - Right Side */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8 space-y-8">
                                {/* Latest Posts */}
                                <div className="bg-white rounded-2xl shadow-lg p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                                        {typeInfo.latestTitle}
                                    </h3>

                                    <div className="space-y-6">
                                        {allRelatedPosts.slice(0, 4).map((relatedPost) => {
                                            const newsFormat = convertToNewsFormat(relatedPost);
                                            const relatedPostReadTime = getReadingTime(relatedPost.content || '');
                                            return (
                                                <LastNewsCard
                                                    key={relatedPost.id}
                                                    article={{
                                                        title: newsFormat.title,
                                                        date: newsFormat.date,
                                                        href: newsFormat.href,
                                                        excerpt: newsFormat.excerpt.substring(0, 100) + (newsFormat.excerpt.length > 100 ? '...' : ''),
                                                        category: relatedPost.type === 'activity' ? 'Tin tức & Sự kiện' : 'Blog',
                                                        readTime: relatedPostReadTime,
                                                        image: newsFormat.image
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Back to List */}
                                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-4 text-center">
                                    <h3 className="text-base font-semibold text-gray-800 mb-2">
                                        {typeInfo.exploreTitle}
                                    </h3>
                                    <p className="text-gray-600 mb-4 text-sm leading-snug">
                                        {typeInfo.exploreDesc}
                                    </p>
                                    <Link href={typeInfo.backUrl}>
                                        <button className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow">
                                            {typeInfo.exploreButton}
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PostDetailPage;