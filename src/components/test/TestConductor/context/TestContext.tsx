import React, { createContext, useContext, ReactNode } from 'react';
import { useTest } from '../hooks/useTest';
import { Test } from '../hooks/useTest';

type TestContextType = ReturnType<typeof useTest> & {
  test: Test | null;
  loading: boolean;
  error: Error | null;
};

const TestContext = createContext<TestContextType | undefined>(undefined);

type TestProviderProps = {
  testId: string;
  children: ReactNode;
};

export const TestProvider: React.FC<TestProviderProps> = ({ testId, children }) => {
  const testState = useTest(testId);
  
  return (
    <TestContext.Provider value={testState}>
      {children}
    </TestContext.Provider>
  );
};

export const useTestContext = (): TestContextType => {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error('useTestContext must be used within a TestProvider');
  }
  return context;
};

export default TestContext;
