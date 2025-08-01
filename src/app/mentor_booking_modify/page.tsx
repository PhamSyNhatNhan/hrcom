'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/stores/authStore';

const supabase = createClient();



const MentorBookingModifyPage = () => {

    return (
        <div >

        </div>
    );
};

export default MentorBookingModifyPage;