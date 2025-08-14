
import { useEffect, useRef, useState } from 'react';

export const useFluidAnimations = () => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return { isVisible, elementRef };
};

export const useStaggeredAnimation = (itemCount: number, delay: number = 100) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    for (let i = 0; i < itemCount; i++) {
      const timeout = setTimeout(() => {
        setVisibleItems(prev => [...prev, i]);
      }, i * delay);
      
      timeouts.push(timeout);
    }
    
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [itemCount, delay]);
  
  return visibleItems;
};

export const useRippleEffect = () => {
  const createRipple = (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);
  };

  return { createRipple };
};
