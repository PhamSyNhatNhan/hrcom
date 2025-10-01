'use client';
import React from 'react';
import { Edit, Trash2, Eye, EyeOff, GripVertical, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { Partner } from '@/types/dashboard';

interface PartnersTabProps {
    partners: Partner[];
    onEdit: (item: Partner) => void;
    onDelete: (id: string) => void;
    onTogglePublish: (id: string, currentStatus: boolean) => void;
}

export const PartnersTab: React.FC<PartnersTabProps> = ({
                                                            partners,
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
                        Logo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Website
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
                {partners.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-gray-400">
                                <GripVertical className="w-4 h-4" />
                                <span className="ml-2 text-sm">{item.display_order}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            {item.logo_url && (
                                <div className="relative w-16 h-16">
                                    <Image
                                        src={item.logo_url}
                                        alt={item.name}
                                        fill
                                        className="object-contain rounded-lg"
                                    />
                                </div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            {item.description && (
                                <div className="text-sm text-gray-500 line-clamp-2">{item.description}</div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            {item.website_url && (
                                <a
                                    href={item.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    <span className="text-sm truncate max-w-32">{item.website_url}</span>
                                </a>
                            )}
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