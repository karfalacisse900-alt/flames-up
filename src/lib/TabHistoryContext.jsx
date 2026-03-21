import React, { createContext, useContext, useState, useCallback } from 'react';

const TabHistoryContext = createContext();

export function TabHistoryProvider({ children }) {
  const [tabHistory, setTabHistory] = useState({
    Home: ['/Home'],
    Places: ['/Places'],
    Discover: ['/Discover'],
    Groups: ['/Groups'],
    Profile: ['/Profile'],
  });

  const updateTabHistory = useCallback((tabName, path) => {
    setTabHistory(prev => ({
      ...prev,
      [tabName]: prev[tabName]?.includes(path) 
        ? prev[tabName] 
        : [...(prev[tabName] || []), path],
    }));
  }, []);

  const getTabHistory = useCallback((tabName) => {
    return tabHistory[tabName] || ['/Home'];
  }, [tabHistory]);

  const clearTabHistory = useCallback((tabName) => {
    const defaultPaths = {
      Home: '/Home',
      Places: '/Places',
      Discover: '/Discover',
      Groups: '/Groups',
      Profile: '/Profile',
    };
    setTabHistory(prev => ({
      ...prev,
      [tabName]: [defaultPaths[tabName]],
    }));
  }, []);

  return (
    <TabHistoryContext.Provider value={{ tabHistory, updateTabHistory, getTabHistory, clearTabHistory }}>
      {children}
    </TabHistoryContext.Provider>
  );
}

export function useTabHistory() {
  const context = useContext(TabHistoryContext);
  if (!context) {
    throw new Error('useTabHistory must be used within TabHistoryProvider');
  }
  return context;
}