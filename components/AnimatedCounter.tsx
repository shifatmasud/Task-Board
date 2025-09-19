import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  fontSize?: number;
  style?: React.CSSProperties;
}

const Digit: React.FC<{ value: number; height: number; }> = ({ value, height }) => {
  return (
    <motion.div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      animate={{ y: -value * height }}
      transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 1 }}
    >
      {[...Array(10).keys()].map(i => (
        <span key={i} style={{ height: `${height}px`, lineHeight: `${height}px` }}>{i}</span>
      ))}
    </motion.div>
  );
};

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, fontSize = 12, style }) => {
  const digits = String(value).split('').map(Number);
  const height = fontSize;

  return (
    <div style={{ 
      display: 'flex', 
      overflow: 'hidden', 
      height: `${height}px`,
      fontSize: `${fontSize}px`,
      lineHeight: `${height}px`,
      ...style 
    }}>
      {digits.map((digit, index) => (
        <div key={index} style={{height: `${height}px`}}>
            <Digit value={digit} height={height} />
        </div>
      ))}
    </div>
  );
};

export default AnimatedCounter;
