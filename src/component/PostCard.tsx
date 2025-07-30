'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, Eye } from 'lucide-react';
import { Post, extractTextFromContent, formatDate, getPostTypeLabel } from '@/lib/posts';

interface PostCardProps {
    post: Post;
    variant?: 'default' | 'compact' | 'featured';
    showAuthor?: boolean;
    showExcerpt?: boolean;
    className?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
                                                      post,
                                                      variant = 'default',
                                                      showAuthor = true,
                                                      showExcerpt = true,
                                                      className = ''
                                                  }) => {
    const excerpt = extractTextFromContent(post.content);
    const formattedDate = formatDate(post.published_at || post.created_at);

    const baseClasses = `
    group bg-white rounded-xl shadow-lg overflow-hidden 
    transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
    border border-gray-100 hover:border-cyan-200
    ${className}
  `;

    if (variant === 'compact') {
        return (
            <Link href={`/posts/${post.id}`}>
                <article className={baseClasses}>
                    <div className="flex gap-4 p-4">
                        {post.thumbnail && (
                            <div className="flex-shrink-0">
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                                    <Image
                                        src={post.thumbnail}
                                        alt={post.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                <span className={`
                  px-2 py-1 text-xs font-medium rounded-full
                  ${post.type === 'activity'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }
                `}>
                  {getPostTypeLabel(post.type)}
                </span>
                                <span className="text-xs text-gray-500">{formattedDate}</span>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                                {post.title}
                            </h3>
                            {showAuthor && post.profiles && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Bởi {post.profiles.full_name}
                                </p>
                            )}
                        </div>
                    </div>
                </article>
            </Link>
        );
    }

    if (variant === 'featured') {
        return (
            <Link href={`/posts/${post.id}`}>
                <article className={`${baseClasses} lg:flex`}>
                    {post.thumbnail && (
                        <div className="lg:w-1/2">
                            <div className="relative h-64 lg:h-full">
                                <Image
                                    src={post.thumbnail}
                                    alt={post.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
                        </div>
                    )}
                    <div className="p-6 lg:w-1/2 lg:flex lg:flex-col lg:justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                <span className={`
                  px-3 py-1 text-sm font-medium rounded-full
                  ${post.type === 'activity'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }
                `}>
                  {getPostTypeLabel(post.type)}
                </span>
                                <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {formattedDate}
                                </div>
                            </div>
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 group-hover:text-cyan-600 transition-colors">
                                {post.title}
                            </h2>
                            {showExcerpt && excerpt && (
                                <p className="text-gray-600 leading-relaxed line-clamp-3 mb-4">
                                    {excerpt}
                                </p>
                            )}
                        </div>
                        {showAuthor && post.profiles && (
                            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                {post.profiles.image_url ? (
                                    <Image
                                        src={post.profiles.image_url}
                                        alt={post.profiles.full_name}
                                        width={32}
                                        height={32}
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <span className="text-sm font-medium text-gray-700">
                  {post.profiles.full_name}
                </span>
                            </div>
                        )}
                    </div>
                </article>
            </Link>
        );
    }

    // Default variant
    return (
        <Link href={`/posts/${post.id}`}>
            <article className={baseClasses}>
                {post.thumbnail && (
                    <div className="relative h-48 overflow-hidden">
                        <Image
                            src={post.thumbnail}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        <div className="absolute top-4 left-4">
              <span className={`
                px-3 py-1 text-sm font-medium rounded-full backdrop-blur-sm
                ${post.type === 'activity'
                  ? 'bg-green-100/90 text-green-800'
                  : 'bg-blue-100/90 text-blue-800'
              }
              `}>
                {getPostTypeLabel(post.type)}
              </span>
                        </div>
                    </div>
                )}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {formattedDate}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                        {post.title}
                    </h3>

                    {showExcerpt && excerpt && (
                        <p className="text-gray-600 leading-relaxed line-clamp-3 mb-4">
                            {excerpt}
                        </p>
                    )}

                    {showAuthor && post.profiles && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                {post.profiles.image_url ? (
                                    <Image
                                        src={post.profiles.image_url}
                                        alt={post.profiles.full_name}
                                        width={24}
                                        height={24}
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                                        <User className="w-3 h-3 text-white" />
                                    </div>
                                )}
                                <span className="text-sm text-gray-600">
                  {post.profiles.full_name}
                </span>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Eye className="w-3 h-3" />
                                Đọc thêm
                            </div>
                        </div>
                    )}
                </div>
            </article>
        </Link>
    );
};