import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'status' | 'priority' | 'neutral' | 'outline';
  type?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant, type = '' }) => {
  const getColors = () => {
    if (variant === 'outline') {
      return { bg: 'transparent', color: 'var(--color-primary)', border: 'var(--color-border-orange)' };
    }
    const val = String(type || children).toUpperCase();
    if (val === 'CRITICAL' || val === 'ESCALATED' || val === 'FAILED') {
      return { bg: 'rgba(239, 68, 68, 0.12)', color: '#DC2626', border: 'rgba(239, 68, 68, 0.3)' };
    }
    if (val === 'HIGH' || val === 'SUSPICIOUS' || val === 'UNDER_INVESTIGATION') {
      return { bg: 'rgba(255, 90, 20, 0.12)', color: '#FF5A14', border: 'rgba(255, 90, 20, 0.35)' };
    }
    if (val === 'MEDIUM' || val === 'REQUIRES_REVIEW' || val === 'PENDING') {
      return { bg: 'rgba(245, 158, 11, 0.12)', color: '#D97706', border: 'rgba(245, 158, 11, 0.3)' };
    }
    if (val === 'LOW' || val === 'CLOSED' || val === 'COMPLETED' || val === 'CONNECTED' || val === 'READY') {
      return { bg: 'rgba(22, 163, 74, 0.12)', color: '#16A34A', border: 'rgba(22, 163, 74, 0.3)' };
    }
    return { bg: 'rgba(107, 114, 128, 0.1)', color: 'var(--color-text-secondary)', border: 'var(--color-border)' };
  };

  const style = getColors();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
};
