'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { SectionHeader } from '@/component/SectionHeader';
import { Button } from '@/component/Button';
import {
    Plus,
    Search,
    X,
    Save,
    Users,
    BookOpen,
    Building,
    Image as ImageIcon,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Loader2,
    Upload
} from 'lucide-react';
import Image from 'next/image';
import {
    Statistic,
    Activity,
    Partner,
    Banner,
    EditingItem,
    TableType,
    FormState,
    NotificationState,
    getErrorMessage
} from '@/types/dashboard';
import { StatisticsTab, StatisticsForm } from '@/component/admin/dashboard/StatisticsTab';
import { ActivitiesTab } from '@/component/admin/dashboard/ActivitiesTab';
import { PartnersTab } from '@/component/admin/dashboard/PartnersTab';
import { BannersTab } from '@/component/admin/dashboard/BannersTab';

const DashboardModifyPage = () => {
    const { user } = useAuthStore();

    // States
    const [activeTab, setActiveTab] = useState<TableType>('statistics');
    const [statistics, setStatistics] = useState<Statistic[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);

    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<EditingItem>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState<FormState>({});
    const [notification, setNotification] = useState<NotificationState | null>(null);

    // Load data
    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'superadmin')) {
            loadAllData();
        }
    }, [user]);

    const loadAllData = async () => {
        try {
            setLoading(true);
            await Promise.all([loadStatistics(), loadActivities(), loadPartners(), loadBanners()]);
        } catch (err: unknown) {
            console.error('Error loading data:', err);
            showNotification('error', 'Không thể tải dữ liệu: ' + getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const loadStatistics = async () => {
        try {
            const { data, error } = await supabase.rpc('get_admin_statistics');
            if (error) throw error;
            setStatistics((data || []) as Statistic[]);
        } catch (err: unknown) {
            console.error('Error loading statistics:', err);
            showNotification('error', 'Không thể tải thống kê: ' + getErrorMessage(err));
        }
    };

    const loadActivities = async () => {
        try {
            const { data, error } = await supabase.rpc('get_admin_activities');
            if (error) throw error;
            setActivities((data || []) as Activity[]);
        } catch (err: unknown) {
            console.error('Error loading activities:', err);
            showNotification('error', 'Không thể tải hoạt động: ' + getErrorMessage(err));
        }
    };

    const loadPartners = async () => {
        try {
            const { data, error } = await supabase.rpc('get_admin_partners');
            if (error) throw error;
            setPartners((data || []) as Partner[]);
        } catch (err: unknown) {
            console.error('Error loading partners:', err);
            showNotification('error', 'Không thể tải đối tác: ' + getErrorMessage(err));
        }
    };

    const loadBanners = async () => {
        try {
            const { data, error } = await supabase.rpc('get_admin_banners');
            if (error) throw error;
            setBanners((data || []) as Banner[]);
        } catch (err: unknown) {
            console.error('Error loading banners:', err);
            showNotification('error', 'Không thể tải banner: ' + getErrorMessage(err));
        }
    };

    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const uploadImage = async (file: File): Promise<string> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = Date.now() + '-' + Math.random() + '.' + fileExt;
            const filePath = 'dashboard/' + fileName;

            const { data, error } = await supabase.storage.from('images').upload(filePath, file);
            if (error) throw error;

            const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
            return urlData.publicUrl;
        } catch (err: unknown) {
            console.error('Error uploading image:', err);
            throw new Error('Không thể upload ảnh: ' + getErrorMessage(err));
        }
    };

    const handleImageUpload = async (file: File, fieldName: 'thumbnail' | 'logo_url' | 'image_url') => {
        try {
            setUploading(true);
            const imageUrl = await uploadImage(file);
            setFormData((prev: FormState) => ({ ...prev, [fieldName]: imageUrl }));
        } catch (error) {
            showNotification('error', 'Lỗi khi upload ảnh');
        } finally {
            setUploading(false);
        }
    };

    const saveItem = async () => {
        if (!user) return;

        try {
            setUploading(true);

            // Validate required fields
            if (activeTab === 'statistics') {
                if (!formData.name || !formData.icon || !formData.label) {
                    showNotification('error', 'Vui lòng điền đầy đủ thông tin bắt buộc');
                    return;
                }
                // Validate value for manual data source
                if ((!formData.data_source || formData.data_source === 'manual') && !formData.value) {
                    showNotification('error', 'Vui lòng nhập giá trị cho nguồn dữ liệu thủ công');
                    return;
                }
            } else if (activeTab === 'activities') {
                if (!formData.title || !formData.description || !formData.thumbnail) {
                    showNotification('error', 'Vui lòng điền đầy đủ thông tin bắt buộc');
                    return;
                }
            } else if (activeTab === 'partners') {
                if (!formData.name || !formData.logo_url) {
                    showNotification('error', 'Vui lòng điền đầy đủ thông tin bắt buộc');
                    return;
                }
            } else if (activeTab === 'banners') {
                if (!formData.name || !formData.image_url) {
                    showNotification('error', 'Vui lòng điền đầy đủ thông tin bắt buộc');
                    return;
                }
            }

            const baseData: Record<string, unknown> = {
                ...formData,
                display_order: formData.display_order ?? 0,
                published: formData.published ?? false
            };

            // Set default data_source for statistics
            if (activeTab === 'statistics' && !baseData.data_source) {
                baseData.data_source = 'manual';
            }

            Object.keys(baseData).forEach((key) => {
                if (baseData[key] === undefined) {
                    delete baseData[key];
                }
            });

            let saveError: unknown = null;

            if (editingItem) {
                const { id, created_at, updated_at, ...updateData } = baseData;
                const { error } = await supabase.from(activeTab).update(updateData).eq('id', editingItem.id);
                saveError = error;
            } else {
                const { id, created_at, updated_at, ...insertData } = baseData;
                const { error } = await supabase.from(activeTab).insert([insertData]);
                saveError = error;
            }

            if (saveError) throw saveError;

            showNotification('success', editingItem ? 'Cập nhật thành công' : 'Tạo mới thành công');
            resetForm();
            loadAllData();
        } catch (err: unknown) {
            console.error('Error saving item:', err);
            showNotification('error', 'Lỗi khi lưu dữ liệu: ' + getErrorMessage(err));
        } finally {
            setUploading(false);
        }
    };

    const deleteItem = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa item này?')) return;

        try {
            const { error } = await supabase.from(activeTab).delete().eq('id', id);
            if (error) throw error;

            showNotification('success', 'Xóa thành công');
            loadAllData();
        } catch (err: unknown) {
            console.error('Error deleting item:', err);
            showNotification('error', 'Lỗi khi xóa: ' + getErrorMessage(err));
        }
    };

    const togglePublishStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase.from(activeTab).update({ published: !currentStatus }).eq('id', id);
            if (error) throw error;

            showNotification('success', 'Cập nhật trạng thái thành công');
            loadAllData();
        } catch (err: unknown) {
            console.error('Error updating status:', err);
            showNotification('error', 'Lỗi khi cập nhật trạng thái: ' + getErrorMessage(err));
        }
    };

    const editItem = (item: EditingItem) => {
        setEditingItem(item);
        setFormData({
            ...(item ?? {}),
            display_order: item?.display_order ?? 0,
            published: item?.published ?? false
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({
            display_order: 0,
            published: false
        });
    };

    const getCurrentData = () => {
        switch (activeTab) {
            case 'statistics':
                return statistics;
            case 'activities':
                return activities;
            case 'partners':
                return partners;
            case 'banners':
                return banners;
            default:
                return [];
        }
    };

    const filteredData = getCurrentData().filter((item: any) => {
        const searchFields =
            activeTab === 'statistics'
                ? [item.name, item.label]
                : activeTab === 'activities'
                    ? [item.title, item.description]
                    : activeTab === 'partners'
                        ? [item.name, item.description]
                        : [item.name];

        return searchFields.some((field) => field?.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    useEffect(() => {
        if (showForm) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '15px';
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        }

        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        };
    }, [showForm]);

    // Render form based on active tab
    const renderFormFields = () => {
        if (activeTab === 'statistics') {
            return <StatisticsForm formData={formData} setFormData={setFormData} />;
        } else if (activeTab === 'activities') {
            return (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
                        <input
                            type="text"
                            value={formData.title || ''}
                            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) await handleImageUpload(file, 'thumbnail');
                                }}
                                className="hidden"
                                id="activity-image"
                                disabled={uploading}
                            />
                            <label
                                htmlFor="activity-image"
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                                <Upload className="w-4 h-4" />
                                {uploading ? 'Đang tải...' : 'Chọn ảnh'}
                            </label>
                            {formData.thumbnail && (
                                <div className="relative w-16 h-16">
                                    <Image src={formData.thumbnail} alt="Preview" fill className="object-cover rounded-lg" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Thứ tự</label>
                        <input
                            type="number"
                            value={formData.display_order ?? 0}
                            onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </>
            );
        } else if (activeTab === 'partners') {
            return (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tên đối tác</label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) await handleImageUpload(file, 'logo_url');
                                }}
                                className="hidden"
                                id="partner-logo"
                                disabled={uploading}
                            />
                            <label
                                htmlFor="partner-logo"
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                                <Upload className="w-4 h-4" />
                                {uploading ? 'Đang tải...' : 'Chọn logo'}
                            </label>
                            {formData.logo_url && (
                                <div className="relative w-16 h-16">
                                    <Image src={formData.logo_url} alt="Preview" fill className="object-cover rounded-lg" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                            <input
                                type="url"
                                value={formData.website_url || ''}
                                onChange={(e) => setFormData((prev) => ({ ...prev, website_url: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Thứ tự</label>
                            <input
                                type="number"
                                value={formData.display_order ?? 0}
                                onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </>
            );
        } else if (activeTab === 'banners') {
            return (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tên banner</label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh banner</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) await handleImageUpload(file, 'image_url');
                                }}
                                className="hidden"
                                id="banner-image"
                                disabled={uploading}
                            />
                            <label
                                htmlFor="banner-image"
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                                <Upload className="w-4 h-4" />
                                {uploading ? 'Đang tải...' : 'Chọn ảnh'}
                            </label>
                            {formData.image_url && (
                                <div className="relative w-16 h-16">
                                    <Image src={formData.image_url} alt="Preview" fill className="object-cover rounded-lg" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Liên kết</label>
                            <input
                                type="url"
                                value={formData.link_url || ''}
                                onChange={(e) => setFormData((prev) => ({ ...prev, link_url: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Thứ tự</label>
                            <input
                                type="number"
                                value={formData.display_order ?? 0}
                                onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="open_new_tab"
                            checked={formData.open_new_tab || false}
                            onChange={(e) => setFormData((prev) => ({ ...prev, open_new_tab: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="open_new_tab" className="text-sm font-medium text-gray-700">
                            Mở ở tab mới
                        </label>
                    </div>
                </>
            );
        }
    };

    const renderForm = () => {
        if (!showForm) return null;

        const getTabTitle = () => {
            switch (activeTab) {
                case 'statistics':
                    return 'thống kê';
                case 'activities':
                    return 'hoạt động';
                case 'partners':
                    return 'đối tác';
                case 'banners':
                    return 'banner';
            }
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={resetForm} />

                <div className="relative bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold">
                                {editingItem ? 'Chỉnh sửa' : 'Tạo mới'} {getTabTitle()}
                            </h3>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        {renderFormFields()}

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="published"
                                checked={formData.published || false}
                                onChange={(e) => setFormData((prev) => ({ ...prev, published: e.target.checked }))}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="published" className="text-sm font-medium text-gray-700">
                                Xuất bản
                            </label>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-200 flex gap-4 justify-end">
                        <Button variant="outline" onClick={resetForm}>
                            Hủy
                        </Button>
                        <Button onClick={saveItem} disabled={uploading} className="flex items-center gap-2">
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {editingItem ? 'Cập nhật' : 'Tạo mới'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h2>
                    <p className="text-gray-600">Bạn cần quyền admin để truy cập trang này.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
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
                <SectionHeader title="CHỈNH SỬA TRANG CHỦ" subtitle="Quản lý nội dung hiển thị trên trang chủ website" />

                {/* Tabs */}
                <div className="mb-8 bg-white rounded-xl shadow-sm">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            {[
                                { id: 'statistics', label: 'Thống kê', icon: <Users className="w-4 h-4" /> },
                                { id: 'activities', label: 'Hoạt động', icon: <BookOpen className="w-4 h-4" /> },
                                { id: 'partners', label: 'Đối tác', icon: <Building className="w-4 h-4" /> },
                                { id: 'banners', label: 'Banner', icon: <ImageIcon className="w-4 h-4" /> }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TableType)}
                                    className={`${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
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
                                    placeholder="Tìm kiếm..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={loadAllData} disabled={loading} className="flex items-center gap-2">
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    Tải lại
                                </Button>
                                <Button
                                    onClick={() => {
                                        setEditingItem(null);
                                        setFormData({
                                            display_order: getCurrentData().length + 1,
                                            published: false,
                                            data_source: activeTab === 'statistics' ? 'manual' : undefined
                                        });
                                        setShowForm(true);
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Tạo mới
                                </Button>
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
                    ) : filteredData.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="text-gray-400 mb-4">
                                {activeTab === 'statistics' && <Users className="w-12 h-12 mx-auto" />}
                                {activeTab === 'activities' && <BookOpen className="w-12 h-12 mx-auto" />}
                                {activeTab === 'partners' && <Building className="w-12 h-12 mx-auto" />}
                                {activeTab === 'banners' && <ImageIcon className="w-12 h-12 mx-auto" />}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có dữ liệu</h3>
                            <p className="text-gray-600 mb-4">
                                Bắt đầu bằng cách tạo{' '}
                                {activeTab === 'statistics'
                                    ? 'thống kê'
                                    : activeTab === 'activities'
                                        ? 'hoạt động'
                                        : activeTab === 'partners'
                                            ? 'đối tác'
                                            : 'banner'}{' '}
                                đầu tiên
                            </p>
                            <Button
                                onClick={() => {
                                    setEditingItem(null);
                                    setFormData({
                                        display_order: getCurrentData().length + 1,
                                        published: false,
                                        data_source: activeTab === 'statistics' ? 'manual' : undefined
                                    });
                                    setShowForm(true);
                                }}
                                className="flex items-center gap-2 mx-auto"
                            >
                                <Plus className="w-4 h-4" />
                                Tạo mới
                            </Button>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'statistics' && (
                                <StatisticsTab
                                    statistics={filteredData as Statistic[]}
                                    onEdit={editItem}
                                    onDelete={deleteItem}
                                    onTogglePublish={togglePublishStatus}
                                />
                            )}
                            {activeTab === 'activities' && (
                                <ActivitiesTab
                                    activities={filteredData as Activity[]}
                                    onEdit={editItem}
                                    onDelete={deleteItem}
                                    onTogglePublish={togglePublishStatus}
                                />
                            )}
                            {activeTab === 'partners' && (
                                <PartnersTab
                                    partners={filteredData as Partner[]}
                                    onEdit={editItem}
                                    onDelete={deleteItem}
                                    onTogglePublish={togglePublishStatus}
                                />
                            )}
                            {activeTab === 'banners' && (
                                <BannersTab
                                    banners={filteredData as Banner[]}
                                    onEdit={editItem}
                                    onDelete={deleteItem}
                                    onTogglePublish={togglePublishStatus}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Summary */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Thống kê', count: statistics.length, published: statistics.filter((s) => s.published).length },
                        { label: 'Hoạt động', count: activities.length, published: activities.filter((a) => a.published).length },
                        { label: 'Đối tác', count: partners.length, published: partners.filter((p) => p.published).length },
                        { label: 'Banner', count: banners.length, published: banners.filter((b) => b.published).length }
                    ].map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                            <div className="text-sm font-medium text-gray-500 mb-2">{stat.label}</div>
                            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.count}</div>
                            <div className="text-sm text-green-600">{stat.published} đã xuất bản</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Modal */}
            {renderForm()}
        </div>
    );
};

export default DashboardModifyPage;