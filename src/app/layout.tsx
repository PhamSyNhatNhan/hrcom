'use client'
import React, { useState, ReactNode, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Users,
    Menu,
    X,
    ArrowRight,
    Search,
    User,
    ChevronDown,
    Settings,
    LogOut,
    Linkedin,
    Zap,
    Facebook, Edit
} from 'lucide-react';
import '@/app/globals.css'
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { signOut } from "@/lib/auth";

interface LayoutProps {
    children: ReactNode;
}

const RootLayout = ({ children }: LayoutProps) => {
    const FloatingMenu = () => {
        return (
            <div className="fixed right-2 md:right-4 top-3/5 -translate-y-1/2 z-40">
                <div className="flex flex-col space-y-2">
                    {/* LinkedIn */}
                    <Link
                        href="https://www.linkedin.com/company/hr-companion-vn/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 md:w-12 md:h-12 bg-[#0077B5] text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 hover:-translate-x-1 group"
                    >
                        <Linkedin className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="absolute right-12 md:right-14 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
                            LinkedIn
                        </span>
                    </Link>

                    {/* Zalo */}
                    <Link
                        href="https://zalo.me/0979334143"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 md:w-12 md:h-12 bg-[#0068FF] text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 hover:-translate-x-1 group"
                    >
                        <Zap className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="absolute right-12 md:right-14 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
                            Zalo
                        </span>
                    </Link>

                    {/* Facebook */}
                    <Link
                        href="https://www.facebook.com/HRCompanion.vn/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 md:w-12 md:h-12 bg-[#1877F2] text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 hover:-translate-x-1 group"
                    >
                        <Facebook className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="absolute right-12 md:right-14 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
                            Facebook
                        </span>
                    </Link>

                    {/* Contact/Edit */}
                    <Link
                        href="https://www.facebook.com/groups/hrcompanion"
                        className="w-10 h-10 md:w-12 md:h-12 bg-[#FF6B35] text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 hover:-translate-x-1 group"
                    >
                        <Edit className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="absolute right-12 md:right-14 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
                            Liên hệ
                        </span>
                    </Link>
                </div>
            </div>
        );
    };

    interface HeaderProps {
        currentPage?: string;
    }

    const Header: React.FC<HeaderProps> = () => {
        const pathname = usePathname();
        const router = useRouter();
        const { user } = useAuthStore();

        // State for UI interactivity
        const [isMenuOpen, setIsMenuOpen] = useState(false);
        const [searchQuery, setSearchQuery] = useState('');
        const [isScrolled, setIsScrolled] = useState(false);
        const [lastScrollY, setLastScrollY] = useState(0);
        const [showHeader, setShowHeader] = useState(true);
        const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
        // New states for dropdown menus
        const [isMentorMenuOpen, setIsMentorMenuOpen] = useState(false);
        const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
        const [isActivityMenuOpen, setIsActivityMenuOpen] = useState(false);
        // Mobile dropdown states
        const [isMobileMentorMenuOpen, setIsMobileMentorMenuOpen] = useState(false);
        const [isMobileAdminMenuOpen, setIsMobileAdminMenuOpen] = useState(false);
        const [isMobileActivityMenuOpen, setIsMobileActivityMenuOpen] = useState(false);

        // Prevent hydration mismatch by ensuring user-specific UI renders only on the client
        const [isMounted, setIsMounted] = useState(false);
        useEffect(() => {
            setIsMounted(true);
        }, []);

        // Helper functions for styling and events
        const isActivePage = (page: string): boolean => pathname === page || pathname.startsWith(`/${page}`);

        const navLinkClass = (page: string): string =>
            `text-gray-700 hover:text-cyan-600 transition-all duration-300 ease-in-out font-medium transform hover:scale-105 ${isActivePage(page)
                ? 'text-cyan-600 font-semibold text-lg scale-105'
                : ''
            }`;

        const handleSearch = (e: React.FormEvent | React.KeyboardEvent) => {
            e.preventDefault();
            console.log('Searching for:', searchQuery);
        };

        const handleNavLinkClick = () => {
            setIsMenuOpen(false);
            setIsMentorMenuOpen(false);
            setIsAdminMenuOpen(false);
            setIsActivityMenuOpen(false);
            setIsMobileMentorMenuOpen(false);
            setIsMobileAdminMenuOpen(false);
            setIsMobileActivityMenuOpen(false);
        };

        const handleLogout = async () => {
            setIsUserMenuOpen(false);
            setIsMenuOpen(false);

            const { error } = await signOut(); // Call the central signOut function

            if (error) {
                console.error('Error signing out:', error);
            } else {
                router.push('/'); // Redirect to home page after successful logout
            }
        };

        // Effect for handling click outside the menus
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                const target = event.target as HTMLElement;
                if (!target.closest('.user-menu-container')) {
                    setIsUserMenuOpen(false);
                }
                if (!target.closest('.mentor-menu-container')) {
                    setIsMentorMenuOpen(false);
                }
                if (!target.closest('.admin-menu-container')) {
                    setIsAdminMenuOpen(false);
                }
                if (!target.closest('.activity-menu-container')) {
                    setIsActivityMenuOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        // Effect for handling scroll behavior and body overflow
        useEffect(() => {
            const handleScroll = () => {
                const currentScrollY = window.scrollY;
                setShowHeader(currentScrollY < lastScrollY || currentScrollY < 100);
                setIsScrolled(currentScrollY > 10);
                setLastScrollY(currentScrollY);
            };
            window.addEventListener('scroll', handleScroll);
            document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
            return () => {
                window.removeEventListener('scroll', handleScroll);
                document.body.style.overflow = 'unset';
            };
        }, [lastScrollY, isMenuOpen]);

        // Derived values from store state
        const isLoggedIn = !!user;
        const userName = user?.profile?.full_name || 'User';
        const userAvatar = user?.profile?.image_url;

        // Check if any mentor/admin routes are active
        const isMentorRouteActive = pathname.startsWith('/mentor_page');
        const isAdminRouteActive = pathname.startsWith('/admin');
        const isActivityRouteActive = pathname.startsWith('/mentor_booking') || pathname.startsWith('/events');

        return (
            <>
                <nav
                    className={`bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-cyan-100 transition-all duration-500 ease-in-out transform ${showHeader ? 'translate-y-0 scale-100' : '-translate-y-full scale-95'
                    } ${isScrolled ? 'bg-white/95 shadow-xl' : ''}`}
                >
                    {/* PC Layout */}
                    <div className="hidden lg:block">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-center h-16 border-b border-gray-100">
                                {/* Logo */}
                                <Link href="/" className="transform hover:scale-105 transition-transform duration-300">
                                    <div className="w-[150px] h-[40px] relative">
                                        <Image src="/HR-Comapnion-logo.png" alt="HR Companion Logo" fill className="object-contain" />
                                    </div>
                                </Link>

                                {/* Search and Auth */}
                                <div className="flex items-center space-x-4">
                                    {/* Search Bar */}
                                    <div className="relative transform hover:scale-105 transition-transform duration-300">
                                        <input type="text" placeholder="Tìm kiếm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)} className="w-64 pl-4 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white/90 text-sm transition-all duration-300" />
                                        <button onClick={handleSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-cyan-600 transition-colors duration-300">
                                            <Search className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Conditional rendering based on authentication state */}
                                    {isMounted && isLoggedIn ? (
                                        <div className="relative user-menu-container">
                                            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-xl transition-all duration-300 transform hover:scale-105">
                                                {userAvatar ? (
                                                    <Image src={userAvatar} alt={userName} width={32} height={32} className="rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                                                        <User className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-gray-700">{userName}</span>
                                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            <div className={`absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg transition-all duration-300 z-50 ${isUserMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'} transform origin-top-right`}>
                                                <button className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-t-xl border-b border-gray-100 flex items-center space-x-2 transition-colors duration-200" onClick={() => {
                                                    setIsUserMenuOpen(false);
                                                    setIsMenuOpen(false);
                                                    router.push('/user');
                                                }}><User className="w-4 h-4 text-gray-500" /><span>Tài khoản của tôi</span></button>
                                                <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-b-xl text-red-600 flex items-center space-x-2 transition-colors duration-200"><LogOut className="w-4 h-4" /><span>Đăng xuất</span></button>
                                            </div>
                                        </div>
                                    ) : isMounted ? (
                                        <div className="flex items-center space-x-3">
                                            <Link href="/auth/login"><button className="text-cyan-600 hover:text-cyan-700 font-medium text-sm transition-all duration-300 transform hover:scale-105">Đăng nhập</button></Link>
                                            <Link href="/auth/register"><button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2 rounded-xl hover:from-cyan-600 hover:to-blue-700 font-medium text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg">Đăng ký</button></Link>
                                        </div>
                                    ) : (
                                        // Placeholder to prevent layout shift during mount
                                        <div className="h-10 w-[180px]"></div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-center items-center h-12 space-x-8">
                                <Link href="/" className={navLinkClass('/')}>Trang chủ</Link>
                                <Link href="/mentor" className={navLinkClass('/mentor')}>Mentor</Link>
                                <Link href="/news" className={navLinkClass('/news')}>Tin tức & Sự kiện</Link>
                                <Link href="/blog" className={navLinkClass('/blog')}>Blog HR Companion</Link>

                                {/* Đặt lịch - only for regular users */}
                                {isMounted && (user?.role === 'user' || !user?.role) && (
                                    <div className="relative activity-menu-container">
                                        <button
                                            onClick={() => setIsActivityMenuOpen(!isActivityMenuOpen)}
                                            className={`flex items-center gap-1 ${navLinkClass('/activity')} ${
                                                isActivityRouteActive ? 'text-cyan-600 font-semibold' : ''
                                            }`}
                                        >
                                            Đặt lịch
                                            <ChevronDown
                                                className={`w-4 h-4 transition-transform duration-300 ${
                                                    isActivityMenuOpen ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </button>

                                        <div
                                            className={`absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg transition-all duration-300 z-50 ${
                                                isActivityMenuOpen
                                                    ? 'opacity-100 scale-100 translate-y-0'
                                                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                                            } transform origin-top`}
                                        >
                                            <Link
                                                href="/mentor_booking"
                                                onClick={handleNavLinkClick}
                                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl border-b border-gray-100 transition-colors duration-200"
                                            >
                                                Đặt lịch Mentor
                                            </Link>
                                            <Link
                                                href="/events"
                                                onClick={handleNavLinkClick}
                                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-b-xl transition-colors duration-200"
                                            >
                                                Sự kiện
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {/* Mentor Dropdown */}
                                {user?.role === 'mentor' && (
                                    <div className="relative mentor-menu-container">
                                        <button
                                            onClick={() => setIsMentorMenuOpen(!isMentorMenuOpen)}
                                            className={`flex items-center gap-1 ${navLinkClass('/mentor_page')} ${isMentorRouteActive ? 'text-cyan-600 font-semibold' : ''}`}
                                        >
                                            Mentor Panel
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isMentorMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <div className={`absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg transition-all duration-300 z-50 ${isMentorMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'} transform origin-top`}>
                                            <Link href="/mentor_page/booking_mentor" onClick={handleNavLinkClick} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl border-b border-gray-100 transition-colors duration-200">
                                                Lịch hẹn
                                            </Link>
                                            <Link href="/mentor_page/post_mentor" onClick={handleNavLinkClick} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-b-xl transition-colors duration-200">
                                                Đăng bài
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Dropdown */}
                                {(user?.role === 'admin' || user?.role === 'superadmin') && (
                                    <div className="relative admin-menu-container">
                                        <button
                                            onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                                            className={`flex items-center gap-1 ${navLinkClass('/admin')} ${isAdminRouteActive ? 'text-cyan-600 font-semibold' : ''}`}
                                        >
                                            Admin Panel
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <div className={`absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg transition-all duration-300 z-50 ${isAdminMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'} transform origin-top`}>
                                            <Link href="/admin/daskboard_modify" onClick={handleNavLinkClick} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl border-b border-gray-100 transition-colors duration-200">
                                                Chỉnh sửa Trang chủ
                                            </Link>
                                            <Link href="/admin/modify_mentor" onClick={handleNavLinkClick} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors duration-200">
                                                Chỉnh sửa mentor
                                            </Link>
                                            <Link href="/admin/mentor_booking_modify" onClick={handleNavLinkClick} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors duration-200">
                                                Quản lý đặt lịch
                                            </Link>
                                            <Link href="/admin/post" onClick={handleNavLinkClick} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors duration-200">
                                                Quản lý bài viết
                                            </Link>

                                            {/* Superadmin only */}
                                            {user?.role === 'superadmin' && (
                                                <Link href="/admin/modify" onClick={handleNavLinkClick} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-b-xl transition-colors duration-200">
                                                    Khác
                                                </Link>
                                            )}

                                            {/* Admin only (not superadmin) */}
                                            {user?.role === 'admin' && (
                                                <div className="px-4 py-3 text-sm text-gray-700 rounded-b-xl">
                                                    {/* This ensures proper border radius when superadmin menu is not shown */}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="lg:hidden">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-center h-16">
                                <Link href="/" className="transform hover:scale-105 transition-transform duration-300">
                                    <div className="w-[150px] h-[40px] relative"><Image src="/HR-Comapnion-logo.png" alt="HR Companion Logo" fill className="object-contain" /></div>
                                </Link>
                                <div className="flex items-center space-x-3">
                                    {isMounted && isLoggedIn && (
                                        <div className="flex items-center space-x-2 transform hover:scale-105 transition-transform duration-300">
                                            {userAvatar ? (<Image src={userAvatar} alt={userName} width={32} height={32} className="rounded-full object-cover" />) : (<div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-white" /></div>)}
                                        </div>
                                    )}
                                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 hover:text-cyan-600 transition-all duration-300 transform hover:scale-110">
                                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Mobile Menu Overlay */}
                <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-500 ease-in-out ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                    <div className={`absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-md shadow-xl border-b border-gray-200 transition-all duration-500 ease-in-out transform ${isMenuOpen ? 'translate-y-0 scale-100' : '-translate-y-full scale-95'} origin-top`}>
                        <div className="px-4 py-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
                            {/* Search */}
                            <div className="relative border-b pb-4">
                                <input type="text" placeholder="Tìm kiếm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)} className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white/90 text-sm transition-all duration-300" />
                                <button onClick={handleSearch} className="absolute right-3 top-2 text-gray-500 hover:text-cyan-600 transition-all duration-300 hover:scale-110"><Search className="w-4 h-4" /></button>
                            </div>

                            {/* Nav Links */}
                            <div className="space-y-3">
                                <Link href="/" className={`block py-2 pl-4 ${navLinkClass('/')}`} onClick={handleNavLinkClick}>Trang chủ</Link>
                                <Link href="/mentor" className={`block py-2 pl-4 ${navLinkClass('/mentor')}`} onClick={handleNavLinkClick}>Mentor</Link>
                                <Link href="/news" className={`block py-2 pl-4 ${navLinkClass('/news')}`} onClick={handleNavLinkClick}>Tin tức & Sự kiện</Link>
                                <Link href="/blog" className={`block py-2 pl-4 ${navLinkClass('/blog')}`} onClick={handleNavLinkClick}>Blog HR Companion</Link>

                                {isMounted && (user?.role === 'user' || !user?.role) && (
                                    <div>
                                        <button
                                            onClick={() => setIsMobileActivityMenuOpen(!isMobileActivityMenuOpen)}
                                            className={`flex items-center justify-between w-full py-2 pl-4 transition-colors duration-200 ${navLinkClass('/activity')} ${
                                                isActivityRouteActive ? 'text-cyan-600 font-semibold' : ''
                                            }`}
                                        >
                                            Đặt lịch
                                            <ChevronDown
                                                className={`w-4 h-4 mr-4 transition-transform duration-300 ${
                                                    isMobileActivityMenuOpen ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </button>

                                        <div
                                            className={`grid transition-all duration-300 ease-in-out ${
                                                isMobileActivityMenuOpen
                                                    ? 'grid-rows-[1fr] opacity-100'
                                                    : 'grid-rows-[0fr] opacity-0'
                                            }`}
                                        >
                                            <div className="overflow-hidden">
                                                <div className="py-1 space-y-0">
                                                    <Link
                                                        href="/mentor_booking"
                                                        className={`block py-2 pl-8 transition-all duration-200 hover:bg-gray-50 hover:pl-10 ${navLinkClass('/mentor_booking')}`}
                                                        onClick={handleNavLinkClick}
                                                    >
                                                        Đặt lịch Mentor
                                                    </Link>
                                                    <Link
                                                        href="/events"
                                                        className={`block py-2 pl-8 transition-all duration-200 hover:bg-gray-50 hover:pl-10 ${navLinkClass('/events')}`}
                                                        onClick={handleNavLinkClick}
                                                    >
                                                        Sự kiện
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Mentor Dropdown - Mobile */}
                                {user?.role === 'mentor' && (
                                    <div>
                                        <button
                                            onClick={() => setIsMobileMentorMenuOpen(!isMobileMentorMenuOpen)}
                                            className={`flex items-center justify-between w-full py-2 pl-4 transition-colors duration-200 ${navLinkClass('/mentor_page')} ${isMentorRouteActive ? 'text-cyan-600 font-semibold' : ''}`}
                                        >
                                            Mentor Panel
                                            <ChevronDown className={`w-4 h-4 mr-4 transition-transform duration-300 ${isMobileMentorMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <div className={`grid transition-all duration-300 ease-in-out ${
                                            isMobileMentorMenuOpen
                                                ? 'grid-rows-[1fr] opacity-100'
                                                : 'grid-rows-[0fr] opacity-0'
                                        }`}>
                                            <div className="overflow-hidden">
                                                <div className="py-1 space-y-0">
                                                    <Link
                                                        href="/mentor_page/booking_mentor"
                                                        className={`block py-2 pl-8 transition-all duration-200 hover:bg-gray-50 hover:pl-10 ${navLinkClass('/mentor_page/booking_mentor')}`}
                                                        onClick={handleNavLinkClick}
                                                    >
                                                        Lịch hẹn
                                                    </Link>
                                                    {/*
                                                    <Link
                                                        href="/mentor_page/post_mentor"
                                                        className={`block py-2 pl-8 transition-all duration-200 hover:bg-gray-50 hover:pl-10 ${navLinkClass('/mentor_page/post_mentor')}`}
                                                        onClick={handleNavLinkClick}
                                                    >
                                                        Đăng bài
                                                    </Link>
                                                    */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Dropdown - Mobile */}
                                {(user?.role === 'admin' || user?.role === 'superadmin') && (
                                    <div>
                                        <button
                                            onClick={() => setIsMobileAdminMenuOpen(!isMobileAdminMenuOpen)}
                                            className={`flex items-center justify-between w-full py-2 pl-4 transition-colors duration-200 ${navLinkClass('/admin')} ${isAdminRouteActive ? 'text-cyan-600 font-semibold' : ''}`}
                                        >
                                            Admin Panel
                                            <ChevronDown className={`w-4 h-4 mr-4 transition-transform duration-300 ${isMobileAdminMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <div className={`grid transition-all duration-300 ease-in-out ${
                                            isMobileAdminMenuOpen
                                                ? 'grid-rows-[1fr] opacity-100'
                                                : 'grid-rows-[0fr] opacity-0'
                                        }`}>
                                            <div className="overflow-hidden">
                                                <div className="py-1 space-y-0">
                                                    {/*
                                                    <Link
                                                        href="/admin/daskboard_modify"
                                                        className={`block py-2 pl-8 transition-all duration-200 hover:bg-gray-50 hover:pl-10 ${navLinkClass('/admin/daskboard_modify')}`}
                                                        onClick={handleNavLinkClick}
                                                    >
                                                        Chỉnh sửa Trang chủ
                                                    </Link>
                                                    <Link
                                                        href="/admin/modify_mentor"
                                                        className={`block py-2 pl-8 transition-all duration-200 hover:bg-gray-50 hover:pl-10 ${navLinkClass('/admin/modify_mentor')}`}
                                                        onClick={handleNavLinkClick}
                                                    >
                                                        Chỉnh sửa mentor
                                                    </Link>
                                                    */}
                                                    <Link
                                                        href="/admin/mentor_booking_modify"
                                                        className={`block py-2 pl-8 transition-all duration-200 hover:bg-gray-50 hover:pl-10 ${navLinkClass('/admin/mentor_booking_modify')}`}
                                                        onClick={handleNavLinkClick}
                                                    >
                                                        Quản lý đặt lịch
                                                    </Link>
                                                    {/*
                                                    <Link
                                                        href="/admin/post"
                                                        className={`block py-2 pl-8 transition-all duration-200 hover:bg-gray-50 hover:pl-10 ${navLinkClass('/admin/post')}`}
                                                        onClick={handleNavLinkClick}
                                                    >
                                                        Quản lý bài viết
                                                    </Link>
                                                    */}

                                                    {/* Superadmin only - Mobile */}
                                                    {/*
                                                    {user?.role === 'superadmin' && (
                                                        <Link
                                                            href="/admin/modify"
                                                            className={`block py-2 pl-8 transition-all duration-200 hover:bg-gray-50 hover:pl-10 ${navLinkClass('/admin/modify')}`}
                                                            onClick={handleNavLinkClick}
                                                        >
                                                            Khác
                                                        </Link>
                                                    )}
                                                    */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}


                            </div>

                            {/* Auth Section */}
                            <div className="pt-4 border-t">
                                {isMounted && !isLoggedIn ? (
                                    <div className="space-y-2">
                                        <Link href="/auth/login"><button onClick={() => setIsMenuOpen(false)} className="block w-full text-left text-cyan-600 font-medium py-2 transition-all duration-300 transform hover:scale-105">Đăng nhập</button></Link>
                                        <Link href="/auth/register"><button onClick={() => setIsMenuOpen(false)} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg">Đăng ký</button></Link>
                                    </div>
                                ) : isMounted && isLoggedIn ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3 py-2">
                                            {userAvatar ? (<Image src={userAvatar} alt={userName} width={40} height={40} className="rounded-full object-cover" />) : (<div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center"><User className="w-6 h-6 text-white" /></div>)}
                                            <div>
                                                <div className="text-sm font-medium text-gray-700">{userName}</div>
                                                <div className="text-xs text-gray-500">Thành viên</div>
                                            </div>
                                        </div>
                                        <button className="w-full text-left py-2 px-3 text-sm hover:bg-gray-50 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105" onClick={() => {
                                            setIsUserMenuOpen(false);
                                            setIsMenuOpen(false);
                                            router.push('/user');
                                        }}><User className="w-4 h-4 text-gray-500" /><span>Tài khoản của tôi</span></button>
                                        <button onClick={handleLogout} className="w-full text-left py-2 px-3 text-sm hover:bg-gray-50 rounded-lg text-red-600 flex items-center space-x-2 transition-all duration-300 transform hover:scale-105"><LogOut className="w-4 h-4" /><span>Đăng xuất</span></button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };



    const Footer = () => {
        const { user } = useAuthStore();

        return (
            <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                        {/* Về HR Companion */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-white">HR Companion</span>
                            </div>
                            <p className="text-gray-400 leading-relaxed mb-6 text-sm text-justify">
                                Doanh nghiệp xã hội - dự án cộng đồng phi lợi nhuận được vận hành bởi những người làm nhân sự tâm huyết,
                                với sứ mệnh nâng cao kỹ năng ứng tuyển và giúp ứng viên chinh phục cơ hội việc làm mơ ước.
                            </p>

                            {/* Social Media Links */}
                            <div className="flex space-x-4">
                                <Link
                                    href="https://www.linkedin.com/company/hr-companion-vn/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 bg-[#0077B5] rounded-lg flex items-center justify-center hover:bg-[#005885] transition-colors duration-300 group"
                                >
                                    <Linkedin className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                                </Link>
                                <Link
                                    href="https://www.facebook.com/HRCompanion.vn/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 bg-[#1877F2] rounded-lg flex items-center justify-center hover:bg-[#145cc4] transition-colors duration-300 group"
                                >
                                    <Facebook className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                                </Link>
                                <Link
                                    href="https://zalo.me/0979334143"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 bg-[#0068FF] rounded-lg flex items-center justify-center hover:bg-[#0052cc] transition-colors duration-300 group"
                                >
                                    <Zap className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* Dịch Vụ */}
                        <div>
                            <h3 className="text-white font-bold text-lg mb-6">Dịch Vụ</h3>
                            <ul className="space-y-4">
                                <li>
                                    <Link href="/mentor" className="hover:text-cyan-400 transition-colors duration-300 flex items-center group">
                                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-3 group-hover:bg-cyan-400"></span>
                                        Mentor & Cố vấn
                                    </Link>
                                </li>
                                {(user?.role === 'user' || !user?.role) && (
                                    <li>
                                        <Link href="/mentor_booking" className="hover:text-cyan-400 transition-colors duration-300 flex items-center group">
                                            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-3 group-hover:bg-cyan-400"></span>
                                            Đặt lịch tư vấn
                                        </Link>
                                    </li>
                                )}
                                <li>
                                    <Link href="/#activity-section" className="hover:text-cyan-400 transition-colors duration-300 flex items-center group">
                                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-3 group-hover:bg-cyan-400"></span>
                                        Hoạt động đào tạo
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/#partner-section" className="hover:text-cyan-400 transition-colors duration-300 flex items-center group">
                                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-3 group-hover:bg-cyan-400"></span>
                                        Đối tác
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Thông Tin */}
                        <div>
                            <h3 className="text-white font-bold text-lg mb-6">Thông Tin</h3>
                            <ul className="space-y-4">
                                <li>
                                    <Link href="/news" className="hover:text-cyan-400 transition-colors duration-300 flex items-center group">
                                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-3 group-hover:bg-cyan-400"></span>
                                        Tin tức & Sự kiện
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/blog" className="hover:text-cyan-400 transition-colors duration-300 flex items-center group">
                                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-3 group-hover:bg-cyan-400"></span>
                                        Blog HR Companion
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Kết Nối */}
                        <div>
                            <h3 className="text-white font-bold text-lg mb-6">Kết Nối</h3>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center mt-0.5">
                                        <span className="w-2 h-2 bg-white rounded-full"></span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Email hỗ trợ</p>
                                        <Link
                                            href="mailto:hrcompanion.vn@gmail.com"
                                            className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                                        >
                                            hrcompanion.vn@gmail.com
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center mt-0.5">
                                        <span className="w-2 h-2 bg-white rounded-full"></span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Zalo hỗ trợ</p>
                                        <Link
                                            href="https://zalo.me/0979334143"
                                            target="_blank"
                                            className="text-cyan-400 hover:text-cyan-300 transition-colors"
                                        >
                                            0979.334.143
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center mt-0.5">
                                        <span className="w-2 h-2 bg-white rounded-full"></span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Facebook Community</p>
                                        <Link
                                            href="https://www.facebook.com/groups/hrcompanion"
                                            target="_blank"
                                            className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                                        >
                                            HR Companion Community
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="pt-8 border-t border-gray-800">
                        <div className="text-center">
                            <p className="text-gray-400 text-sm">
                                &copy; 2025 HR Companion - Doanh nghiệp xã hội vì cộng đồng.
                                <span className="block md:inline md:ml-2">Được vận hành bởi NhanSangThanh.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        );
    };

    return (
        <html lang="vi">
        <body className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50">
        <Header />
        <FloatingMenu />
        <main>{children}</main>
        <Footer />
        </body>
        </html>
    );
};

export default RootLayout;