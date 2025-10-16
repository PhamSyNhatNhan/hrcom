'use client';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { SectionHeader } from '@/component/SectionHeader';
import { supabase } from '@/utils/supabase/client';

import {
    Users,
    FileCheck,
    Award,
    X,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

// Import types
import type {
    AdminMentorTabType,
    MentorSkill,
    MentorRegistration
} from '@/types/mentor_admin';

// Import components
import MentorListTab from '@/component/admin/mentor/MentorListTab';
import MentorRegistrationsTab from '@/component/admin/mentor/MentorRegistrationsTab';
import MentorSkillsTab from '@/component/admin/mentor/MentorSkillsTab';

const AdminMentorManager: React.FC = () => {
    const { user } = useAuthStore();

    // State management
    const [activeTab, setActiveTab] = useState<AdminMentorTabType>('mentors');
    const [loading, setLoading] = useState(false);

    // Skills state
    const [skills, setSkills] = useState<MentorSkill[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(false);

    // Registrations state
    const [registrations, setRegistrations] = useState<MentorRegistration[]>([]);
    const [loadingRegistrations, setLoadingRegistrations] = useState(false);

    // Notification state
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
    } | null>(null);

    // Show notification function
    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // Load skills using RPC
    const loadSkills = async () => {
        try {
            setLoadingSkills(true);
            const { data, error } = await supabase
                .rpc('mentor_admin_get_skills', { published_only: false });

            if (error) throw error;
            setSkills(data || []);
        } catch (error) {
            console.error('Error loading skills:', error);
            showNotification('error', 'Không thể tải danh sách skills');
        } finally {
            setLoadingSkills(false);
        }
    };

    // Load registrations using RPC
    const loadRegistrations = async () => {
        try {
            setLoadingRegistrations(true);
            const { data, error } = await supabase
                .rpc('mentor_admin_get_registrations', { status_filter: null });

            if (error) throw error;

            // Parse profile_info JSONB to proper structure
            const parsedRegistrations: MentorRegistration[] = (data || []).map((reg: any) => ({
                ...reg,
                profiles: reg.profile_info || null
            }));

            setRegistrations(parsedRegistrations);
        } catch (error) {
            console.error('Error loading registrations:', error);
            showNotification('error', 'Không thể tải danh sách đăng ký');
        } finally {
            setLoadingRegistrations(false);
        }
    };

    // Effects
    useEffect(() => {
        if (activeTab === 'skills') {
            loadSkills();
        } else if (activeTab === 'registrations') {
            loadRegistrations();
        }
    }, [activeTab]);

    // Check permissions
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Không có quyền truy cập</h2>
                    <p className="text-gray-600">Bạn cần quyền admin để truy cập trang này.</p>
                </div>
            </div>
        );
    }

    // Get available tabs
    const getAvailableTabs = () => {
        return [
            {
                id: 'mentors' as AdminMentorTabType,
                label: 'Quản lý Mentor',
                icon: <Users className="w-4 h-4" />
            },
            {
                id: 'registrations' as AdminMentorTabType,
                label: 'Duyệt đăng ký',
                icon: <FileCheck className="w-4 h-4" />
            },
            {
                id: 'skills' as AdminMentorTabType,
                label: 'Quản lý Skills',
                icon: <Award className="w-4 h-4" />
            }
        ];
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            {/* Notification */}
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
                <SectionHeader
                    title="QUẢN LÝ MENTOR"
                    subtitle="Tổng quan quản lý mentor, đăng ký và skills"
                />

                {/* Tabs */}
                <div className="mb-8 bg-white rounded-xl shadow-sm">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            {getAvailableTabs().map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
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
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 lg:p-8">
                        {/* Mentor List Tab */}
                        {activeTab === 'mentors' && (
                            <MentorListTab
                                loading={loading}
                                setLoading={setLoading}
                                showNotification={showNotification}
                            />
                        )}

                        {/* Registrations Tab */}
                        {activeTab === 'registrations' && (
                            <MentorRegistrationsTab
                                registrations={registrations}
                                setRegistrations={setRegistrations}
                                loading={loadingRegistrations}
                                onReload={loadRegistrations}
                                showNotification={showNotification}
                            />
                        )}

                        {/* Skills Tab */}
                        {activeTab === 'skills' && (
                            <MentorSkillsTab
                                skills={skills}
                                setSkills={setSkills}
                                loading={loadingSkills}
                                onReload={loadSkills}
                                showNotification={showNotification}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMentorManager;