import { useState, useEffect, useRef } from 'react';

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const useAnimatedCounter = (endValue: number, duration: number = 1500) => {
    const [count, setCount] = useState(0);
    const frameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const startValueRef = useRef(0);

    useEffect(() => {
        const startValue = count; // Start animation from current value on re-render
        startValueRef.current = startValue;
        startTimeRef.current = null;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) {
                startTimeRef.current = timestamp;
            }

            const progress = timestamp - startTimeRef.current;
            const progressRatio = Math.min(progress / duration, 1);
            const easedProgress = easeOutCubic(progressRatio);
            
            const currentValue = startValueRef.current + (endValue - startValueRef.current) * easedProgress;
            
            setCount(currentValue);

            if (progressRatio < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                setCount(endValue); // Ensure it ends exactly on the end value
            }
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [endValue, duration]);

    return Math.round(count);
};
