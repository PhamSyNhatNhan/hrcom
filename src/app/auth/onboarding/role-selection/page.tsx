// src/app/auth/onboarding/role-selection/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ArrowRight, X, CheckCircle, Briefcase } from 'lucide-react';

export default function RoleSelectionPage() {
    const [selectedRole, setSelectedRole] = useState<'mentee' | 'mentor' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRoleSelect = (role: 'mentee' | 'mentor') => {
        setSelectedRole(role);
    };

    const handleContinue = async () => {
        if (!selectedRole) return;

        setIsLoading(true);

        try {
            // Redirect based on selected role
            if (selectedRole === 'mentee') {
                // ✅ Chuyển đến trang setup profile cho mentee
                router.push('/auth/onboarding/mentee-setup');
            } else if (selectedRole === 'mentor') {
                // ✅ CHUYỂN ĐẾN TRANG ĐIỀU KHOẢN TRƯỚC KHI ĐĂNG KÝ MENTOR
                router.push('/auth/onboarding/mentor-terms');
            }
        } catch (error) {
            console.error('Error during role selection:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            <div className="flex min-h-screen">
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-4xl w-full">
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
                                    <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-white" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                        Chào mừng bạn đến với HR Companion! 🎉
                                    </h1>
                                    <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                                        Tài khoản của bạn đã được xác thực thành công. Hãy chọn vai trò phù hợp để chúng tôi có thể cung cấp trải nghiệm tốt nhất cho bạn.
                                    </p>
                                </div>
                            </div>

                            {/* Role Selection Cards */}
                            <div className="grid md:grid-cols-2 gap-8 mb-12">
                                {/* Mentee Card */}
                                <div
                                    onClick={() => handleRoleSelect('mentee')}
                                    className={`relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                                        selectedRole === 'mentee'
                                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                                            : 'border-gray-200 bg-white hover:border-blue-300'
                                    }`}
                                >
                                    {selectedRole === 'mentee' && (
                                        <div className="absolute top-4 right-4">
                                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                            <Heart className="w-10 h-10 text-white" />
                                        </div>

                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                            Tôi muốn được hướng dẫn
                                        </h3>

                                        <p className="text-gray-600 leading-relaxed mb-6">
                                            Bạn đang tìm kiếm sự hướng dẫn, tư vấn và hỗ trợ từ các chuyên gia HR có kinh nghiệm để phát triển sự nghiệp.
                                        </p>

                                        <div className="space-y-3 text-left">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span className="text-sm text-gray-700">Nhận tư vấn CV và hồ sơ cá nhân</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span className="text-sm text-gray-700">Hướng dẫn kỹ năng phỏng vấn</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span className="text-sm text-gray-700">Định hướng phát triển sự nghiệp</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mentor Card */}
                                <div
                                    onClick={() => handleRoleSelect('mentor')}
                                    className={`relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                                        selectedRole === 'mentor'
                                            ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                                            : 'border-gray-200 bg-white hover:border-emerald-300'
                                    }`}
                                >
                                    {selectedRole === 'mentor' && (
                                        <div className="absolute top-4 right-4">
                                            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                            <Briefcase className="w-10 h-10 text-white" />
                                        </div>

                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                            Tôi muốn chia sẻ kinh nghiệm
                                        </h3>

                                        <p className="text-gray-600 leading-relaxed mb-6">
                                            Bạn có kinh nghiệm trong lĩnh vực HR và muốn hướng dẫn, chia sẻ kiến thức với những người mới bắt đầu.
                                        </p>

                                        <div className="space-y-3 text-left">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                <span className="text-sm text-gray-700">Hướng dẫn và tư vấn cho người khác</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                <span className="text-sm text-gray-700">Chia sẻ kinh nghiệm và kiến thức</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                <span className="text-sm text-gray-700">Xây dựng mạng lưới chuyên nghiệp</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <button
                                    onClick={handleContinue}
                                    disabled={!selectedRole || isLoading}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                                        selectedRole === 'mentee'
                                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                                            : selectedRole === 'mentor'
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                                                : 'bg-gray-400'
                                    }`}
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <span>
                                                {selectedRole === 'mentee' ? 'Tiếp tục với vai trò Mentee' :
                                                    selectedRole === 'mentor' ? 'Tiếp tục với vai trò Mentor' :
                                                        'Chọn vai trò để tiếp tục'}
                                            </span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleSkip}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" />
                                    Bỏ qua, về trang chủ
                                </button>
                            </div>

                            {/* Help text */}
                            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-white text-xs font-bold">!</span>
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-amber-800 font-medium mb-1">
                                            Không chắc chắn lựa chọn nào phù hợp?
                                        </p>
                                        <p className="text-amber-700 text-xs leading-relaxed">
                                            Bạn có thể bỏ qua bước này và khám phá HR Companion như một thành viên bình thường.
                                            Bạn luôn có thể thay đổi vai trò sau này trong cài đặt tài khoản.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-6">
                            <p className="text-xs text-gray-500">
                                Bằng việc tiếp tục, bạn đồng ý với{' '}
                                <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                                    Điều khoản sử dụng
                                </Link>
                                {' '}và{' '}
                                <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                                    Chính sách bảo mật
                                </Link>
                                {' '}của HR Companion
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}