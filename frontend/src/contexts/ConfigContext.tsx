import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NegotiationConfiguration } from '../types/negotiation';
import { apiService } from '../services/api.service';

interface ConfigContextValue {
  configurations: NegotiationConfiguration[];
  activeConfig: NegotiationConfiguration | null;
  fetchConfigurations: () => Promise<void>;
  createConfig: (config: Partial<NegotiationConfiguration>) => Promise<NegotiationConfiguration>;
  updateConfig: (id: string, config: Partial<NegotiationConfiguration>) => Promise<NegotiationConfiguration>;
  deleteConfig: (id: string) => Promise<void>;
  setActiveConfig: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [configurations, setConfigurations] = useState<NegotiationConfiguration[]>([]);
  const [activeConfig, setActiveConfigState] = useState<NegotiationConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigurations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const configs = await apiService.getConfigurations();
      setConfigurations(configs);
      const active = configs.find(c => c.isActive) || null;
      setActiveConfigState(active);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createConfig = async (config: Partial<NegotiationConfiguration>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newConfig = await apiService.createConfiguration(config);
      setConfigurations(prev => [...prev, newConfig]);
      return newConfig;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (id: string, config: Partial<NegotiationConfiguration>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedConfig = await apiService.updateConfiguration(id, config);
      setConfigurations(prev => prev.map(c => (c.id === id ? updatedConfig : c)));
      if (activeConfig?.id === id) {
        setActiveConfigState(updatedConfig);
      }
      return updatedConfig;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConfig = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiService.deleteConfiguration(id);
      setConfigurations(prev => prev.filter(c => c.id !== id));
      if (activeConfig?.id === id) {
        setActiveConfigState(null);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveConfig = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const activated = await apiService.activateConfiguration(id);
      setConfigurations(prev =>
        prev.map(c => (c.id === id ? { ...c, isActive: true } : { ...c, isActive: false }))
      );
      setActiveConfigState(activated);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfigContext.Provider
      value={{
        configurations,
        activeConfig,
        fetchConfigurations,
        createConfig,
        updateConfig,
        deleteConfig,
        setActiveConfig,
        isLoading,
        error,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
};
