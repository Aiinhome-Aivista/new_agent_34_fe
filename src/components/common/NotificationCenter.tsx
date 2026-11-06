import React, { useState, useEffect, useRef } from 'react';
import { Bell, ShieldAlert, Check, ExternalLink } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { AppNotificationItem } from '../../api/client';

interface NotificationCenterProps {
  currentUser?: { id?: string; name: string; role: string; email: string } | null;
  onSelectCase?: (caseId: string) => void;
  onNavigateEscalations?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUser,
  onSelectCase,
  onNavigateEscalations,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await apiClient.getNotifications(currentUser.role, currentUser.id);
      setNotifications(res.items || []);
      setUnreadCount(res.unread_count || 0);
    } catch {
      // ignore network errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 15 seconds to keep notifications real-time
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.role, currentUser?.id]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      await apiClient.markAllNotificationsRead(currentUser.role, currentUser.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (notif: AppNotificationItem) => {
    if (!notif.is_read) {
      try {
        await apiClient.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {
        console.error('Failed to mark read:', e);
      }
    }
    setIsOpen(false);
    if (notif.case_id && onSelectCase) {
      onSelectCase(notif.case_id);
    } else if (onNavigateEscalations) {
      onNavigateEscalations();
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  const isSeniorOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SENIOR_INVESTIGATOR';

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: isOpen ? 'var(--color-surface-hover)' : 'var(--color-input-background)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontSize: '0.65rem',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid var(--color-surface)',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '380px',
            maxWidth: '90vw',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-input-background)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#EF4444',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* Senior Persona Notice Banner */}
          {isSeniorOrAdmin && (
            <div
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                padding: '8px 16px',
                fontSize: '0.72rem',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>⭐ Senior Committee Alert Stream Active</span>
              {onNavigateEscalations && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateEscalations();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563EB',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  Escalation Desk <ExternalLink size={11} />
                </button>
              )}
            </div>
          )}

          {/* List of items */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.85rem',
                }}
              >
                <Bell size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <div>No notifications right now</div>
                <div style={{ fontSize: '0.72rem', marginTop: '4px', opacity: 0.8 }}>
                  When cases are escalated, you'll see alerts here in real-time.
                </div>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--color-border)',
                    backgroundColor: item.is_read ? 'transparent' : 'rgba(239, 68, 68, 0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = item.is_read
                      ? 'transparent'
                      : 'rgba(239, 68, 68, 0.04)';
                  }}
                >
                  {/* Category icon */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: item.category === 'ESCALATION' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: item.category === 'ESCALATION' ? '#DC2626' : '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <ShieldAlert size={16} />
                  </div>

                  {/* Text details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <div
                        style={{
                          fontWeight: item.is_read ? 600 : 700,
                          fontSize: '0.82rem',
                          color: 'var(--color-text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        marginTop: '3px',
                        lineHeight: 1.4,
                      }}
                    >
                      {item.message}
                    </div>

                    {item.sender_name && (
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: '#475569',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>Sender: <strong>{item.sender_name}</strong></span>
                        {item.sender_role && (
                          <span
                            style={{
                              backgroundColor: 'var(--color-input-background)',
                              border: '1px solid var(--color-border)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                            }}
                          >
                            {item.sender_role}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Unread dot */}
                  {!item.is_read && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '4px',
                        backgroundColor: '#EF4444',
                        flexShrink: 0,
                        marginTop: '6px',
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {onNavigateEscalations && (
            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-input-background)',
                textAlign: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateEscalations();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Go to Escalation Desk →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
