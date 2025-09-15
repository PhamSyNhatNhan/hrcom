'use client';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { SectionHeader } from '@/component/SectionHeader';
import { supabase } from '@/utils/supabase/client';

import {
    Users,
    FileCheck,
    Award
} from 'lucide-react';

// Import components
import MentorListTab from '@/component/admin/mentor/MentorListTab';
import MentorRegistrationsTab from '@/component/admin/mentor/MentorRegistrationsTab';
import MentorSkillsTab from '@/component/admin/mentor/MentorSkillsTab';

export type AdminMentorTabType = 'mentors' | 'registrations' | 'skills';

interface MentorSkill {
    id: string;
    name: string;
    description?: string;
    published: boolean;
    created_at: string;
    updated_at: string;
}

interface MentorRegistration {
    id: string;
    user_id: string;
    email: string;
    phone?: string;
    notes?: string;
    admin_notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    profiles?: {
        full_name: string;
        image_url?: string;
    };
}

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

    // Load skills
    const loadSkills = async () => {
        try {
            setLoadingSkills(true);
            const { data, error } = await supabase
                .from('mentor_skills')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setSkills(data || []);
        } catch (error) {
            console.error('Error loading skills:', error);
        } finally {
            setLoadingSkills(false);
        }
    };

    // Load registrations
    const loadRegistrations = async () => {
        try {
            setLoadingRegistrations(true);
            const { data, error } = await supabase
                .from('mentor_registrations')
                .select(`
                    *,
                    profiles (
                        full_name,
                        image_url
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRegistrations(data || []);
        } catch (error) {
            console.error('Error loading registrations:', error);
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

    // Get available tabs - SAME STYLE AS DASHBOARD
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
            <div className="max-w-7xl mx-auto">
                <SectionHeader
                    title="QUẢN LÝ MENTOR"
                    subtitle="Tổng quan quản lý mentor, đăng ký và skills"
                />

                {/* Tabs - SAME STYLE AS DASHBOARD */}
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
                    <div className="p-6 lg:p-8">{/* Mentor List Tab */}
                        {activeTab === 'mentors' && (
                            <MentorListTab
                                loading={loading}
                                setLoading={setLoading}
                            />
                        )}

                        {/* Registrations Tab */}
                        {activeTab === 'registrations' && (
                            <MentorRegistrationsTab
                                registrations={registrations}
                                setRegistrations={setRegistrations}
                                loading={loadingRegistrations}
                                onReload={loadRegistrations}
                            />
                        )}

                        {/* Skills Tab */}
                        {activeTab === 'skills' && (
                            <MentorSkillsTab
                                skills={skills}
                                setSkills={setSkills}
                                loading={loadingSkills}
                                onReload={loadSkills}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMentorManager;