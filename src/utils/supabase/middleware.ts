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
    const isMentorRoute = pathname.startsWith('/mentor_page')
    const isHomePage = pathname === '/'

    console.log('Middleware check:', {
        pathname,
        isAuthRoute,
        isAdminRoute,
        isMentorRoute,
        isHomePage
    })

    try {
        // ✅ LẤY USER TỪ SUPABASE
        const {
            data: { user },
            error
        } = await supabase.auth.getUser()

        console.log('User check:', {
            hasUser: !!user,
            error: !!error,
            userId: user?.id,
            emailConfirmed: user?.email_confirmed_at ? 'Yes' : 'No'
        })

        // Nếu chưa đăng nhập
        if (!user || error) {
            console.log('❌ No authenticated user')

            // Cho phép truy cập auth routes
            if (isAuthRoute) {
                console.log('✅ Allowing auth route for unauthenticated user')
                return supabaseResponse
            }

            // Chặn protected routes
            if (isAdminRoute || isMentorRoute) {
                console.log('❌ Blocking protected route - redirecting to login')
                const url = request.nextUrl.clone()
                url.pathname = '/auth/login'
                url.searchParams.set('redirectTo', pathname)
                return NextResponse.redirect(url)
            }

            // Cho phép các route public khác
            console.log('✅ Allowing public route')
            return supabaseResponse
        }

        // ✅ ĐÃ ĐĂNG NHẬP - KIỂM TRA EMAIL VERIFICATION
        if (!user.email_confirmed_at) {
            console.log('⚠️ User logged in but email not verified')

            // Nếu chưa verify email và không ở trang verify, redirect đến verify
            if (!pathname.startsWith('/auth/verify-email') && !pathname.startsWith('/auth/logout')) {
                console.log('🔄 Redirecting to email verification')
                const url = request.nextUrl.clone()
                url.pathname = '/auth/verify-email'
                url.searchParams.set('email', user.email || '')
                return NextResponse.redirect(url)
            }

            // Cho phép ở lại trang verify hoặc logout
            return supabaseResponse
        }

        // ✅ LẤY ROLE TỪ USER_METADATA (AN TOÀN VỚI SUPABASE)
        const userRole = user.user_metadata?.role || 'user'
        console.log('✅ User authenticated and verified:', {
            email: user.email,
            role: userRole,
            metadata: user.user_metadata
        })

        // ✅ KIỂM TRA QUYỀN TRUY CẬP ADMIN
        if (isAdminRoute) {
            if (userRole !== 'admin' && userRole !== 'superadmin') {
                console.log(`❌ Access denied: User role '${userRole}' insufficient for admin route`)
                const url = request.nextUrl.clone()
                url.pathname = '/'
                url.searchParams.set('error', 'insufficient_permissions')
                return NextResponse.redirect(url)
            }
            console.log('✅ Admin access granted for role:', userRole)
        }

        // ✅ KIỂM TRA QUYỀN TRUY CẬP MENTOR
        if (isMentorRoute) {
            if (userRole !== 'mentor' && userRole !== 'admin' && userRole !== 'superadmin') {
                console.log(`❌ Access denied: User role '${userRole}' insufficient for mentor route`)
                const url = request.nextUrl.clone()
                url.pathname = '/'
                url.searchParams.set('error', 'insufficient_permissions')
                return NextResponse.redirect(url)
            }
            console.log('✅ Mentor access granted for role:', userRole)
        }

        // ✅ REDIRECT TỪ AUTH ROUTES CHO USER ĐÃ ĐĂNG NHẬP VÀ VERIFIED
        if (isAuthRoute && !pathname.startsWith('/auth/logout') && !pathname.startsWith('/auth/verify-email')) {
            console.log('🔄 Redirecting verified user from auth route')
            const url = request.nextUrl.clone()

            // Redirect based on role
            if (userRole === 'admin' || userRole === 'superadmin') {
                url.pathname = '/admin'
            } else {
                url.pathname = '/'
            }

            // Preserve any redirect parameter
            const redirectTo = request.nextUrl.searchParams.get('redirectTo')
            if (redirectTo && !redirectTo.startsWith('/auth')) {
                url.pathname = redirectTo
            }

            return NextResponse.redirect(url)
        }

        console.log('✅ Access granted to:', pathname)
        return supabaseResponse

    } catch (error) {
        console.error('❌ Middleware error:', error)

        // Nếu có lỗi và cố truy cập protected routes
        if (isAdminRoute || isMentorRoute) {
            console.log('❌ Error in middleware - redirecting to login')
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            url.searchParams.set('error', 'auth_error')
            return NextResponse.redirect(url)
        }

        // Cho phép truy cập các route khác nếu có lỗi
        return supabaseResponse
    }
}