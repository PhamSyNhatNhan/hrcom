'use client'
import React, {useState, ReactNode, useEffect} from 'react';
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
import {usePathname} from "next/navigation";

interface LayoutProps {
    children: ReactNode;
}

const RootLayout = ({ children }: LayoutProps) => {
    interface HeaderProps {
        currentPage?: string;
        user?: {
            name: string;
            avatar?: string;
        } | null;
    }

    const FloatingMenu = () => {
        return (
            <div className="fixed right-2 md:right-4 top-1/2 -translate-y-1/2 z-40">
                <div className="flex flex-col space-y-2">
                    {/* LinkedIn */}
                    <a
                        href="https://www.linkedin.com/company/hr-companion-vn/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 md:w-12 md:h-12 bg-[#0077B5] text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 hover:-translate-x-1 group"
                    >
                        <Linkedin className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="absolute right-12 md:right-14 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
                        LinkedIn
                    </span>
                    </a>

                    {/* Zalo */}
                    <a
                        href="https://zalo.me/0979334143"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 md:w-12 md:h-12 bg-[#0068FF] text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 hover:-translate-x-1 group"
                    >
                        <Zap className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="absolute right-12 md:right-14 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
                        Zalo
                    </span>
                    </a>

                    {/* Facebook */}
                    <a
                        href="https://www.facebook.com/HRCompanion.vn/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 md:w-12 md:h-12 bg-[#1877F2] text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 hover:-translate-x-1 group"
                    >
                        <Facebook className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="absolute right-12 md:right-14 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
                        Facebook
                    </span>
                    </a>

                    {/* Contact/Edit */}
                    <a
                        href="https://www.facebook.com/groups/hrcompanion"
                        className="w-10 h-10 md:w-12 md:h-12 bg-[#FF6B35] text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 hover:-translate-x-1 group"
                    >
                        <Edit className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="absolute right-12 md:right-14 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
                        Liên hệ
                    </span>
                    </a>
                </div>
            </div>
        );
    };

    const Header: React.FC<HeaderProps> = ({ user = null }) => {
        const pathname = usePathname();
        const [isMenuOpen, setIsMenuOpen] = useState(false);
        const [searchQuery, setSearchQuery] = useState('');
        const [isScrolled, setIsScrolled] = useState(false);
        const [lastScrollY, setLastScrollY] = useState(0);
        const [showHeader, setShowHeader] = useState(true);
        const [isLoggedIn, setIsLoggedIn] = useState(false);
        const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

        const demoUser = user ?? {
            name: 'Nguyễn Văn A',
            avatar: null,
        };

        const isActivePage = (page: string): boolean => pathname === page || pathname === `/${page}`;

        const navLinkClass = (page: string): string =>
            `text-gray-700 hover:text-cyan-600 transition-all duration-300 ease-in-out font-medium transform hover:scale-105 ${
                isActivePage(page)
                    ? 'text-cyan-600 font-semibold text-lg scale-105'
                    : ''
            }`;

        const handleSearch = (e: React.FormEvent | React.KeyboardEvent) => {
            e.preventDefault();
            console.log('Searching for:', searchQuery);
        };

        const handleNavLinkClick = () => {
            setIsMenuOpen(false);
        };

        // Handle click outside for user menu
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                const target = event.target as HTMLElement;
                if (!target.closest('.user-menu-container')) {
                    setIsUserMenuOpen(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

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

        return (
            <>
                <nav
                    className={`bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-cyan-100 transition-all duration-500 ease-in-out transform ${
                        showHeader ? 'translate-y-0 scale-100' : '-translate-y-full scale-95'
                    } ${isScrolled ? 'bg-white/95 shadow-xl' : ''}`}
                >
                    {/* PC Layout */}
                    <div className="hidden lg:block">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-center h-16 border-b border-gray-100">
                                <Link href="/" className="transform hover:scale-105 transition-transform duration-300">
                                    <div className="w-[150px] h-[40px] relative">
                                        <Image
                                            src="/HR-Comapnion-logo.png"
                                            alt="HR Companion Logo"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </Link>

                                <div className="flex items-center space-x-4">
                                    <div className="relative transform hover:scale-105 transition-transform duration-300">
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                            className="w-64 pl-4 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white/90 text-sm transition-all duration-300"
                                        />
                                        <button
                                            onClick={handleSearch}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-cyan-600 transition-colors duration-300"
                                        >
                                            <Search className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {isLoggedIn ? (
                                        <div className="relative user-menu-container">
                                            <button
                                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-xl transition-all duration-300 transform hover:scale-105"
                                            >
                                                {demoUser.avatar ? (
                                                    <Image
                                                        src={demoUser.avatar}
                                                        alt={demoUser.name}
                                                        width={32}
                                                        height={32}
                                                        className="rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                                                        <User className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-gray-700">{demoUser.name}</span>
                                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            <div className={`absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg transition-all duration-300 z-50 ${
                                                isUserMenuOpen
                                                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                                                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                                            } transform origin-top-right`}>
                                                <button className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-t-xl border-b border-gray-100 flex items-center space-x-2 transition-colors duration-200">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                    <span>Tài khoản của tôi</span>
                                                </button>
                                                <button className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 flex items-center space-x-2 transition-colors duration-200">
                                                    <Settings className="w-4 h-4 text-gray-500" />
                                                    <span>Cài đặt</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsLoggedIn(false);
                                                        setIsUserMenuOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-b-xl text-red-600 flex items-center space-x-2 transition-colors duration-200"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span>Đăng xuất</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => setIsLoggedIn(true)}
                                                className="text-cyan-600 hover:text-cyan-700 font-medium text-sm transition-all duration-300 transform hover:scale-105"
                                            >
                                                Đăng nhập
                                            </button>
                                            <button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2 rounded-xl hover:from-cyan-600 hover:to-blue-700 font-medium text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                                                Đăng ký
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-center items-center h-12 space-x-8">
                                <Link href="/" className={navLinkClass('/')}>Trang chủ</Link>
                                <Link href="/mentor" className={navLinkClass('/mentor')}>Mentor</Link>
                                <Link href="/activity" className={navLinkClass('/activity')}>Hoạt động</Link>
                                <Link href="/partner" className={navLinkClass('/partner')}>Đối tác</Link>
                                <Link href="/news" className={navLinkClass('/news')}>Tin tức & Sự kiện</Link>
                                <Link href="/blog" className={navLinkClass('/blog')}>Blog HR Companion</Link>
                                <Link href="/contact" className={navLinkClass('/contact')}>Liên hệ</Link>
                                <Link href="/about" className={navLinkClass('/about')}>Về chúng tôi</Link>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="lg:hidden">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-center h-16">
                                <Link href="/" className="transform hover:scale-105 transition-transform duration-300">
                                    <div className="w-[150px] h-[40px] relative">
                                        <Image
                                            src="/HR-Comapnion-logo.png"
                                            alt="HR Companion Logo"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </Link>
                                <div className="flex items-center space-x-3">
                                    {isLoggedIn && (
                                        <div className="flex items-center space-x-2 transform hover:scale-105 transition-transform duration-300">
                                            {demoUser.avatar ? (
                                                <Image
                                                    src={demoUser.avatar}
                                                    alt={demoUser.name}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className="text-gray-700 hover:text-cyan-600 transition-all duration-300 transform hover:scale-110"
                                    >
                                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Mobile Menu Overlay */}
                <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-500 ease-in-out ${
                    isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}>
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                    <div className={`absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-md shadow-xl border-b border-gray-200 transition-all duration-500 ease-in-out transform ${
                        isMenuOpen ? 'translate-y-0 scale-100' : '-translate-y-full scale-95'
                    } origin-top`}>
                        <div className="px-4 py-4 space-y-4">
                            <div className="relative border-b pb-4">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white/90 text-sm transition-all duration-300"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-3 top-2 text-gray-500 hover:text-cyan-600 transition-all duration-300 hover:scale-110"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <Link href="/" className={`block py-2 pl-4 ${navLinkClass('/')}`} onClick={handleNavLinkClick}>Trang chủ</Link>
                                <Link href="/mentor" className={`block py-2 pl-4 ${navLinkClass('/mentor')}`} onClick={handleNavLinkClick}>Mentor</Link>
                                <Link href="/activity" className={`block py-2 pl-4 ${navLinkClass('/activity')}`} onClick={handleNavLinkClick}>Hoạt động</Link>
                                <Link href="/partner" className={`block py-2 pl-4 ${navLinkClass('/partner')}`} onClick={handleNavLinkClick}>Đối tác</Link>
                                <Link href="/news" className={`block py-2 pl-4 ${navLinkClass('/news')}`} onClick={handleNavLinkClick}>Tin tức & Sự kiện</Link>
                                <Link href="/blog" className={`block py-2 pl-4 ${navLinkClass('/blog')}`} onClick={handleNavLinkClick}>Blog HR Companion</Link>
                                <Link href="/contact" className={`block py-2 pl-4 ${navLinkClass('/contact')}`} onClick={handleNavLinkClick}>Liên hệ</Link>
                                <Link href="/about" className={`block py-2 pl-4 ${navLinkClass('/about')}`} onClick={handleNavLinkClick}>Về chúng tôi</Link>
                            </div>

                            <div className="pt-4 border-t">
                                {!isLoggedIn ? (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => {
                                                setIsLoggedIn(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="block w-full text-left text-cyan-600 font-medium py-2 transition-all duration-300 transform hover:scale-105"
                                        >
                                            Đăng nhập
                                        </button>
                                        <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                                            Đăng ký
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3 py-2 transition-all duration-300 transform hover:scale-105">
                                            {demoUser.avatar ? (
                                                <Image
                                                    src={demoUser.avatar}
                                                    alt={demoUser.name}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                                                    <User className="w-6 h-6 text-white" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-gray-700">{demoUser.name}</div>
                                                <div className="text-xs text-gray-500">Thành viên</div>
                                            </div>
                                        </div>
                                        <button className="w-full text-left py-2 px-3 text-sm hover:bg-gray-50 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105">
                                            <User className="w-4 h-4 text-gray-500" />
                                            <span>Tài khoản của tôi</span>
                                        </button>
                                        <button className="w-full text-left py-2 px-3 text-sm hover:bg-gray-50 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105">
                                            <Settings className="w-4 h-4 text-gray-500" />
                                            <span>Cài đặt</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsLoggedIn(false);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left py-2 px-3 text-sm hover:bg-gray-50 rounded-lg text-red-600 flex items-center space-x-2 transition-all duration-300 transform hover:scale-105"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                    {!isLoggedIn && (
                        <button
                            onClick={() => setIsLoggedIn(true)}
                            className="fixed bottom-4 right-4 z-[60] bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300 text-sm transform hover:scale-110 hover:shadow-xl"
                        >
                            Đăng nhập nhanh
                        </button>
                    )}
            </>
        );
    };



    const Footer = () => (
        <footer className="bg-gray-900 text-gray-300 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <Link href="/about">
                        <div>
                            <div className="flex items-center space-x-2 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-white">HR Companion</span>
                            </div>
                            <p className="text-gray-400 leading-relaxed mb-6">
                                Được triển khai từ năm 2021, The HR Companion là dự án cộng đồng phi lợi nhận được vận hành bởi những người làm nhân sự tâm huyết, tận tụy với sứ mệnh giúp đỡ tất cả mọi người cải thiện, sửa các lỗi thường gặp khi viết...
                            </p>
                        </div>
                    </Link>

                    <div>
                        <h3 className="text-white font-bold mb-4">Dịch Vụ</h3>
                        <ul className="space-y-3">
                            <li><Link href="/mentor" className="hover:text-cyan-400 transition-colors">Mentor</Link></li>
                            <li><Link href="/activity" className="hover:text-cyan-400 transition-colors">Hoạt động</Link></li>
                            <li><Link href="/partner" className="hover:text-cyan-400 transition-colors">Đối tác</Link></li>
                            <li><Link href="/blog" className="hover:text-cyan-400 transition-colors">Blog HR Companion</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-4">Hỗ Trợ</h3>
                        <ul className="space-y-3">
                            <li><Link href="/contact" className="hover:text-cyan-400 transition-colors">Liên hệ</Link></li>
                            <li><Link href="/about" className="hover:text-cyan-400 transition-colors">Về chúng tôi</Link></li>
                            <li><Link href="/news" className="hover:text-cyan-400 transition-colors">Tin tức & Sự kiện</Link></li>
                            <li><Link href="/terms" className="hover:text-cyan-400 transition-colors">Điều Khoản</Link></li>
                            <li><Link href="/privacy" className="hover:text-cyan-400 transition-colors">Bảo Mật</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-4">Theo Dõi</h3>
                        <p className="text-gray-400 mb-4">Nhận thông tin mới nhất từ HR Companion</p>
                        <div className="flex space-x-2">
                            <input
                                type="email"
                                placeholder="Email của bạn"
                                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                            />
                            <button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300">
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                    <p>&copy; 2025 HR Companion. Tất cả quyền được bảo lưu.</p>
                </div>
            </div>
        </footer>
    );

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
