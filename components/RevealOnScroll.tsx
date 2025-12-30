import React, { useEffect, useRef, useState } from 'react';

interface RevealOnScrollProps {
  children: React.ReactNode;
  threshold?: number;
  delay?: number; // milliseconds
  className?: string;
  variant?: 'up' | 'down' | 'left' | 'right' | 'zoom' | 'blur';
}

const RevealOnScroll: React.FC<RevealOnScrollProps> = ({ 
  children, 
  threshold = 0.05, // Lower threshold for better reliability
  delay = 0,
  className = "",
  variant = 'up'
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: threshold,
        rootMargin: "0px" // Removed negative margin to prevent images staying hidden
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  const getHiddenClass = () => {
    switch(variant) {
      case 'left': return 'reveal-hidden-left';
      case 'right': return 'reveal-hidden-right';
      case 'down': return 'reveal-hidden-down';
      case 'zoom': return 'reveal-hidden-zoom';
      case 'blur': return 'reveal-hidden-blur';
      default: return 'reveal-hidden-up';
    }
  };

  return (
    <div 
      ref={ref} 
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal-base ${isVisible ? 'reveal-visible' : getHiddenClass()} ${className}`}
    >
      {children}
    </div>
  );
};

export default RevealOnScroll;