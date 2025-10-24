'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroCarouselProps {
  images: string[];
  autoPlayInterval?: number;
  className?: string;
}

export function HeroCarousel({ images, autoPlayInterval = 5000, className = '' }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, goToNext]);

  return (
    <div className={`relative group ${className}`}>
      {/* Main Image Container */}
      <div className="relative w-[150%] h-[555px] aspect-[16/7.5] overflow-hidden rounded-xl shadow-2xl shadow-[#82ffb2]/20 border-white">
        {images.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image}
              alt={`Proanbud platform screenshot ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="(max-width: 1920px) 100vw, 50vw"
            />
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-gray-900/50 px-4 py-2 rounded-full backdrop-blur-sm">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'bg-white w-8 h-2'
                : 'bg-white/50 hover:bg-white/75 w-2 h-2'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#ff82d0]/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-[#82b2ff]/20 rounded-full blur-3xl -z-10"></div>
    </div>
  );
}
