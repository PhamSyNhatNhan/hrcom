'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

type ImageCarouselProps = {
    images: string[];
    interval?: number;
    transitionDuration?: number;
    className?: string;
};

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
                                                                images,
                                                                interval = 3000,
                                                                transitionDuration = 500,
                                                                className = '',
                                                            }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (images.length <= 1) return;

        const timer = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
                setIsTransitioning(false);
            }, 300);
        }, interval);

        return () => clearInterval(timer);
    }, [images.length, interval]);

    return (
        <div className={`relative overflow-hidden ${className} h-[300px] sm:h-[500px]`}>
            <div
                className={`relative w-full h-full transition-all ease-in-out duration-${transitionDuration} ${
                    isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
                }`}
            >
                <Image
                    src={images[currentIndex]}
                    alt={`Image ${currentIndex + 1}`}
                    fill
                    className="object-cover object-center"
                    priority
                />
            </div>
        </div>
    );
};
