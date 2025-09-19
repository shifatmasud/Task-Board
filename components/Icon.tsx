
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
  const className = `ph-${name}${weight !== 'regular' ? `-${weight}` : ''}`;
  
  const combinedStyle = {
    ...style,
    fontSize: `${size}px`,
  };

  return <i className={className} style={combinedStyle} onClick={onClick}></i>;
};

export default Icon;
