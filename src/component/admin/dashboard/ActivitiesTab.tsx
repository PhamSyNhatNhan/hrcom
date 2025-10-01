'use client';
import React from 'react';
import { Edit, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { Activity } from '@/types/dashboard';

interface ActivitiesTabProps {
    activities: Activity[];
    onEdit: (item: Activity) => void;
    onDelete: (id: string) => void;
    onTogglePublish: (id: string, currentStatus: boolean) => void;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
                                                                activities,
                                                                onEdit,
                                                                onDelete,
                                                                onTogglePublish
                                                            }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <GripVertical className="w-4 h-4" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ảnh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tiêu đề
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mô tả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                    </th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-gray-400">
                                <GripVertical className="w-4 h-4" />
                                <span className="ml-2 text-sm">{item.display_order}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            {item.thumbnail && (
                                <div className="relative w-16 h-16">
                                    <Image
                                        src={item.thumbnail}
                                        alt={item.title}
                                        fill
                                        className="object-cover rounded-lg"
                                    />
                                </div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                            <div className="text-sm text-gray-500 line-clamp-3">{item.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <button
                                onClick={() => onTogglePublish(item.id, item.published)}
                                className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                                    item.published
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                }`}
                            >
                                {item.published ? (
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => onEdit(item)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                    title="Chỉnh sửa"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(item.id)}
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
    );
};