import React, { useState } from 'react';
import { Shield, Moon, Sun, Contrast, Menu, X, Activity, Layers, /* PlayCircle, */ BarChart3, /* Database, */ /* BookOpen */ } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'landing', label: 'Overview', icon: <Shield size={16} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
    { id: 'queue', label: 'Case Queue', icon: <Layers size={16} /> },
    { id: 'actions', label: 'Action History', icon: <Activity size={16} /> },
    // { id: 'integrations', label: 'Infrastructure', icon: <Database size={16} /> },
    // { id: 'simulator', label: 'Concurrency Simulator', icon: <PlayCircle size={16} /> },
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          maxWidth: '1440px',
          margin: '0 auto',
        }}
      >
        {/* Brand */}
        <div
          onClick={() => handleNavClick('landing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-white)',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
                AGENT 34
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(255, 90, 20, 0.15)',
                  color: 'var(--color-primary)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-border-orange)',
                }}
              >
                AUTONOMOUS INVESTIGATION
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', display: 'block' }}>
              Merchant & User Fraud Resolution Agent
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '6px',
          }}
          className="desktop-nav"
        >
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  backgroundColor: isActive ? 'var(--color-input-background)' : 'transparent',
                  border: isActive ? '1px solid var(--color-border-orange)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Theme Toggle & Mobile Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Swagger API Docs Link
          <a
            href="http://localhost:5000/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Interactive Swagger API Documentation"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--color-input-background)',
              border: '1px solid var(--color-border-orange)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <BookOpen size={14} />
            <span>Swagger API</span>
          </a> */}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={`Current theme: ${theme.toUpperCase()} (Click to toggle)`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--color-input-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {theme === 'light' && <Sun size={15} color="#FF7A45" />}
            {theme === 'dark' && <Moon size={15} color="#FF5A14" />}
            {theme === 'contrast' && <Contrast size={15} color="#000000" />}
            <span style={{ textTransform: 'capitalize' }}>{theme}</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-primary)',
            }}
            className="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--color-surface)',
            borderTop: '1px solid var(--color-divider)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                fontWeight: currentTab === item.id ? 600 : 500,
                color: currentTab === item.id ? 'var(--color-primary)' : 'var(--color-text-primary)',
                backgroundColor: currentTab === item.id ? 'var(--color-input-background)' : 'transparent',
                border: 'none',
                textAlign: 'left',
                width: '100%',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
};
