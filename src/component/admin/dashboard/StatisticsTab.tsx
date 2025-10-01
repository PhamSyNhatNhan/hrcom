'use client';
import React from 'react';
import { Edit, Trash2, Eye, EyeOff, GripVertical, Users, BookOpen, FileText, Mic, AlertCircle, Award, Briefcase, GraduationCap, Heart, Star, TrendingUp, Target, Activity as ActivityIcon, CheckCircle, Building, Info } from 'lucide-react';
import { Statistic, FormState, DataSourceType } from '@/types/dashboard';

interface StatisticsTabProps {
    statistics: Statistic[];
    onEdit: (item: Statistic) => void;
    onDelete: (id: string) => void;
    onTogglePublish: (id: string, currentStatus: boolean) => void;
}

// Icon mapping
const getIconComponent = (iconName: string) => {
    switch (iconName) {
        case 'UserCheck':
        case 'Users':
            return <Users className="w-5 h-5" />;
        case 'BookOpenCheck':
        case 'BookOpen':
            return <BookOpen className="w-5 h-5" />;
        case 'FileText':
            return <FileText className="w-5 h-5" />;
        case 'Mic':
            return <Mic className="w-5 h-5" />;
        case 'Building':
            return <Building className="w-5 h-5" />;
        case 'Award':
            return <Award className="w-5 h-5" />;
        case 'Briefcase':
            return <Briefcase className="w-5 h-5" />;
        case 'GraduationCap':
            return <GraduationCap className="w-5 h-5" />;
        case 'Heart':
            return <Heart className="w-5 h-5" />;
        case 'Star':
            return <Star className="w-5 h-5" />;
        case 'TrendingUp':
            return <TrendingUp className="w-5 h-5" />;
        case 'Target':
            return <Target className="w-5 h-5" />;
        case 'Activity':
            return <ActivityIcon className="w-5 h-5" />;
        case 'CheckCircle':
            return <CheckCircle className="w-5 h-5" />;
        default:
            return <AlertCircle className="w-5 h-5" />;
    }
};

export const StatisticsTab: React.FC<StatisticsTabProps> = ({
                                                                statistics,
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
                        Icon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nhãn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá trị
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
                {statistics.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-gray-400">
                                <GripVertical className="w-4 h-4" />
                                <span className="ml-2 text-sm">{item.display_order}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                                {getIconComponent(item.icon)}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{item.label}</div>
                            <div className="text-sm text-gray-500">{item.name}</div>
                            {item.data_source && item.data_source !== 'manual' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                        Auto: {item.data_source}
                                    </span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-blue-600">{item.value}</div>
                            {item.data_source === 'manual' && (
                                <span className="text-xs text-gray-500">Manual</span>
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

// Statistics Form Component (merged)
interface StatisticsFormProps {
    formData: FormState;
    setFormData: React.Dispatch<React.SetStateAction<FormState>>;
}

const AVAILABLE_ICONS = [
    'UserCheck',
    'Users',
    'BookOpen',
    'BookOpenCheck',
    'FileText',
    'Mic',
    'Building',
    'Award',
    'Briefcase',
    'GraduationCap',
    'Heart',
    'Star',
    'TrendingUp',
    'Target',
    'Activity',
    'CheckCircle'
] as const;

export const StatisticsForm: React.FC<StatisticsFormProps> = ({ formData, setFormData }) => {
    const dataSourceOptions: { value: DataSourceType; label: string; description: string }[] = [
        { value: 'manual', label: 'Thủ công', description: 'Nhập giá trị cố định' },
        { value: 'mentors', label: 'Mentor', description: 'Đếm số mentor đã publish' },
        { value: 'posts', label: 'Bài viết', description: 'Đếm số bài viết (có thể lọc theo type)' },
        { value: 'users', label: 'Người dùng', description: 'Đếm tổng số người dùng' },
        { value: 'activities', label: 'Hoạt động', description: 'Đếm số hoạt động đã publish' },
        { value: 'partners', label: 'Đối tác', description: 'Đếm số đối tác đã publish' },
        { value: 'bookings', label: 'Booking', description: 'Đếm số lượt đặt lịch (có thể lọc theo status)' }
    ];

    const isManual = !formData.data_source || formData.data_source === 'manual';
    const showPostTypeFilter = formData.data_source === 'posts';
    const showBookingStatusFilter = formData.data_source === 'bookings';

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên</label>
                    <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: mentor_count"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                    <select
                        value={formData.icon || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Chọn icon</option>
                        {AVAILABLE_ICONS.map((icon) => (
                            <option key={icon} value={icon}>
                                {icon}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nhãn hiển thị</label>
                <input
                    type="text"
                    value={formData.label || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Mentor đồng hành"
                />
            </div>

            {/* Data Source Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nguồn dữ liệu
                    <span className="ml-2 text-xs text-gray-500">(Cách lấy giá trị)</span>
                </label>
                <select
                    value={formData.data_source || 'manual'}
                    onChange={(e) => {
                        const newSource = e.target.value as DataSourceType;
                        setFormData((prev) => ({
                            ...prev,
                            data_source: newSource,
                            value: newSource === 'manual' ? prev.value : '0',
                            data_filter: newSource === 'manual' ? undefined : {}
                        }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    {dataSourceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label} - {option.description}
                        </option>
                    ))}
                </select>
            </div>

            {/* Value input - only for manual */}
            {isManual && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá trị
                        <span className="ml-2 text-xs text-gray-500">(Nhập giá trị cố định)</span>
                    </label>
                    <input
                        type="text"
                        value={formData.value || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: 100+ hoặc 1000"
                    />
                </div>
            )}

            {/* Auto value info */}
            {!isManual && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <strong>Giá trị tự động:</strong> Hệ thống sẽ tự động đếm và cập nhật giá trị dựa trên nguồn dữ liệu đã chọn.
                        </div>
                    </div>
                </div>
            )}

            {/* Post type filter - only for posts data source */}
            {showPostTypeFilter && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lọc theo loại bài viết
                        <span className="ml-2 text-xs text-gray-500">(Tùy chọn)</span>
                    </label>
                    <select
                        value={formData.data_filter?.type || ''}
                        onChange={(e) => {
                            const type = e.target.value;
                            setFormData((prev) => ({
                                ...prev,
                                data_filter: type ? { type } : {}
                            }));
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả loại</option>
                        <option value="blog">Blog</option>
                        <option value="activity">Activity</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                        Để trống để đếm tất cả bài viết, chọn loại cụ thể để lọc
                    </p>
                </div>
            )}

            {/* Booking status filter - only for bookings data source */}
            {showBookingStatusFilter && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lọc theo trạng thái booking
                        <span className="ml-2 text-xs text-gray-500">(Tùy chọn)</span>
                    </label>
                    <select
                        value={formData.data_filter?.status || ''}
                        onChange={(e) => {
                            const status = e.target.value;
                            setFormData((prev) => ({
                                ...prev,
                                data_filter: status ? { status } : {}
                            }));
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="pending">Chờ xác nhận</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="completed">Đã hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                        Để trống để đếm tất cả booking, chọn trạng thái cụ thể để lọc
                    </p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thứ tự</label>
                <input
                    type="number"
                    value={formData.display_order ?? 0}
                    onChange={(e) =>
                        setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </>
    );
};