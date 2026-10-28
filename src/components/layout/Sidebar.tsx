import React, { useState } from 'react';
import {
  Shield,
  BarChart3,
  Layers,
  Activity,
  // Database,
  // PlayCircle,
  Sliders,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Contrast,
  // BookOpen,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: { name: string; role: string; email: string };
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  description: string;
  badge?: string;
}

const getNavItems = (role?: string): NavItem[] => {
  const items: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, description: 'Analytics & case metrics' },
    { id: 'queue', label: 'Case Queue', icon: Layers, description: 'Active investigation cases' },
    { id: 'batch-ingest', label: 'Batch Ingestion', icon: FileSpreadsheet, description: 'Excel/CSV auto-trigger' },
    { id: 'actions', label: 'Action History', icon: Activity, description: 'Audit trail & past decisions' },
    // { id: 'integrations', label: 'Infrastructure', icon: Database, description: 'System health & integrations' },
    // { id: 'simulator', label: 'Simulator', icon: PlayCircle, description: 'Concurrency stress testing' },
  ];

  // Admin persona gets dedicated Policies & Parameters & Knowledge management
  if (role === 'ADMIN') {
    items.push({
      id: 'admin',
      label: 'Policies & Params',
      icon: Sliders,
      description: 'SOP policies, parameters & knowledge base',
      badge: 'ADMIN',
    });
  }

  return items;
};

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, user, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const themeIcon = theme === 'light' ? <Sun size={16} /> : theme === 'dark' ? <Moon size={16} /> : <Contrast size={16} />;

  return (
    <aside
      style={{
        width: collapsed ? '68px' : '240px',
        minWidth: collapsed ? '68px' : '240px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-sidebar)',
        borderRight: '1px solid var(--color-border)',
        transition: 'width var(--transition-normal), min-width var(--transition-normal)',
        overflow: 'hidden',
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Brand header */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0 16px' : '0 16px 0 20px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => onSelectTab('landing')}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)',
                flexShrink: 0,
              }}
            >
              <Shield size={17} color="white" />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                FraudOps AI
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                Investigation Platform
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={() => onSelectTab('landing')}
          >
            <Shield size={17} color="white" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            margin: '8px auto',
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: '4px 8px',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Nav Items */}
      <nav
        style={{
          flex: 1,
          padding: collapsed ? '8px 8px' : '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {getNavItems(user.role).map((item: any) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (currentTab === 'casedetail' && item.id === 'queue');
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '10px' : '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isActive ? 'var(--color-border-orange)' : 'transparent'}`,
                backgroundColor: isActive ? 'var(--color-input-background)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all var(--transition-fast)',
                justifyContent: collapsed ? 'center' : 'flex-start',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <>
                  <span
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: isActive ? 600 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}

        {/* Swagger link
        <a
          href="http://localhost:5000/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? 'Swagger API Docs' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: collapsed ? '10px' : '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid transparent',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            fontSize: '0.88rem',
            fontWeight: 500,
            transition: 'all var(--transition-fast)',
            justifyContent: collapsed ? 'center' : 'flex-start',
            marginTop: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <BookOpen size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Swagger API</span>}
        </a> */}
      </nav>

      {/* Bottom section: user profile + controls */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: collapsed ? '12px 8px' : '12px 10px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={`Theme: ${theme}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: collapsed ? '8px' : '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'transparent',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            width: '100%',
            fontSize: '0.82rem',
            fontWeight: 500,
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {themeIcon}
          {!collapsed && <span style={{ textTransform: 'capitalize' }}>{theme} Mode</span>}
        </button>

        {/* User card */}
        {!collapsed && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-input-background)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.name}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.role}
              </div>
            </div>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={onLogout}
          title="Sign out"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: collapsed ? '8px' : '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid transparent',
            backgroundColor: 'transparent',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            width: '100%',
            fontSize: '0.82rem',
            fontWeight: 500,
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.08)';
            e.currentTarget.style.color = '#DC2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
