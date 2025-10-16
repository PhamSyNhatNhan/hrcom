'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Save,
    X,
    Award,
    Tag,
    RefreshCw
} from 'lucide-react';

// Import types
import type { MentorSkill } from '@/types/mentor_admin';

interface MentorSkillsTabProps {
    skills: MentorSkill[];
    setSkills: React.Dispatch<React.SetStateAction<MentorSkill[]>>;
    loading: boolean;
    onReload: () => void;
    showNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

const MentorSkillsTab: React.FC<MentorSkillsTabProps> = ({
                                                             skills,
                                                             setSkills,
                                                             loading,
                                                             onReload,
                                                             showNotification
                                                         }) => {
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [showPublishedOnly, setShowPublishedOnly] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingSkill, setEditingSkill] = useState<MentorSkill | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        published: true
    });

    // Filter skills
    const filteredSkills = skills.filter(skill => {
        const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (skill.description && skill.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesPublished = !showPublishedOnly || skill.published;
        return matchesSearch && matchesPublished;
    });

    // Get stats
    const stats = {
        total: skills.length,
        published: skills.filter(s => s.published).length,
        unpublished: skills.filter(s => !s.published).length
    };

    // Reset form
    const resetForm = () => {
        setShowForm(false);
        setEditingSkill(null);
        setFormData({
            name: '',
            description: '',
            published: true
        });
    };

    // Edit skill
    const editSkill = (skill: MentorSkill) => {
        setEditingSkill(skill);
        setFormData({
            name: skill.name,
            description: skill.description || '',
            published: skill.published
        });
        setShowForm(true);
    };

    // Save skill using RPC
    const saveSkill = async () => {
        if (!formData.name.trim()) {
            showNotification('error', 'Vui lòng nhập tên skill');
            return;
        }

        try {
            setSaving(true);

            if (editingSkill) {
                // Update existing skill
                const { error } = await supabase.rpc('mentor_admin_update_skill', {
                    p_skill_id: editingSkill.id,
                    p_name: formData.name.trim(),
                    p_description: formData.description.trim() || null,
                    p_published: formData.published
                });

                if (error) throw error;

                // Update local state
                setSkills(prev => prev.map(skill =>
                    skill.id === editingSkill.id
                        ? { ...skill, name: formData.name.trim(), description: formData.description.trim(), published: formData.published, updated_at: new Date().toISOString() }
                        : skill
                ));
            } else {
                // Create new skill
                const { data: newSkillId, error } = await supabase.rpc('mentor_admin_create_skill', {
                    p_name: formData.name.trim(),
                    p_description: formData.description.trim() || null,
                    p_published: formData.published
                });

                if (error) throw error;

                // Add to local state
                const newSkill: MentorSkill = {
                    id: newSkillId,
                    name: formData.name.trim(),
                    description: formData.description.trim() || undefined,
                    published: formData.published,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                setSkills(prev => [newSkill, ...prev]);
            }

            resetForm();
            showNotification('success', `Skill đã được ${editingSkill ? 'cập nhật' : 'tạo'} thành công!`);

        } catch (error: any) {
            console.error('Error saving skill:', error);
            showNotification('error', 'Lỗi khi lưu skill: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Delete skill using RPC
    const deleteSkill = async (skillId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa skill này? Hành động này không thể hoàn tác.')) {
            return;
        }

        try {
            const { error } = await supabase.rpc('mentor_admin_delete_skill', {
                p_skill_id: skillId
            });

            if (error) {
                if (error.message.includes('in use')) {
                    showNotification('warning', 'Không thể xóa skill này vì đang được sử dụng bởi các mentor. Vui lòng ẩn skill thay vì xóa.');
                    return;
                }
                throw error;
            }

            // Remove from local state
            setSkills(prev => prev.filter(skill => skill.id !== skillId));
            showNotification('success', 'Skill đã được xóa thành công!');

        } catch (error: any) {
            console.error('Error deleting skill:', error);
            showNotification('error', 'Lỗi khi xóa skill: ' + error.message);
        }
    };

    // Toggle published status using RPC
    const togglePublishStatus = async (skillId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase.rpc('mentor_admin_update_skill', {
                p_skill_id: skillId,
                p_published: !currentStatus
            });

            if (error) throw error;

            // Update local state
            setSkills(prev => prev.map(skill =>
                skill.id === skillId ? { ...skill, published: !currentStatus, updated_at: new Date().toISOString() } : skill
            ));

        } catch (error: any) {
            console.error('Error updating publish status:', error);
            showNotification('error', 'Lỗi khi cập nhật trạng thái: ' + error.message);
        }
    };

    // Lock body scroll when modal open
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Quản lý Skills Mentor</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Tạo và quản lý danh sách kỹ năng cho mentor
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onReload}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm Skill
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Award className="h-6 w-6 text-blue-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Tổng Skills</p>
                            <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Eye className="h-6 w-6 text-green-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Đã xuất bản</p>
                            <p className="text-lg font-semibold text-green-600">{stats.published}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <EyeOff className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Chưa xuất bản</p>
                            <p className="text-lg font-semibold text-gray-600">{stats.unpublished}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm skill..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Show Published Only Filter */}
                    <div className="flex items-center">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={showPublishedOnly}
                                onChange={(e) => setShowPublishedOnly(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Chỉ hiển thị đã xuất bản</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Skill Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                        onClick={resetForm}
                    />

                    <div className="relative bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {editingSkill ? 'Chỉnh sửa Skill' : 'Thêm Skill Mới'}
                                </h3>
                                <button
                                    onClick={resetForm}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Skill Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên Skill *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="VD: JavaScript, React, Leadership..."
                                    disabled={saving}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mô tả (tùy chọn)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Mô tả ngắn gọn về skill này..."
                                    disabled={saving}
                                />
                            </div>

                            {/* Published Status */}
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="skill-published"
                                    checked={formData.published}
                                    onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    disabled={saving}
                                />
                                <label htmlFor="skill-published" className="text-sm text-gray-700">
                                    Xuất bản (hiển thị cho mentor chọn)
                                </label>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                disabled={saving}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={saveSkill}
                                disabled={saving || !formData.name.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {editingSkill ? 'Cập nhật' : 'Tạo'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Skills List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Đang tải...</p>
                    </div>
                ) : filteredSkills.length === 0 ? (
                    <div className="p-8 text-center">
                        <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                            {searchTerm || showPublishedOnly ? 'Không có skill nào phù hợp' : 'Chưa có skill nào'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredSkills.map((skill) => (
                            <div key={skill.id} className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Tag className="w-4 h-4 text-blue-600" />
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {skill.name}
                                                    </h3>
                                                    {skill.description && (
                                                        <p className="text-gray-600 text-sm mt-1">
                                                            {skill.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 ml-4">
                                        {/* Eye Icon - Separate Button */}
                                        <button
                                            onClick={() => togglePublishStatus(skill.id, skill.published)}
                                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-50 transition-colors"
                                            title={skill.published ? 'Click để ẩn' : 'Click để hiển thị'}
                                        >
                                            {skill.published ? (
                                                <Eye className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <EyeOff className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>

                                        {/* Status Badge */}
                                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                                            skill.published
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {skill.published ? 'Đã xuất bản' : 'Ẩn'}
                                        </span>

                                        <button
                                            onClick={() => editSkill(skill)}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => deleteSkill(skill.id)}
                                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                            title="Xóa"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Help Text */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">💡</span>
                        </div>
                    </div>
                    <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">Lưu ý về Skills:</p>
                        <ul className="space-y-1 text-xs">
                            <li>• <strong>Skills đã xuất bản</strong> sẽ hiển thị trong danh sách cho mentor chọn</li>
                            <li>• <strong>Skills chưa xuất bản</strong> sẽ bị ẩn khỏi danh sách lựa chọn</li>
                            <li>• <strong>Không thể xóa skills</strong> đang được sử dụng bởi mentor (chỉ có thể ẩn)</li>
                            <li>• <strong>Tên skills nên ngắn gọn</strong> và dễ hiểu (VD: JavaScript, Leadership, Marketing)</li>
                            <li>• <strong>Mô tả skills</strong> giúp mentor hiểu rõ hơn về kỹ năng này</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorSkillsTab;