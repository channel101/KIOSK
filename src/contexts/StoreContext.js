import { createContext, useContext, useState, useMemo } from 'react';

const StoreContext = createContext({
  storeNumber: null,
  setStoreNumber: () => {},
});

export function StoreProvider({ children }) {
  const [storeNumber, setStoreNumber] = useState(null);

  const value = useMemo(() => ({ storeNumber, setStoreNumber }), [storeNumber]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
