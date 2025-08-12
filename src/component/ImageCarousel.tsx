'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerItem {
    id: string;
    name: string;
    image_url: string;
    link_url?: string;
    open_new_tab: boolean;
}

type ImageCarouselProps = {
    banners: BannerItem[];
    interval?: number;
    transitionDuration?: number;
    className?: string;
    showArrows?: boolean;
    showDots?: boolean;
    autoPlay?: boolean;
};

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
                                                                banners,
                                                                interval = 3000,
                                                                transitionDuration = 500,
                                                                className = '',
                                                                showArrows = true,
                                                                showDots = true,
                                                                autoPlay = true,
                                                            }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-play functionality
    useEffect(() => {
        if (!autoPlay || banners.length <= 1 || isPaused) return;

        const timer = setInterval(() => {
            handleNext();
        }, interval);

        return () => clearInterval(timer);
    }, [banners.length, interval, autoPlay, isPaused, currentIndex]);

    const handleNext = () => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
            setIsTransitioning(false);
        }, 300);
    };

    const handlePrevious = () => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === 0 ? banners.length - 1 : prevIndex - 1
            );
            setIsTransitioning(false);
        }, 300);
    };

    const handleDotClick = (index: number) => {
        if (isTransitioning || index === currentIndex) return;

        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex(index);
            setIsTransitioning(false);
        }, 300);
    };

    const handleBannerClick = () => {
        const currentBanner = banners[currentIndex];
        if (currentBanner?.link_url) {
            if (currentBanner.open_new_tab) {
                window.open(currentBanner.link_url, '_blank', 'noopener,noreferrer');
            } else {
                window.location.href = currentBanner.link_url;
            }
        }
    };

    // If no banners, show placeholder
    if (!banners || banners.length === 0) {
        return (
            <div className={`relative overflow-hidden bg-gray-200 ${className} h-[300px] sm:h-[500px] flex items-center justify-center`}>
                <p className="text-gray-500">Không có banner nào</p>
            </div>
        );
    }

    const currentBanner = banners[currentIndex];

    return (
        <div
            className={`relative overflow-hidden ${className} h-[300px] sm:h-[500px] group`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Main Image */}
            <div
                className={`relative w-full h-full transition-all ease-in-out duration-${transitionDuration} ${
                    isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
                }`}
                onClick={currentBanner?.link_url ? handleBannerClick : undefined}
                style={{ cursor: currentBanner?.link_url ? 'pointer' : 'default' }}
            >
                <Image
                    src={currentBanner.image_url}
                    alt={currentBanner.name}
                    fill
                    className="object-cover object-center"
                    priority
                />

                {/* Overlay gradient for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                {/* Banner Title (show on hover) */}
                {currentBanner.name && (
                    <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                            <span className="font-medium">{currentBanner.name}</span>
                        </div>
                    </div>
                )}

                {/* Link indicator (show on hover) */}
                {currentBanner.link_url && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {currentBanner.open_new_tab ? 'Mở tab mới' : 'Xem thêm'}
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Arrows */}
            {showArrows && banners.length > 1 && (
                <>
                    <button
                        onClick={handlePrevious}
                        disabled={isTransitioning}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 disabled:opacity-30 z-10"
                        aria-label="Ảnh trước"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={isTransitioning}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 disabled:opacity-30 z-10"
                        aria-label="Ảnh tiếp theo"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {showDots && banners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleDotClick(index)}
                            disabled={isTransitioning}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                index === currentIndex
                                    ? 'bg-white scale-125'
                                    : 'bg-white/50 hover:bg-white/80'
                            }`}
                            aria-label={`Chuyển đến ảnh ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};