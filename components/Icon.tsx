import React from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';

interface IconProps {
  name: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  size?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({ name, weight = 'regular', size = 18, style, onClick }) => {
    // Converts kebab-case to PascalCase e.g. "floppy-disk" -> "FloppyDisk"
    const iconName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const IconComponent = (PhosphorIcons as any)[iconName];
    
    if (!IconComponent) {
        console.warn(`Icon "${name}" not found in @phosphor-icons/react. Rendering fallback.`);
        // Render a fallback question mark icon.
        return <PhosphorIcons.Question size={size} weight={weight} style={style} onClick={onClick} />;
    }
    
    return <IconComponent size={size} weight={weight} style={style} onClick={onClick} />;
};

export default Icon;
