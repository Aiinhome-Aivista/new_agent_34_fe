import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useTaskProgress } from '../../context/TaskProgressContext';

export const GlobalTaskProgressDock: React.FC = () => {
  const {
    activeTask,
    isDockVisible,
    isDockMinimized,
    setIsDockMinimized,
    dismissTask,
    navigateToTab,
  } = useTaskProgress();

  if (!isDockVisible || !activeTask) {
    return null;
  }

  const isRunning = activeTask.status === 'running';
  const isCompleted = activeTask.status === 'completed';
  const isError = activeTask.status === 'error';
  const isBatch = activeTask.type === 'batch_ingest';

  const handleNavigate = () => {
    if (navigateToTab) {
      if (isBatch) {
        navigateToTab('batch-ingest');
      } else {
        navigateToTab('admin');
      }
    }
  };

  // -------------------------------------------------------------------------
  // Minimized Pill Mode (Docked at Bottom-Right)
  // -------------------------------------------------------------------------
  if (isDockMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '22px',
          right: '28px',
          zIndex: 99999,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-full)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(255, 90, 20, 0.15)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          backdropFilter: 'blur(10px)',
          userSelect: 'none',
        }}
        onClick={() => setIsDockMinimized(false)}
        title="Click to expand ingestion progress details"
        className="animate-fade-in"
      >
        {/* Pulsing indicator / icon */}
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: isError
              ? 'rgba(239, 68, 68, 0.15)'
              : isCompleted
              ? 'rgba(16, 185, 129, 0.15)'
              : isBatch
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(255, 90, 20, 0.15)',
            color: isError
              ? '#EF4444'
              : isCompleted
              ? '#10B981'
              : isBatch
              ? '#10B981'
              : 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {isRunning ? (
            <Loader2 size={15} className="animate-spin" />
          ) : isCompleted ? (
            <CheckCircle2 size={16} />
          ) : isError ? (
            <AlertCircle size={16} />
          ) : isBatch ? (
            <FileSpreadsheet size={15} />
          ) : (
            <FileText size={15} />
          )}

          {isRunning && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isBatch ? '#10B981' : 'var(--color-primary)',
                boxShadow: `0 0 8px ${isBatch ? '#10B981' : 'var(--color-primary)'}`,
              }}
            />
          )}
        </div>

        {/* Task info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activeTask.title}
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isCompleted ? '#10B981' : 'var(--color-primary)',
              }}
            >
              {activeTask.progress}%
            </span>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>
              {activeTask.current} / {activeTask.total || '?'} {activeTask.unit}
            </span>
            <span>·</span>
            <span style={{ color: isRunning ? 'var(--color-primary)' : 'inherit' }}>
              {isRunning ? 'Processing in background' : isCompleted ? 'Completed' : 'Failed'}
            </span>
          </div>
        </div>

        {/* Mini progress bar */}
        <div
          style={{
            width: '42px',
            height: '5px',
            backgroundColor: 'var(--color-input-background)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.max(5, activeTask.progress))}%`,
              height: '100%',
              backgroundColor: isError ? '#EF4444' : isCompleted ? '#10B981' : 'var(--color-primary)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDockMinimized(false);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <ChevronUp size={16} />
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Expanded Card Mode (Full Floating Dock)
  // -------------------------------------------------------------------------
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '28px',
        width: '390px',
        maxWidth: 'calc(100vw - 36px)',
        zIndex: 99999,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 18px 40px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(255, 90, 20, 0.15)',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="animate-fade-in"
      role="region"
      aria-label="Background Task Progress"
    >
      {/* Top Accent Strip */}
      <div
        style={{
          height: '3px',
          width: '100%',
          backgroundColor: isError
            ? '#EF4444'
            : isCompleted
            ? '#10B981'
            : isBatch
            ? '#10B981'
            : 'var(--color-primary)',
          transition: 'background-color 0.3s ease',
        }}
      />

      {/* Dock Header */}
      <div
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-divider)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: isError
                ? 'rgba(239, 68, 68, 0.12)'
                : isCompleted
                ? 'rgba(16, 185, 129, 0.12)'
                : isBatch
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(255, 90, 20, 0.12)',
              color: isError
                ? '#EF4444'
                : isCompleted
                ? '#10B981'
                : isBatch
                ? '#10B981'
                : 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isBatch ? <FileSpreadsheet size={16} /> : <FileText size={16} />}
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.86rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={activeTask.title}
            >
              {activeTask.title}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{isBatch ? 'Batch Transaction Ingest' : 'Private Policy Vectorizer'}</span>
              <span>·</span>
              <span
                style={{
                  fontWeight: 600,
                  color: isError ? '#EF4444' : isCompleted ? '#10B981' : 'var(--color-primary)',
                }}
              >
                {isRunning ? 'Running live...' : isCompleted ? 'Completed' : 'Error'}
              </span>
            </div>
          </div>
        </div>

        {/* Window Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={() => setIsDockMinimized(true)}
            title="Minimize to pill"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <ChevronDown size={15} />
          </button>
          <button
            onClick={() => dismissTask(activeTask.id)}
            title="Dismiss dock"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Dock Body: Progress & Live Stats */}
      <div style={{ padding: '16px 18px', backgroundColor: 'var(--color-surface)' }}>
        {/* Progress Numbers & Item Counter */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: isError ? '#EF4444' : isCompleted ? '#10B981' : 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {activeTask.progress}%
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              completed
            </span>
          </div>

          {/* User Requested: "koto gulo process hocche setao jno dekhai" */}
          <div
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isCompleted
                ? 'rgba(16, 185, 129, 0.1)'
                : 'var(--color-input-background)',
              border: '1px solid var(--color-border)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: isCompleted ? '#10B981' : 'var(--color-text-primary)',
            }}
          >
            {activeTask.current} / {activeTask.total || '?'} {activeTask.unit} processed
          </div>
        </div>

        {/* Progress Bar with animated track & glow */}
        <div
          style={{
            width: '100%',
            height: '7px',
            backgroundColor: 'var(--color-input-background)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            position: 'relative',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.max(4, activeTask.progress))}%`,
              borderRadius: 'var(--radius-full)',
              backgroundColor: isError
                ? '#EF4444'
                : isCompleted
                ? '#10B981'
                : isBatch
                ? '#10B981'
                : 'var(--color-primary)',
              transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isRunning
                ? `0 0 10px ${isBatch ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 90, 20, 0.5)'}`
                : 'none',
            }}
          />
        </div>

        {/* Real-time Status Message */}
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            lineHeight: 1.4,
            minHeight: '36px',
            backgroundColor: 'var(--color-input-background)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
          }}
        >
          {isRunning ? (
            <Loader2
              size={14}
              className="animate-spin"
              style={{ color: isBatch ? '#10B981' : 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }}
            />
          ) : isCompleted ? (
            <CheckCircle2 size={14} style={{ color: '#10B981', flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <AlertCircle size={14} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
          )}

          <div style={{ wordBreak: 'break-word', flex: 1 }}>
            {activeTask.message || 'Processing task in background...'}
          </div>
        </div>

        {/* Bottom Navigation Hint & Action Buttons */}
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          {isRunning ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  display: 'inline-block',
                }}
              />
              <span>Switching tabs won't stop this process</span>
            </div>
          ) : (
            <div style={{ fontWeight: 600, color: isCompleted ? '#10B981' : '#EF4444' }}>
              {isCompleted ? '✓ All items successfully processed' : '✕ Ingestion halted'}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Direct Tab Navigation Button */}
            {navigateToTab && (
              <button
                onClick={handleNavigate}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  backgroundColor: 'var(--color-surface)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
              >
                <span>{isBatch ? 'View Ingest Tab' : 'View Policies'}</span>
                <ArrowRight size={11} />
              </button>
            )}

            {/* Dismiss Button */}
            {(isCompleted || isError) && (
              <button
                onClick={() => dismissTask(activeTask.id)}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
