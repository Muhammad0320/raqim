"use client";

import React, { createContext, useContext } from 'react';

interface DocsContextType {
  tenantAlias: string;
  licenseKey: string;
  planTier: string;
}

const DocsContext = createContext<DocsContextType | undefined>(undefined);

export function DocsProvider({ 
  children, 
  tenantAlias, 
  licenseKey,
  planTier
}: { 
  children: React.ReactNode;
  tenantAlias: string;
  licenseKey: string;
  planTier: string;
}) {
  return (
    <DocsContext.Provider value={{ tenantAlias, licenseKey, planTier }}>
      {children}
    </DocsContext.Provider>
  );
}

export function useDocsContext() {
  const context = useContext(DocsContext);
  if (context === undefined) {
    throw new Error('useDocsContext must be used within a DocsProvider');
  }
  return context;
}
