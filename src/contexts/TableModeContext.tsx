import React, { createContext, useContext, useState, useEffect } from 'react';

type TableMode = 'regular' | 'itr';

interface TableModeContextType {
  mode: TableMode;
  toggleMode: () => void;
  setMode: (mode: TableMode) => void;
  isITRMode: boolean;
}

const TableModeContext = createContext<TableModeContextType | undefined>(undefined);

export const useTableMode = () => {
  const context = useContext(TableModeContext);
  if (context === undefined) {
    throw new Error('useTableMode must be used within a TableModeProvider');
  }
  return context;
};

export const TableModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Load mode from localStorage, default to 'regular'
  const [mode, setMode] = useState<TableMode>(() => {
    const saved = localStorage.getItem('table_mode');
    return (saved === 'itr' ? 'itr' : 'regular') as TableMode;
  });

  // Save to localStorage whenever mode changes
  useEffect(() => {
    localStorage.setItem('table_mode', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode(prev => (prev === 'regular' ? 'itr' : 'regular'));
  };

  const setModeDirect = (newMode: TableMode) => {
    setMode(newMode);
  };

  const value: TableModeContextType = {
    mode,
    toggleMode,
    setMode: setModeDirect,
    isITRMode: mode === 'itr',
  };

  return (
    <TableModeContext.Provider value={value}>
      {children}
    </TableModeContext.Provider>
  );
};

