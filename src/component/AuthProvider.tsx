// components/AuthProvider.tsx
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/utils/supabase/client';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setLoading } = useAuthStore()

    useEffect(() => {

        // Lấy user hiện tại khi component mount
        const getInitialUser = async () => {
            setLoading(true)
            await getCurrentUser()
            setLoading(false)
        }

        getInitialUser()

        // Lắng nghe auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                // User signed in
                const { user } = await getCurrentUser()
                setUser(user)
            } else if (event === 'SIGNED_OUT') {
                // User signed out
                setUser(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [setUser, setLoading])

    return <>{children}</>
}