'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from "next/image";
import { signInWithEmail } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';

interface FormData {
    email: string;
    password: string;
}

export default function LoginPage() {
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const router = useRouter();
    const { setLoading } = useAuthStore();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            setError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        setIsLoading(true);
        setLoading(true);
        setError('');

        try {
            const { user, error: signInError } = await signInWithEmail(
                formData.email,
                formData.password
            );

            if (signInError) {
                setError(signInError === 'Invalid login credentials'
                    ? 'Email hoặc mật khẩu không chính xác'
                    : signInError
                );
                return;
            }

            if (user) {
                // Sau khi đăng nhập thành công
                // Redirect based on role
                if (user.role === 'admin' || user.role === 'superadmin') {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            }
        } catch (err: unknown) {
            setError('Đã xảy ra lỗi. Vui lòng thử lại.');
            if (err instanceof Error) {
                console.error('Login error:', err.message);
            } else {
                console.error('Login error:', err);
            }
        } finally {
            setIsLoading(false);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex min-h-[calc(100vh-64px)]">
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full">
                        <div className="bg-white py-8 px-8 shadow-lg rounded-xl">
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

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <div className="flex items-center">
                                        <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm text-red-700">{error}</span>
                                    </div>
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {/* Email Input */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            disabled={isLoading}
                                            className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="Nhập email của bạn"
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

                                {/* Password Input */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Mật khẩu
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            required
                                            disabled={isLoading}
                                            className="block w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="Nhập mật khẩu"
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
                                            disabled={isLoading}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
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

                                {/* Remember me & Forgot password */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            id="remember-me"
                                            name="remember-me"
                                            type="checkbox"
                                            disabled={isLoading}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors disabled:opacity-50"
                                        />
                                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                            Ghi nhớ đăng nhập
                                        </label>
                                    </div>

                                    <Link
                                        href="/auth/forgot-password"
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
                                    >
                                        Quên mật khẩu?
                                    </Link>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                            Đăng nhập
                                        </>
                                    )}
                                </button>

                                {/* Register Link */}
                                <div className="text-center pt-2">
                                    <span className="text-sm text-gray-600">
                                        Chưa có tài khoản?{' '}
                                        <Link
                                            href="/auth/register"
                                            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200 relative inline-block"
                                        >
                                            <span className="hover:scale-105 inline-block transition-transform duration-200">
                                                Đăng ký ngay
                                            </span>
                                        </Link>
                                    </span>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-6">
                            <p className="text-xs text-gray-500">
                                Bằng việc đăng nhập, bạn đồng ý với{' '}
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