// lib/auth.ts
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
            throw error
        }

        if (data.user) {
            // Lấy thông tin profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single()

            if (profileError) {
                console.error('Error fetching profile:', profileError)
            }

            // Tạo user object để lưu vào store
            const user = {
                id: data.user.id,
                email: data.user.email!,
                role: data.user.user_metadata?.role || 'user',
                profile: profile || undefined
            }

            // Lưu vào Zustand store
            useAuthStore.getState().setUser(user)

            return { user, error: null }
        }

        return { user: null, error: null }
    } catch (error: any) {
        return { user: null, error: error.message }
    }
}

export const signOut = async () => {
    const supabase = createClient()

    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error

        // Clear Zustand store
        useAuthStore.getState().logout()

        return { error: null }
    } catch (error: any) {
        return { error: error.message }
    }
}

export const getCurrentUser = async () => {
    const supabase = createClient()

    try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) throw error

        if (user) {
            // Lấy profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            const userWithProfile = {
                id: user.id,
                email: user.email!,
                role: user.user_metadata?.role || 'user',
                profile: profile || undefined
            }

            useAuthStore.getState().setUser(userWithProfile)
            return { user: userWithProfile, error: null }
        }

        return { user: null, error: null }
    } catch (error: any) {
        return { user: null, error: error.message }
    }
}