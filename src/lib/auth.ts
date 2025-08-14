import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/utils/supabase/client';

export const signInWithEmail = async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error('Login error:', error)
            throw error
        }

        if (data.user) {
            console.log('✅ User logged in:', data.user.id)

            // ✅ LẤY ROLE TỪ USER_METADATA (AN TOÀN)
            const userRole = data.user.user_metadata?.role || 'user'
            console.log('✅ User role from metadata:', userRole)

            // Thử lấy profile
            let profile = null
            try {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single()

                profile = profileData
                console.log('Profile:', profile ? '✅ Found' : '❌ Not found')
            } catch (profileError) {
                console.warn('Profile fetch failed:', profileError)
            }

            const user = {
                id: data.user.id,
                email: data.user.email!,
                role: userRole as 'user' | 'mentor' | 'admin' | 'superadmin',
                profile: profile || undefined,
            }

            useAuthStore.getState().setUser(user)

            // ✅ KIỂM TRA EMAIL VERIFICATION - MIDDLEWARE SẼ XỬ LÝ REDIRECT
            if (!data.user.email_confirmed_at) {
                console.log('⚠️ Email not verified - middleware will handle redirect')
                return {
                    user,
                    error: null,
                    needsVerification: true
                }
            }

            return { user, error: null }
        }

        return { user: null, error: null }
    } catch (error: unknown) {
        console.error('signInWithEmail error:', error)
        if (error instanceof Error) {
            return { user: null, error: error.message }
        }
        return { user: null, error: 'Đã xảy ra lỗi không xác định' }
    }
}

export const getCurrentUser = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            console.error('getCurrentUser auth error:', error)
            throw error
        }

        if (user) {
            console.log('✅ Current user found:', user.id)

            // ✅ LẤY ROLE TỪ USER_METADATA (AN TOÀN)
            const userRole = user.user_metadata?.role || 'user'
            console.log('✅ User role from metadata:', userRole)

            // Thử lấy profile
            let profile = null
            try {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                profile = profileData
                console.log('Profile:', profile ? '✅ Found' : '❌ Not found')
            } catch (profileError) {
                console.warn('Profile fetch failed:', profileError)
            }

            const userWithProfile = {
                id: user.id,
                email: user.email!,
                role: userRole as 'user' | 'mentor' | 'admin' | 'superadmin',
                profile: profile || undefined,
            }

            useAuthStore.getState().setUser(userWithProfile)
            return { user: userWithProfile, error: null }
        }

        console.log('❌ No user found')
        useAuthStore.getState().setUser(null)
        return { user: null, error: null }
    } catch (error: unknown) {
        console.error('getCurrentUser error:', error)
        useAuthStore.getState().setUser(null)
        if (error instanceof Error) {
            return { user: null, error: error.message }
        }
        return { user: null, error: 'Đã xảy ra lỗi không xác định' }
    }
}

export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error

        useAuthStore.getState().logout()
        return { error: null }
    } catch (error: unknown) {
        console.error('signOut error:', error)
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: 'Đã xảy ra lỗi không xác định' }
    }
}

// ✅ HELPER FUNCTION KIỂM TRA ROLE (CLIENT-SIDE)
export const hasRole = (userRole: string, requiredRole: string | string[]): boolean => {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

    // Define role hierarchy
    const roleHierarchy: Record<string, number> = {
        'user': 1,
        'mentor': 2,
        'admin': 3,
        'superadmin': 4
    }

    const userLevel = roleHierarchy[userRole] || 0

    return roles.some(role => {
        const requiredLevel = roleHierarchy[role] || 0
        return userLevel >= requiredLevel
    })
}

// ✅ HELPER FUNCTION LẤY USER TỪ STORE
export const getUserFromStore = () => {
    return useAuthStore.getState().user
}

// ✅ HELPER FUNCTION KIỂM TRA USER CÓ ĐĂNG NHẬP VÀ VERIFY
export const isUserAuthenticated = () => {
    const user = getUserFromStore()
    return !!user
}

// ✅ HELPER FUNCTION KIỂM TRA QUYỀN TRUY CẬP
export const canAccessRoute = (routeType: 'admin' | 'mentor' | 'public') => {
    const user = getUserFromStore()

    if (!user) return routeType === 'public'

    switch (routeType) {
        case 'admin':
            return hasRole(user.role, ['admin', 'superadmin'])
        case 'mentor':
            return hasRole(user.role, ['mentor', 'admin', 'superadmin'])
        case 'public':
            return true
        default:
            return false
    }
}