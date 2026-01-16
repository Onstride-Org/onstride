import { CSSProperties } from 'react';

interface HorseIconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

export function HorseIcon({ size = 24, className, style }: HorseIconProps) {
  return (
    <img
      src="/horse-icon.png"
      alt="Horse"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        ...style
      }}
    />
  );
}

export default HorseIcon;
