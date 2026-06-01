import type { WebviewConfig } from '@cpbuddy/core';
import { createContext, type ReactNode, useContext, useEffect, useReducer } from 'react';

interface ConfigStateLoading {
  isReady: false;
  config: Partial<WebviewConfig>;
}

interface ConfigStateReady {
  isReady: true;
  config: WebviewConfig;
}

type ConfigState = ConfigStateLoading | ConfigStateReady;

const ConfigContext = createContext<ConfigState | undefined>(undefined);

const requiredKeys: (keyof WebviewConfig)[] = ['confirmSubmit', 'showAcGif', 'hiddenStatuses'];

const isConfigComplete = (config: Partial<WebviewConfig>): config is WebviewConfig => {
  return requiredKeys.every((key) => key in config && config[key] !== undefined);
};

const configReducer = (state: ConfigState, action: Partial<WebviewConfig>): ConfigState => {
  const newConfig = { ...state.config, ...action };
  if (isConfigComplete(newConfig)) return { isReady: true, config: newConfig };
  return { isReady: false, config: newConfig };
};

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(configReducer, {
    isReady: false,
    config: {},
  });

  useEffect(() => {
    const handleMessage = ({ data }: MessageEvent) => {
      if (data.type === 'CONFIG_CHANGE') dispatch(data.payload);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return <ConfigContext.Provider value={state}>{children}</ConfigContext.Provider>;
};

export const useConfigState = (): ConfigState => {
  const state = useContext(ConfigContext);
  if (state === undefined) throw new Error('useConfigState must be used within a ConfigProvider');
  return state;
};

export const useConfig = (): WebviewConfig => {
  const state = useConfigState();
  if (!state.isReady)
    throw new Error(
      'useConfig called before config is ready. Use useConfigState to check isReady first.',
    );
  return state.config;
};

export const ConfigGuard = ({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  const state = useConfigState();
  if (!state.isReady) return <>{fallback}</>;
  return <>{children}</>;
};
