'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import {
    Edit,
    Trash2,
    Tag,
    Loader2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

interface Tag {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    post_count?: number;
}

interface TagsTabProps {
    searchTerm: string;
    onEditTag: (tag: Tag) => void;
    showNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

// Helper functions
function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err && 'message' in err) {
        const m = (err as { message?: unknown }).message;
        return typeof m === 'string' ? m : JSON.stringify(m);
    }
    return typeof err === 'string' ? err : JSON.stringify(err);
}

const TagsTab = React.forwardRef<{ reload: () => void }, TagsTabProps>(({
                                                                            searchTerm,
                                                                            onEditTag,
                                                                            showNotification
                                                                        }, ref) => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 20;

    // Load tags with pagination and filters
    const loadTags = async (page: number = 1) => {
        try {
            setLoading(true);

            // Build query
            let query = supabase
                .from('tags')
                .select(`
                    *,
                    post_tags (
                        id
                    )
                `, { count: 'exact' });

            // Apply search filter
            if (searchTerm.trim()) {
                query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            query = query
                .range(from, to)
                .order('name', { ascending: true });

            const { data, error, count } = await query;

            if (error) throw error;

            // Transform data to include post count
            const tagsWithCount = (data || []).map(tag => ({
                ...tag,
                post_count: tag.post_tags?.length || 0
            }));

            setTags(tagsWithCount);
            setTotalCount(count || 0);
            setTotalPages(Math.ceil((count || 0) / pageSize));

        } catch (error) {
            console.error('Error loading tags:', error);
            showNotification('error', 'Không thể tải danh sách tag: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    // Delete tag
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

            // If current page becomes empty, go to previous page
            if (tags.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
                loadTags(currentPage - 1);
            } else {
                loadTags(currentPage);
            }
        } catch (error) {
            console.error('Error deleting tag:', error);
            showNotification('error', 'Lỗi khi xóa tag: ' + getErrorMessage(error));
        }
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        loadTags(newPage);
    };

    // Expose reload function for parent component
    React.useImperativeHandle(ref, () => ({
        reload: () => loadTags(currentPage)
    }));

    // Effects
    useEffect(() => {
        setCurrentPage(1);
        loadTags(1);
    }, [searchTerm]);

    if (loading) {
        return (
            <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (tags.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-600">Không có tag nào.</p>
            </div>
        );
    }

    return (
        <>
            {/* Tags Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tag
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mô tả
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Số bài viết
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
                    {tags.map((tag) => (
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
                                        onClick={() => onEditTag(tag)}
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị {((currentPage - 1) * pageSize) + 1} đến {Math.min(currentPage * pageSize, totalCount)} trong tổng số {totalCount} tag
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Trước
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        if (totalPages <= 7) return true;
                                        if (page === 1 || page === totalPages) return true;
                                        if (Math.abs(page - currentPage) <= 1) return true;
                                        return false;
                                    })
                                    .map((page, index, array) => {
                                        const prevPage = array[index - 1];
                                        const shouldShowEllipsis = prevPage && page - prevPage > 1;

                                        return (
                                            <React.Fragment key={page}>
                                                {shouldShowEllipsis && (
                                                    <span className="px-3 py-2 text-sm text-gray-500">...</span>
                                                )}
                                                <button
                                                    onClick={() => handlePageChange(page)}
                                                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                        currentPage === page
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            </React.Fragment>
                                        );
                                    })}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sau
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});

TagsTab.displayName = 'TagsTab';

export default TagsTab;