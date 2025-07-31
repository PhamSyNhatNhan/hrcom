'use client';
import React, {JSX, useEffect, useState} from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeader } from '@/component/SectionHeader';
import { LastNewsCard } from '@/component/LastNewsCard';
import { usePublishedPosts } from '@/hooks/usePosts';
import { postService } from '@/lib/posts';

interface BlogPost {
    id: string;
    title: string;
    thumbnail: string | null;
    content: any;
    type: 'activity' | 'blog';
    published_at: string | null;
    created_at: string | null;
    profiles?: {
        full_name: string | null;
        image_url?: string | null;
    };
}

const PostDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const postId = params.id as string;

    // States
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPostIndex, setCurrentPostIndex] = useState(-1);

    // Load all posts of the same type for navigation and related posts
    const [relatedPostsType, setRelatedPostsType] = useState<'activity' | 'blog'>('blog');

    const {
        posts: allRelatedPosts,
        loading: postsLoading
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
                // Set the related posts type based on current post type
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

    // Find current post index for navigation
    useEffect(() => {
        if (post && allRelatedPosts.length > 0) {
            const index = allRelatedPosts.findIndex(p => p.id === post.id);
            setCurrentPostIndex(index);
        }
    }, [post, allRelatedPosts]);

    // Helper functions
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const extractTextFromContent = (content: any): string => {
        if (!content || !content.blocks) return '';
        return content.blocks
            .filter((block: any) => block.type === 'paragraph')
            .map((block: any) => block.data?.text || '')
            .join(' ')
            .replace(/<[^>]*>/g, '');
    };

    const getReadingTime = (content: any): number => {
        const text = extractTextFromContent(content);
        return Math.ceil(text.length / 200);
    };

    const renderContent = (content: any) => {
        if (!content || !content.blocks) return null;

        return content.blocks.map((block: any, index: number) => {
            switch (block.type) {
                case 'header':
                    const HeaderTag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
                    return (
                        <HeaderTag
                            key={index}
                            className={`font-bold text-gray-900 mb-4 ${
                                block.data.level === 1 ? 'text-3xl' :
                                    block.data.level === 2 ? 'text-2xl' :
                                        block.data.level === 3 ? 'text-xl' : 'text-lg'
                            }`}
                        >
                            {block.data.text}
                        </HeaderTag>
                    );

                case 'paragraph':
                    return (
                        <p
                            key={index}
                            className="text-gray-700 leading-relaxed mb-6 text-lg"
                            dangerouslySetInnerHTML={{ __html: block.data.text }}
                        />
                    );

                case 'list':
                    const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
                    return (
                        <ListTag
                            key={index}
                            className={`mb-6 ${
                                block.data.style === 'ordered'
                                    ? 'list-decimal list-inside'
                                    : 'list-disc list-inside'
                            }`}
                        >
                            {block.data.items.map((item: string, itemIndex: number) => (
                                <li key={itemIndex} className="text-gray-700 mb-2 leading-relaxed">
                                    {item}
                                </li>
                            ))}
                        </ListTag>
                    );

                case 'image':
                    return (
                        <div key={index} className="my-8">
                            <div className="relative w-full rounded-xl overflow-hidden shadow-lg">
                                <Image
                                    src={block.data.file.url}
                                    alt={block.data.caption || 'Post image'}
                                    width={1200}
                                    height={800}
                                    className="w-full h-auto"
                                />
                            </div>
                            {block.data.caption && (
                                <p className="text-center text-gray-500 text-sm mt-3 italic">
                                    {block.data.caption}
                                </p>
                            )}
                        </div>
                    );

                case 'quote':
                    return (
                        <blockquote
                            key={index}
                            className="border-l-4 border-cyan-500 pl-6 py-4 my-6 bg-gray-50 rounded-r-lg"
                        >
                            <p className="text-lg italic text-gray-700 mb-2">
                                "{block.data.text}"
                            </p>
                            {block.data.caption && (
                                <cite className="text-sm text-gray-500">
                                    — {block.data.caption}
                                </cite>
                            )}
                        </blockquote>
                    );

                case 'delimiter':
                    return (
                        <div key={index} className="text-center my-8">
                            <div className="text-gray-400 text-2xl">***</div>
                        </div>
                    );

                default:
                    return null;
            }
        });
    };

    const convertToNewsFormat = (post: any) => ({
        date: {
            day: new Date(post.created_at).getDate().toString(),
            month: new Date(post.created_at).toLocaleDateString('vi-VN', { month: 'short' }),
            year: new Date(post.created_at).getFullYear().toString()
        },
        image: post.thumbnail || (post.type === 'activity' ? '/news/default-activity.jpg' : '/news/default-blog.jpg'),
        title: post.title,
        excerpt: extractTextFromContent(post.content).substring(0, 200) + '...',
        category: post.type === 'activity' ? 'TIN TỨC & SỰ KIỆN' : 'BLOG HR COMPANION',
        href: `/posts/${post.id}`
    });

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

    const getRelatedPosts = () => {
        return allRelatedPosts
            .filter(p => p.id !== postId)
            .slice(0, 3);
    };

    // Get back URL and labels based on post type
    const getPostTypeInfo = (type: 'activity' | 'blog') => {
        if (type === 'activity') {
            return {
                backUrl: '/news',
                backLabel: 'tin tức & sự kiện',
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
                backLabel: 'blog',
                categoryLabel: 'BLOG HR COMPANION',
                pageTitle: 'Blog HR Companion',
                latestTitle: 'BÀI VIẾT MỚI NHẤT',
                exploreTitle: 'Khám phá thêm',
                exploreDesc: 'Đọc thêm nhiều bài viết thú vị khác từ HR Companion',
                exploreButton: 'Xem tất cả blog'
            };
        }
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
                            {post?.type === 'activity' ? 'Quay lại danh sách tin tức & sự kiện' : 'Quay lại danh sách blog'}
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const readingTime = getReadingTime(post.content);
    const previousPost = getPreviousPost();
    const nextPost = getNextPost();
    const relatedPosts = getRelatedPosts();
    const typeInfo = getPostTypeInfo(post.type);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {/* Hero Section */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Breadcrumb */}
                    <nav className="mb-8">
                        <ol className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                            <li><Link href="/" className="hover:text-cyan-600">Trang chủ</Link></li>
                            <li>/</li>
                            <li>
                                <Link
                                    href={typeInfo.backUrl}
                                    className="hover:text-cyan-600 capitalize"
                                >
                                    {typeInfo.pageTitle}
                                </Link>
                            </li>
                            <li>/</li>
                            <li className="text-gray-900 font-medium">Chi tiết bài viết</li>
                        </ol>
                    </nav>

                    {/* Category */}
                    <div className="mb-4">
                        <span className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 text-sm font-semibold rounded-full">
                            {typeInfo.categoryLabel}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        {post.title}
                    </h1>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-gray-600 mb-8">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            <span>{formatDate(post.published_at || post.created_at || "")}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            <span>{readingTime} phút đọc</span>
                        </div>
                    </div>

                    {/* Author */}
                    <div className="flex items-center justify-center gap-4 mb-12">
                        {post.profiles?.image_url ? (
                            <Image
                                src={post.profiles.image_url}
                                alt={post.profiles.full_name ?? "Người dùng"}
                                width={56}
                                height={56}
                                className="rounded-full object-cover ring-4 ring-cyan-100 shadow-lg"
                            />
                        ) : (
                            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-cyan-100">
                                <User className="w-7 h-7 text-white" />
                            </div>
                        )}
                        <div className="text-center">
                            <p className="text-lg font-semibold text-gray-900">{post.profiles?.full_name}</p>
                            <p className="text-sm text-gray-500 font-medium">Tác giả bài viết</p>
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
                            <div className="prose prose-lg max-w-none">
                                {renderContent(post.content)}
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
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Related Posts */}
                            {relatedPosts.length > 0 && (
                                <div className="mt-16">
                                    <SectionHeader
                                        title={post.type === 'activity' ? 'TIN TỨC LIÊN QUAN' : 'BÀI VIẾT LIÊN QUAN'}
                                        subtitle={post.type === 'activity' ? 'Khám phá thêm những tin tức thú vị khác' : 'Khám phá thêm những bài viết thú vị khác'}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {relatedPosts.map((relatedPost) => {
                                            const newsFormat = convertToNewsFormat(relatedPost);
                                            return (
                                                <div
                                                    key={relatedPost.id}
                                                    className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
                                                >
                                                    <div className="relative h-48 overflow-hidden">
                                                        <Image
                                                            src={newsFormat.image}
                                                            alt={newsFormat.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div className="p-6">
                                                        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                                                            <Calendar className="w-4 h-4" />
                                                            {newsFormat.date.day} {newsFormat.date.month}, {newsFormat.date.year}
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                                                            <Link href={newsFormat.href} className="hover:text-cyan-600 transition-colors">
                                                                {newsFormat.title}
                                                            </Link>
                                                        </h3>
                                                        <p className="text-gray-600 text-sm line-clamp-3">
                                                            {newsFormat.excerpt}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

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
                                        {allRelatedPosts.slice(0, 4).map((post) => {
                                            const newsFormat = convertToNewsFormat(post);
                                            return (
                                                <LastNewsCard
                                                    key={post.id}
                                                    article={{
                                                        title: newsFormat.title,
                                                        date: newsFormat.date,
                                                        href: newsFormat.href,
                                                        excerpt: newsFormat.excerpt.substring(0, 100) + '...',
                                                        category: post.type === 'activity' ? 'Tin tức & Sự kiện' : 'Blog',
                                                        readTime: Math.ceil(newsFormat.excerpt.length / 200),
                                                        views: Math.floor(Math.random() * 300) + 50
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