'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface RegisterFormData {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    gender: string;
    birthDate: string;
}

export default function RegisterPage() {
    const [formData, setFormData] = useState<RegisterFormData>({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: '',
        birthDate: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('Mật khẩu xác nhận không khớp!');
            return;
        }
        console.log('Register submitted:', formData);
        // Gọi API Supabase hoặc xử lý tạo tài khoản tại đây
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            <div className="flex min-h-screen">
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-md w-full">
                        <div className="bg-white/80 backdrop-blur-sm py-8 px-8 shadow-2xl rounded-2xl border border-white/20">
                            {/* Logo và Header */}
                            <div className="text-center mb-8">
                                <div className="flex justify-center mb-6">
                                    <Image
                                        src="/HR-Comapnion-logo.png"
                                        alt="Logo"
                                        width={160}
                                        height={50}
                                        className="h-auto w-auto"
                                    />
                                </div>
                            </div>

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                {/* Họ và tên */}
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Họ và tên *
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="fullName"
                                            type="text"
                                            name="fullName"
                                            autoComplete="name"
                                            required
                                            className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                                            placeholder="Nhập họ và tên của bạn"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email *
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            required
                                            className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                                            placeholder="example@company.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Mật khẩu */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Mật khẩu *
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            required
                                            className="block w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                                            placeholder="Tối thiểu 8 ký tự"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Xác nhận mật khẩu */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Xác nhận mật khẩu *
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            required
                                            className="block w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                                            placeholder="Nhập lại mật khẩu"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Row cho Giới tính và Ngày sinh */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Giới tính */}
                                    <div>
                                        <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Giới tính *
                                        </label>
                                        <select
                                            id="gender"
                                            name="gender"
                                            required
                                            className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                                            value={formData.gender}
                                            onChange={handleChange}
                                        >
                                            <option value="">Chọn</option>
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                            <option value="other">Khác</option>
                                        </select>
                                    </div>

                                    {/* Ngày sinh */}
                                    <div>
                                        <label htmlFor="birthDate" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Ngày sinh *
                                        </label>
                                        <input
                                            id="birthDate"
                                            type="date"
                                            name="birthDate"
                                            required
                                            className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                                            value={formData.birthDate}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Tạo tài khoản
                                </button>

                                {/* Login Link */}
                                <div className="text-center pt-2">
                                    <span className="text-sm text-gray-600">
                                        Đã có tài khoản?{' '}
                                        <Link
                                            href="/auth/login"
                                            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200 relative inline-block"
                                        >
                                            <span className="hover:scale-105 inline-block transition-transform duration-200">
                                                Đăng nhập ngay
                                            </span>
                                        </Link>
                                    </span>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-6">
                            <p className="text-xs text-gray-500">
                                Bằng việc đăng ký, bạn đồng ý với{' '}
                                <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                                    Điều khoản sử dụng
                                </Link>
                                {' '}và{' '}
                                <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                                    Chính sách bảo mật
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}