// src/lib/auth.ts - Version đơn giản, ít lỗi
import { createClient } from '@/utils/supabase/client'
import { useAuthStore } from '@/stores/authStore'

export const signInWithEmail = async (email: string, password: string) => {
    const supabase = createClient()

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

            // Lấy role từ user metadata
            const userRole = data.user.user_metadata?.role || 'user'

            // Thử lấy profile - KHÔNG tạo mới nếu không có
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
                role: userRole,
                profile: profile || undefined,
            }

            useAuthStore.getState().setUser(user)
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
    const supabase = createClient()

    try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            console.error('getCurrentUser auth error:', error)
            throw error
        }

        if (user) {
            console.log('✅ Current user found:', user.id)

            // Lấy role từ user metadata
            const userRole = user.user_metadata?.role || 'user'

            // Thử lấy profile - KHÔNG tạo mới nếu không có
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
                role: userRole,
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
    const supabase = createClient()

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