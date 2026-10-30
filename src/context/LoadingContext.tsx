import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { GlobalLoader } from '../components/common/GlobalLoader';

interface LoadingState {
  isLoading: boolean;
  message?: string;
  subtext?: string;
  badge?: string;
}

interface LoadingContextType {
  isLoading: boolean;
  message?: string;
  subtext?: string;
  badge?: string;
  showLoader: (message?: string, subtext?: string, badge?: string) => void;
  hideLoader: () => void;
  withLoader: <T>(
    action: Promise<T> | (() => Promise<T>),
    message?: string,
    subtext?: string,
    badge?: string
  ) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    message: undefined,
    subtext: undefined,
    badge: undefined,
  });

  // Track active count for nested/concurrent async calls
  const activeCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideLoader = useCallback(() => {
    activeCountRef.current = Math.max(0, activeCountRef.current - 1);
    if (activeCountRef.current === 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setState({ isLoading: false, message: undefined, subtext: undefined, badge: undefined });
    }
  }, []);

  const showLoader = useCallback((message?: string, subtext?: string, badge?: string) => {
    activeCountRef.current += 1;
    setState({
      isLoading: true,
      message: message || 'Loading...',
      subtext,
      badge: badge || 'FraudOps AI',
    });

    // Safety timeout: auto-hide after 35 seconds to avoid locking the UI indefinitely
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      console.warn('GlobalLoader safety timeout reached. Forcing dismissal.');
      activeCountRef.current = 0;
      setState({ isLoading: false, message: undefined, subtext: undefined, badge: undefined });
    }, 35000);
  }, []);

  const withLoader = useCallback(
    async <T,>(
      action: Promise<T> | (() => Promise<T>),
      message?: string,
      subtext?: string,
      badge?: string
    ): Promise<T> => {
      showLoader(message, subtext, badge);
      try {
        const promise = typeof action === 'function' ? action() : action;
        return await promise;
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader]
  );

  return (
    <LoadingContext.Provider
      value={{
        isLoading: state.isLoading,
        message: state.message,
        subtext: state.subtext,
        badge: state.badge,
        showLoader,
        hideLoader,
        withLoader,
      }}
    >
      {children}
      {state.isLoading && (
        <GlobalLoader
          overlay
          size="lg"
        />
      )}
    </LoadingContext.Provider>
  );
};

export const useGlobalLoader = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useGlobalLoader must be used within a LoadingProvider');
  }
  return context;
};

export default LoadingContext;
