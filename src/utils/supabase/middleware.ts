import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    console.log('🔥 MIDDLEWARE RUNNING:', request.nextUrl.pathname)

    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const pathname = request.nextUrl.pathname
    const isAuthRoute = pathname.startsWith('/auth')
    const isAdminRoute = pathname.startsWith('/admin')
    const isHomePage = pathname === '/'

    console.log('Middleware check:', {
        pathname,
        isAuthRoute,
        isAdminRoute,
        isHomePage
    })

    try {
        // Lấy user
        const {
            data: { user },
            error
        } = await supabase.auth.getUser()

        console.log('User check:', { hasUser: !!user, error: !!error })

        // Nếu chưa đăng nhập
        if (!user || error) {
            console.log('No user found')

            // Cho phép truy cập auth routes
            if (isAuthRoute) {
                console.log('✅ Allowing auth route')
                return supabaseResponse
            }

            // Chặn admin routes
            if (isAdminRoute) {
                console.log('❌ Blocking admin route - redirecting to login')
                const url = request.nextUrl.clone()
                url.pathname = '/auth/login'
                url.searchParams.set('redirectTo', pathname)
                return NextResponse.redirect(url)
            }

            // Cho phép các route khác
            console.log('✅ Allowing public route')
            return supabaseResponse
        }

        // Đã đăng nhập
        const userRole = user.user_metadata?.role || 'user'
        console.log('User logged in:', { email: user.email, role: userRole })

        // Redirect từ auth routes (trừ logout)
        if (isAuthRoute && !pathname.startsWith('/auth/logout')) {
            console.log('Redirecting logged in user from auth route')
            const url = request.nextUrl.clone()
            if (userRole === 'admin' || userRole === 'superadmin') {
                url.pathname = '/admin'
            } else {
                url.pathname = '/'
            }
            return NextResponse.redirect(url)
        }

        // Kiểm tra quyền admin
        if (isAdminRoute) {
            if (userRole !== 'admin' && userRole !== 'superadmin') {
                console.log('❌ User not admin - redirecting to home')
                const url = request.nextUrl.clone()
                url.pathname = '/'
                return NextResponse.redirect(url)
            }
            console.log('✅ Admin access granted')
        }

        // Redirect admin từ home
        if (isHomePage && (userRole === 'admin' || userRole === 'superadmin')) {
            console.log('Redirecting admin from home to admin panel')
            const url = request.nextUrl.clone()
            url.pathname = '/admin'
            return NextResponse.redirect(url)
        }

        console.log('✅ Access granted')
        return supabaseResponse

    } catch (error) {
        console.error('Middleware error:', error)

        // Nếu có lỗi và cố truy cập admin
        if (isAdminRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            return NextResponse.redirect(url)
        }

        return supabaseResponse
    }
}