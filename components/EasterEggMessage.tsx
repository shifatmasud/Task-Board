import React from 'react';
import { motion } from 'framer-motion';

const particleColors = ['var(--danger)', 'var(--accent-blue)', 'var(--priority-low)', 'var(--priority-medium)'];
const numParticles = 60;

const Particle: React.FC = () => {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 250 + 80;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const color = particleColors[Math.floor(Math.random() * particleColors.length)];
  const size = Math.random() * 12 + 6;
  const delay = Math.random() * 0.4;
  const duration = Math.random() * 1.0 + 0.8;

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}, 0 0 12px ${color}`,
      }}
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0.5],
        x: x,
        y: y,
      }}
      transition={{
        duration: duration,
        delay: delay,
        ease: 'easeOut',
      }}
    />
  );
};

const EasterEggMessage: React.FC = () => {
    return (
        <motion.div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
                pointerEvents: 'none',
                backgroundColor: 'rgba(10, 10, 10, 0.5)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)', // For Safari
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <motion.h1
                style={{
                    fontSize: 'clamp(2rem, 8vw, 4rem)',
                    color: 'var(--text-primary)',
                    textShadow: '0 0 10px white, 0 0 20px white, 0 0 30px #e60073, 0 0 40px #e60073',
                    zIndex: 2,
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200, damping: 15 } }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
            >
                Take Love ❤
            </motion.h1>
            <div style={{ position: 'absolute', zIndex: 1 }}>
                {[...Array(numParticles)].map((_, i) => (
                    <Particle key={i} />
                ))}
            </div>
        </motion.div>
    );
};

export default EasterEggMessage;