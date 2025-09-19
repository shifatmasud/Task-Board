
import type React from 'react';
import { styles } from '../style';

interface IconProps {
  name: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  size?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({ name, weight = 'regular', size = 18, style, onClick }) => {
  // Correctly constructs class names for Phosphor Icons Web.
  // For regular weight: "ph ph-heart"
  // For other weights: "ph-bold ph-heart"
  const weightClass = weight === 'regular' ? 'ph' : `ph-${weight}`;
  const nameClass = `ph-${name}`;
  const className = `${weightClass} ${nameClass}`;
  
  const combinedStyle = {
    ...style,
    fontSize: `${size}px`,
  };

  return <i className={className} style={combinedStyle} onClick={onClick}></i>;
};

export default Icon;
