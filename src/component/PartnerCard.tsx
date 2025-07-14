'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Partner {
    imageSrc: string;
    href: string;
}

interface PartnerCardProps {
    partner: Partner;
}

export const PartnerCard = ({ partner }: PartnerCardProps) => (
    <Link href={partner.href} className="block transform transition-transform duration-500 hover:scale-105">
        <div className="relative w-full h-24 sm:h-28 md:h-32 rounded-xl overflow-hidden">
            <Image
                src={partner.imageSrc}
                alt="Partner logo"
                fill
                className="object-contain p-4 bg-white"
            />
        </div>
    </Link>
);
