'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    Briefcase,
    FileText,
    ArrowRight,
    X,
    Check,
    Heart,
    Phone,
    Mail,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/authStore';

interface FormData {
    email: string;
    phone: string;
    notes: string;
}

export default function MentorSetupPage() {
    const [formData, setFormData] = useState<FormData>({
        email: '',
        phone: '',
        notes: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const router = useRouter();
    const { user } = useAuthStore();

    // Auto-fill email from user profile
    useEffect(() => {
        if (user?.email) {
            setFormData(prev => ({ ...prev, email: user.email }));
        }
    }, [user]);

    // Check for existing registrations (for display purposes)
    const [existingRegistrations, setExistingRegistrations] = useState<any[]>([]);

    useEffect(() => {
        const loadExistingRegistrations = async () => {
            if (!user?.id) return;

            try {
                const { data, error } = await supabase
                    .from('mentor_registrations')
                    .select('id, status, created_at, admin_notes')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (data && !error) {
                    setExistingRegistrations(data);
                }
            } catch (err) {
                console.log('Error loading existing registrations:', err);
            }
        };

        loadExistingRegistrations();
    }, [user]);

    const getStatusLabel = (status: string): string => {
        switch (status) {
            case 'pending':
                return 'Đang chờ duyệt';
            case 'approved':
                return 'Đã được phê duyệt';
            case 'rejected':
                return 'Bị từ chối';
            default:
                return status;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!user) {
            setError('Không tìm thấy thông tin người dùng');
            return;
        }

        // Validation
        if (!formData.email.trim()) {
            setError('Vui lòng nhập địa chỉ email');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Địa chỉ email không hợp lệ');
            return;
        }

        if (!formData.phone.trim()) {
            setError('Vui lòng nhập số điện thoại');
            return;
        }

        if (!/^[0-9+\-\s()]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
            setError('Số điện thoại không hợp lệ');
            return;
        }

        if (!formData.notes.trim()) {
            setError('Vui lòng chia sẻ thông tin về bản thân');
            return;
        }

        if (formData.notes.trim().length < 50) {
            setError('Vui lòng chia sẻ ít nhất 50 ký tự về bản thân');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Insert mentor registration
            const { error: insertError } = await supabase
                .from('mentor_registrations')
                .insert({
                    user_id: user.id,
                    email: formData.email.trim(),
                    phone: formData.phone.trim(),
                    notes: formData.notes.trim(),
                    status: 'pending'
                });

            if (insertError) {
                console.error('Error creating mentor registration:', insertError);
                setError('Không thể gửi đăng ký. Vui lòng thử lại.');
                return;
            }

            console.log('✅ Mentor registration submitted successfully');

            setIsSubmitted(true);
            setSuccessMessage('Đăng ký mentor thành công! Chúng tôi sẽ xem xét và phản hồi trong 3-5 ngày làm việc.');

            // Reload existing registrations
            const { data: updatedRegistrations } = await supabase
                .from('mentor_registrations')
                .select('id, status, created_at, admin_notes')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (updatedRegistrations) {
                setExistingRegistrations(updatedRegistrations);
            }

            // Clear form
            setFormData({
                email: user.email || '',
                phone: '',
                notes: ''
            });

            // Redirect after 3 seconds
            setTimeout(() => {
                router.push('/?welcome=mentor-registered');
            }, 3000);

        } catch (err) {
            console.error('Error in mentor registration:', err);
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        router.push('/');
    };

    const handleBackToRoleSelection = () => {
        router.push('/auth/onboarding/role-selection');
    };

    // Success state
    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
                <div className="flex min-h-screen">
                    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                        <div className="max-w-2xl w-full">
                            <div className="bg-white/80 backdrop-blur-sm py-12 px-8 shadow-2xl rounded-2xl border border-white/20 text-center">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <div className="flex justify-center mb-8">
                                        <Image
                                            src="/HR-Comapnion-logo.png"
                                            alt="Logo"
                                            width={200}
                                            height={60}
                                            className="h-auto w-auto"
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-white" />
                                        </div>
                                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                            Đăng ký thành công!
                                        </h1>
                                        <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
                                            {successMessage}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl">
                                        <h3 className="font-semibold text-emerald-800 mb-2">Các bước tiếp theo:</h3>
                                        <ul className="text-sm text-emerald-700 text-left space-y-1">
                                            <li>• Chúng tôi sẽ xem xét hồ sơ của bạn</li>
                                            <li>• Có thể liên hệ để phỏng vấn hoặc yêu cầu thêm thông tin</li>
                                            <li>• Thông báo kết quả qua email trong 3-5 ngày làm việc</li>
                                            <li>• Nếu được chấp nhận, bạn sẽ được hướng dẫn thiết lập profile mentor</li>
                                        </ul>
                                    </div>

                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                                    >
                                        <Heart className="w-5 h-5" />
                                        Về trang chủ
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            <div className="flex min-h-screen">
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-2xl w-full">
                        <div className="bg-white/80 backdrop-blur-sm py-12 px-8 shadow-2xl rounded-2xl border border-white/20">
                            {/* Header */}
                            <div className="text-center mb-12">
                                <div className="flex justify-center mb-8">
                                    <Image
                                        src="/HR-Comapnion-logo.png"
                                        alt="Logo"
                                        width={200}
                                        height={60}
                                        className="h-auto w-auto"
                                    />
                                </div>

                                <div className="mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Briefcase className="w-8 h-8 text-white" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                        Đăng ký trở thành Mentor
                                    </h1>
                                    <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
                                        Chia sẻ kinh nghiệm và hướng dẫn những người mới bắt đầu trong lĩnh vực HR.
                                        Hãy cung cấp thông tin để chúng tôi có thể đánh giá hồ sơ của bạn.
                                    </p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <div className="flex items-center">
                                        <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                                        <span className="text-sm text-red-700">{error}</span>
                                    </div>
                                </div>
                            )}

                            <form className="space-y-8" onSubmit={handleSubmit}>
                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        <Mail className="w-4 h-4 inline mr-2" />
                                        Email liên hệ *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        disabled={isLoading}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Chúng tôi sẽ sử dụng email này để liên hệ về việc đăng ký mentor
                                    </p>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        <Phone className="w-4 h-4 inline mr-2" />
                                        Số điện thoại *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        disabled={isLoading}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="0901234567"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Số điện thoại để chúng tôi có thể liên hệ trực tiếp khi cần thiết
                                    </p>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        <FileText className="w-4 h-4 inline mr-2" />
                                        Thông tin khác
                                    </label>
                                    <textarea
                                        name="notes"
                                        disabled={isLoading}
                                        rows={6}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder={`Có thể bao gồm:
    • Giới thiệu về bản thân và kinh nghiệm
    • Thông tin liên hệ khác (LinkedIn, Facebook, etc.)
    • Lý do muốn trở thành mentor
    • Thời gian có thể dành cho mentoring
    • Ghi chú hoặc thông tin khác...`}
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        maxLength={1000}
                                    />
                                    <div className="mt-2 flex justify-between items-center">
                                        <p className="text-xs text-gray-500">
                                            Không bắt buộc - có thể bao gồm giới thiệu, thông tin liên hệ hoặc ghi chú
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formData.notes.length}/1000 ký tự
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-4 justify-center items-center pt-6">
                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Đang gửi đăng ký...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Gửi đăng ký mentor
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>

                                    {/* Secondary Actions */}
                                    <div className="flex flex-col sm:flex-row gap-3 text-center">
                                        <button
                                            type="button"
                                            onClick={handleSkip}
                                            disabled={isLoading}
                                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 disabled:opacity-50 text-sm"
                                        >
                                            <X className="w-4 h-4" />
                                            Để sau, về trang chủ
                                        </button>

                                        <span className="text-gray-400 hidden sm:block">•</span>

                                        <button
                                            type="button"
                                            onClick={handleBackToRoleSelection}
                                            disabled={isLoading}
                                            className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200 disabled:opacity-50 text-sm"
                                        >
                                            ← Quay về chọn vai trò
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Existing Registrations */}
                            {existingRegistrations.length > 0 && (
                                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Lịch sử đăng ký mentor
                                    </h3>
                                    <div className="space-y-3">
                                        {existingRegistrations.map((registration, index) => (
                                            <div key={registration.id} className="bg-white p-3 rounded-lg border border-blue-200">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                                            registration.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : registration.status === 'approved'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {getStatusLabel(registration.status)}
                                                        </span>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Đăng ký ngày: {new Date(registration.created_at).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                                {registration.admin_notes && (
                                                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                                                        <strong>Ghi chú từ admin:</strong> {registration.admin_notes}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Info box */}
                            <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-white text-xs font-bold">ℹ</span>
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-emerald-700 text-xs leading-relaxed">
                                            Chúng tôi sẽ phản hồi qua email trong 3-5 ngày làm việc.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-6">
                            <p className="text-xs text-gray-500">
                                Bằng việc đăng ký, bạn đồng ý chia sẻ kiến thức và kinh nghiệm để hỗ trợ cộng đồng HR Companion
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}