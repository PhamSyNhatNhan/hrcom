'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, Eye, Clock, MessageCircle, Heart, Share2, Bookmark, ChevronRight } from 'lucide-react';
import { Post, extractTextFromContent, formatDate, getPostTypeLabel } from '@/lib/posts';

interface PostCardProps {
    post: Post;
    variant?: 'default' | 'compact' | 'featured' | 'grid' | 'list';
    showAuthor?: boolean;
    showExcerpt?: boolean;
    showStats?: boolean;
    showBookmark?: boolean;
    className?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
                                                      post,
                                                      variant = 'default',
                                                      showAuthor = true,
                                                      showExcerpt = true,
                                                      showStats = true,
                                                      showBookmark = false,
                                                      className = ''
                                                  }) => {
    const excerpt = extractTextFromContent(post.content);
    const formattedDate = formatDate(post.published_at || post.created_at);
    const readingTime = Math.ceil(excerpt.length / 200); // Rough reading time calculation

    const baseClasses = `
        group bg-white rounded-2xl shadow-lg overflow-hidden 
        transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl
        border border-gray-100 hover:border-cyan-200 hover:bg-gradient-to-br hover:from-white hover:to-cyan-50/20
        ${className}
    `;

    // Compact variant for sidebar or small spaces
    if (variant === 'compact') {
        return (
            <Link href={`/posts/${post.id}`}>
                <article className={`${baseClasses} hover:scale-105`}>
                    <div className="flex gap-4 p-4">
                        {post.thumbnail && (
                            <div className="flex-shrink-0">
                                <div className="relative w-24 h-20 rounded-xl overflow-hidden">
                                    <Image
                                        src={post.thumbnail}
                                        alt={post.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`
                                    px-2 py-1 text-xs font-semibold rounded-full
                                    ${post.type === 'activity'
                                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                                    : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800'
                                }
                                `}>
                                    {getPostTypeLabel(post.type)}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {readingTime} phút đọc
                                </span>
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-cyan-600 transition-colors leading-tight mb-2">
                                {post.title}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                {showAuthor && post.profiles && (
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {post.profiles.full_name}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                        </div>
                    </div>
                </article>
            </Link>
        );
    }

    // Grid variant for blog/news grids
    if (variant === 'grid') {
        return (
            <Link href={`/posts/${post.id}`}>
                <article className={`${baseClasses} h-full flex flex-col`}>
                    {post.thumbnail && (
                        <div className="relative h-48 overflow-hidden">
                            <Image
                                src={post.thumbnail}
                                alt={post.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                            {/* Type badge */}
                            <div className="absolute top-4 left-4">
                                <span className={`
                                    px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-md shadow-lg
                                    ${post.type === 'activity'
                                    ? 'bg-green-500/90 text-white'
                                    : 'bg-blue-500/90 text-white'
                                }
                                `}>
                                    {getPostTypeLabel(post.type)}
                                </span>
                            </div>

                            {/* Bookmark button */}
                            {showBookmark && (
                                <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors">
                                    <Bookmark className="w-4 h-4 text-white" />
                                </button>
                            )}

                            {/* Reading time */}
                            <div className="absolute bottom-4 right-4 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
                                <Clock className="w-3 h-3" />
                                {readingTime} phút
                            </div>
                        </div>
                    )}

                    <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {formattedDate}
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-cyan-600 transition-colors flex-grow">
                            {post.title}
                        </h3>

                        {showExcerpt && excerpt && (
                            <p className="text-gray-600 leading-relaxed line-clamp-3 mb-4 text-sm">
                                {excerpt}
                            </p>
                        )}

                        <div className="mt-auto">
                            {showAuthor && post.profiles && (
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-3">
                                        {post.profiles.image_url ? (
                                            <Image
                                                src={post.profiles.image_url}
                                                alt={post.profiles.full_name}
                                                width={32}
                                                height={32}
                                                className="rounded-full object-cover ring-2 ring-cyan-100"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                                                <User className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">
                                                {post.profiles.full_name}
                                            </p>
                                            <p className="text-xs text-gray-500">Tác giả</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Eye className="w-4 h-4" />
                                        <span className="group-hover:text-cyan-600 transition-colors font-medium">
                                            Đọc thêm
                                        </span>
                                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </article>
            </Link>
        );
    }

    // List variant for news/blog lists
    if (variant === 'list') {
        return (
            <Link href={`/posts/${post.id}`}>
                <article className={`${baseClasses} flex`}>
                    {post.thumbnail && (
                        <div className="w-72 flex-shrink-0">
                            <div className="relative h-48 overflow-hidden rounded-l-2xl">
                                <Image
                                    src={post.thumbnail}
                                    alt={post.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                            </div>
                        </div>
                    )}

                    <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`
                                    px-3 py-1.5 text-sm font-semibold rounded-full
                                    ${post.type === 'activity'
                                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                                    : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800'
                                }
                                `}>
                                    {getPostTypeLabel(post.type)}
                                </span>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {formattedDate}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {readingTime} phút đọc
                                    </span>
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                                {post.title}
                            </h2>

                            {showExcerpt && excerpt && (
                                <p className="text-gray-600 leading-relaxed line-clamp-3 mb-4">
                                    {excerpt}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            {showAuthor && post.profiles && (
                                <div className="flex items-center gap-3">
                                    {post.profiles.image_url ? (
                                        <Image
                                            src={post.profiles.image_url}
                                            alt={post.profiles.full_name}
                                            width={40}
                                            height={40}
                                            className="rounded-full object-cover ring-2 ring-cyan-100"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium text-gray-700">
                                            {post.profiles.full_name}
                                        </p>
                                        <p className="text-sm text-gray-500">Tác giả</p>
                                    </div>
                                </div>
                            )}

                            {showStats && (
                                <div className="flex items-center gap-4">
                                    <button className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
                                        <Heart className="w-4 h-4" />
                                        <span className="text-sm">24</span>
                                    </button>
                                    <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
                                        <MessageCircle className="w-4 h-4" />
                                        <span className="text-sm">5</span>
                                    </button>
                                    <button className="flex items-center gap-1 text-gray-500 hover:text-green-500 transition-colors">
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </article>
            </Link>
        );
    }

    // Featured variant for hero sections
    if (variant === 'featured') {
        return (
            <Link href={`/posts/${post.id}`}>
                <article className={`${baseClasses} lg:flex relative overflow-hidden`}>
                    {/* Background gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/20 via-transparent to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {post.thumbnail && (
                        <div className="lg:w-3/5 relative">
                            <div className="relative h-80 lg:h-full">
                                <Image
                                    src={post.thumbnail}
                                    alt={post.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                                {/* Floating badge */}
                                <div className="absolute top-6 left-6">
                                    <span className={`
                                        px-4 py-2 text-sm font-bold rounded-full backdrop-blur-md shadow-lg
                                        ${post.type === 'activity'
                                        ? 'bg-green-500/90 text-white'
                                        : 'bg-blue-500/90 text-white'
                                    }
                                    `}>
                                        {getPostTypeLabel(post.type)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="lg:w-2/5 p-8 flex flex-col justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center text-sm text-gray-500 gap-4">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {formattedDate}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {readingTime} phút đọc
                                    </span>
                                </div>
                            </div>

                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 group-hover:text-cyan-600 transition-colors leading-tight">
                                {post.title}
                            </h2>

                            {showExcerpt && excerpt && (
                                <p className="text-gray-600 leading-relaxed line-clamp-4 mb-6 text-lg">
                                    {excerpt}
                                </p>
                            )}
                        </div>

                        {showAuthor && post.profiles && (
                            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                                <div className="flex items-center gap-4">
                                    {post.profiles.image_url ? (
                                        <Image
                                            src={post.profiles.image_url}
                                            alt={post.profiles.full_name}
                                            width={48}
                                            height={48}
                                            className="rounded-full object-cover ring-3 ring-cyan-100"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold text-gray-700 text-lg">
                                            {post.profiles.full_name}
                                        </p>
                                        <p className="text-sm text-gray-500">Tác giả</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-cyan-600 font-medium group-hover:gap-3 transition-all">
                                    <span>Đọc bài viết</span>
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        )}
                    </div>
                </article>
            </Link>
        );
    }

    // Default variant - Square Card Design
    return (
        <Link href={`/posts/${post.id}`}>
            <article className={`${baseClasses} aspect-square flex flex-col relative overflow-hidden`}>
                {/* Background Image */}
                {post.thumbnail && (
                    <div className="absolute inset-0">
                        <Image
                            src={post.thumbnail}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>
                )}

                {/* Top Section - Type Badge & Time */}
                <div className="relative z-10 p-4 flex justify-between items-start">
                    <span className={`
                        px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-md shadow-lg
                        ${post.type === 'activity'
                        ? 'bg-green-500/90 text-white ring-1 ring-green-400/30'
                        : 'bg-blue-500/90 text-white ring-1 ring-blue-400/30'
                    }
                    `}>
                        {getPostTypeLabel(post.type)}
                    </span>

                    <div className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full text-white text-xs">
                        <Clock className="w-3 h-3" />
                        {readingTime}p
                    </div>
                </div>

                {/* Main Content - Bottom Section */}
                <div className="relative z-10 p-4 mt-auto">
                    {/* Date */}
                    <div className="flex items-center gap-1 mb-3 text-xs text-white/80">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.created_at).toLocaleDateString('vi-VN')}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-3 line-clamp-3 group-hover:text-cyan-300 transition-colors leading-tight">
                        {post.title}
                    </h3>

                    {/* Excerpt */}
                    {showExcerpt && excerpt && (
                        <p className="text-white/90 text-sm leading-relaxed line-clamp-2 mb-4">
                            {excerpt}
                        </p>
                    )}

                    {/* Author & Actions */}
                    {showAuthor && post.profiles && (
                        <div className="flex items-center justify-between pt-3 border-t border-white/20">
                            <div className="flex items-center gap-2">
                                {post.profiles.image_url ? (
                                    <Image
                                        src={post.profiles.image_url}
                                        alt={post.profiles.full_name}
                                        width={28}
                                        height={28}
                                        className="rounded-full object-cover ring-2 ring-white/30"
                                    />
                                ) : (
                                    <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-medium text-white/95">
                                        {post.profiles.full_name}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-white/80 group-hover:text-cyan-300 transition-colors">
                                <Eye className="w-3 h-3" />
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    )}

                    {/* Interactive Stats */}
                    {showStats && (
                        <div className="flex items-center gap-4 mt-3">
                            <button className="flex items-center gap-1 text-white/60 hover:text-pink-400 transition-colors">
                                <Heart className="w-4 h-4" />
                                <span className="text-xs">24</span>
                            </button>
                            <button className="flex items-center gap-1 text-white/60 hover:text-blue-400 transition-colors">
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-xs">5</span>
                            </button>
                            <button className="text-white/60 hover:text-green-400 transition-colors">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Hover Overlay Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </article>
        </Link>
    );
};