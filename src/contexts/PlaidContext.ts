import * as React from 'react';

import {PlaidContextValue} from '../@types';

const PlaidContext = React.createContext<PlaidContextValue | null>(null);

export const PlaidContextProvider = PlaidContext.Provider;

export function usePlaidContext(): PlaidContextValue {
  const maybeContext = React.useContext(PlaidContext);

  if (!maybeContext)
    throw new Error('It looks like you\'ve forgotten to declare a <PlaidContextProvider />.');

  return maybeContext;
}
