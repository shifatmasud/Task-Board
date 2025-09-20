import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, type SpringOptions } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactElement;
}

const MagneticButton: React.FC<MagneticButtonProps> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig: SpringOptions = { damping: 15, stiffness: 200, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const mouseX = clientX - (left + width / 2);
    const mouseY = clientY - (top + height / 2);
    
    // Apply magnetic pull
    x.set(mouseX * 0.4);
    y.set(mouseY * 0.4);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: springX,
        y: springY,
        display: 'inline-block',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
    >
      {children}
    </motion.div>
  );
};

export default MagneticButton;
