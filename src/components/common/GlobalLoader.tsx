import React from 'react';
import './GlobalLoader.css';

export type GlobalLoaderSize = 'sm' | 'md' | 'lg' | 'xl' | number;

export interface GlobalLoaderProps {
  /** Size preset ('sm' | 'md' | 'lg' | 'xl') or pixel number. Default: 'md' (72px) */
  size?: GlobalLoaderSize;
  /** Primary label displayed beneath the animation */
  text?: string;
  /** Secondary subtle description */
  subtext?: string;
  /** Optional badge pill (e.g. 'Zero-Mock Engine') */
  badge?: string;
  /** Primary light orange accent hex code. Default: #FFA24A */
  color?: string;
  /** Lighter gradient stop. Default: #FFBD7A */
  lightColor?: string;
  /** Darker gradient stop. Default: #F77F24 */
  darkColor?: string;
  /** Render as fixed full-screen overlay with blurred backdrop */
  overlay?: boolean;
  /** Optional callback to allow user to dismiss/cancel */
  onCancel?: () => void;
  /** Custom CSS class */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<string, number> = {
  sm: 44,
  md: 76,
  lg: 110,
  xl: 160,
};

/**
 * Pure SVG + CSS Sliding Diamonds Global Loader
 * Mathematically identical to Lottie animation pgnUH0IDIF with light orange styling.
 * 7 diamond tiles continuously sliding around an 8-position isometric perimeter and center.
 */
export const GlobalLoader: React.FC<GlobalLoaderProps> = ({
  size = 'md',
  text,
  subtext,
  badge,
  color = '#FFA24A',
  lightColor = '#FFBD7A',
  darkColor = '#F77F24',
  overlay = false,
  onCancel,
  className = '',
  style,
}) => {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 76;
  const gradientId = React.useId ? React.useId().replace(/:/g, '') : 'globalLoaderGrad';

  const loaderSvg = (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="-360 -360 720 720"
      style={{ overflow: 'visible', display: 'block' }}
      role="img"
      aria-label={text || 'Loading'}
    >
      <defs>
        {/* Light Orange linear gradient */}
        <linearGradient id={`grad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={lightColor} />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor={darkColor} />
        </linearGradient>

        {/* Ambient radial glow */}
        <radialGradient id={`glow-${gradientId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="65%" stopColor={color} stopOpacity="0.06" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Subtle background ambient glow */}
      <circle
        cx="0"
        cy="0"
        r="320"
        fill={`url(#glow-${gradientId})`}
        className="global-loader-ambient-glow"
      />

      {/* 
        7 Sliding Squares:
        Each square has side 157.6, rx=17.3, centered at (0,0) and rotated -45 deg.
        The outer group translates between the 8 spots using the exact Lottie keyframes.
      */}

      {/* Layer 0: B2 (Bottom-Right -> Center -> Bottom-Left) */}
      <g className="global-loader-sq global-loader-sq-b2">
        <g transform="rotate(-45)">
          <rect
            className="global-loader-diamond"
            x="-78.8"
            y="-78.8"
            width="157.6"
            height="157.6"
            rx="17.3"
            ry="17.3"
            fill={`url(#grad-${gradientId})`}
          />
        </g>
      </g>

      {/* Layer 1: B3 (Right -> Bottom-Right) */}
      <g className="global-loader-sq global-loader-sq-b3">
        <g transform="rotate(-45)">
          <rect
            className="global-loader-diamond"
            x="-78.8"
            y="-78.8"
            width="157.6"
            height="157.6"
            rx="17.3"
            ry="17.3"
            fill={`url(#grad-${gradientId})`}
          />
        </g>
      </g>

      {/* Layer 2: M3 (Top-Right -> Right) */}
      <g className="global-loader-sq global-loader-sq-m3">
        <g transform="rotate(-45)">
          <rect
            className="global-loader-diamond"
            x="-78.8"
            y="-78.8"
            width="157.6"
            height="157.6"
            rx="17.3"
            ry="17.3"
            fill={`url(#grad-${gradientId})`}
          />
        </g>
      </g>

      {/* Layer 3: T3 (Top -> Top-Right) */}
      <g className="global-loader-sq global-loader-sq-t3">
        <g transform="rotate(-45)">
          <rect
            className="global-loader-diamond"
            x="-78.8"
            y="-78.8"
            width="157.6"
            height="157.6"
            rx="17.3"
            ry="17.3"
            fill={`url(#grad-${gradientId})`}
          />
        </g>
      </g>

      {/* Layer 4: T2 (Top-Left -> Top) */}
      <g className="global-loader-sq global-loader-sq-t2">
        <g transform="rotate(-45)">
          <rect
            className="global-loader-diamond"
            x="-78.8"
            y="-78.8"
            width="157.6"
            height="157.6"
            rx="17.3"
            ry="17.3"
            fill={`url(#grad-${gradientId})`}
          />
        </g>
      </g>

      {/* Layer 5: T1 (Left -> Top-Left) */}
      <g className="global-loader-sq global-loader-sq-t1">
        <g transform="rotate(-45)">
          <rect
            className="global-loader-diamond"
            x="-78.8"
            y="-78.8"
            width="157.6"
            height="157.6"
            rx="17.3"
            ry="17.3"
            fill={`url(#grad-${gradientId})`}
          />
        </g>
      </g>

      {/* Layer 6: M1 (Bottom-Left -> Left) */}
      <g className="global-loader-sq global-loader-sq-m1">
        <g transform="rotate(-45)">
          <rect
            className="global-loader-diamond"
            x="-78.8"
            y="-78.8"
            width="157.6"
            height="157.6"
            rx="17.3"
            ry="17.3"
            fill={`url(#grad-${gradientId})`}
          />
        </g>
      </g>
    </svg>
  );

  const content = (
    <>
      {loaderSvg}
      {text && <div className="global-loader-title">{text}</div>}
      {subtext && <div className="global-loader-subtext">{subtext}</div>}
      {badge && <div className="global-loader-badge">{badge}</div>}
      {overlay && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          style={{
            marginTop: '20px',
            background: 'transparent',
            border: '1px solid var(--color-border, #d8d8d8)',
            padding: '6px 16px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            color: 'var(--color-text-secondary, #888)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text-primary, #000)';
            e.currentTarget.style.borderColor = 'var(--color-primary, #FF5A14)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-secondary, #888)';
            e.currentTarget.style.borderColor = 'var(--color-border, #d8d8d8)';
          }}
        >
          Cancel
        </button>
      )}
    </>
  );

  if (overlay) {
    return (
      <div className={`global-loader-overlay ${className}`} style={style} role="status" aria-live="polite">
        <div className="global-loader-card">{content}</div>
      </div>
    );
  }

  return (
    <div className={`global-loader-inline ${className}`} style={style} role="status" aria-live="polite">
      {content}
    </div>
  );
};

export default GlobalLoader;

