'use client'
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Blog {
    imageSrc: string;
    title: string;
    href: string;
}

interface BlogCardProps {
    feature: Blog;
}

export const BlogCard = ({ feature }: BlogCardProps) => (
    <div className="group">
        {/* Image Section */}
        <Link href={feature.href} className="block overflow-hidden rounded-xl">
            <div className="relative w-full h-48 sm:h-56 md:h-64">
                <Image
                    src={feature.imageSrc}
                    alt={feature.title}
                    fill
                    className="object-cover transform transition-transform duration-500 group-hover:scale-[1.08]"
                />
            </div>
        </Link>

        {/* Title Section */}
        <Link href={feature.href} className="block mt-3">
            <h3 className="text-sm sm:text-base text-[#11116c] font-medium leading-snug">
                {feature.title}
            </h3>
        </Link>
    </div>
);
