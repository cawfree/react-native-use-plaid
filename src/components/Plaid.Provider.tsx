import * as React from 'react';
import {Configuration, PlaidApi, PlaidEnvironments} from 'plaid';

import {PlaidConfig} from '../@types';
import {PlaidContextProvider} from '../contexts';
import {useCreatePlaidContext} from '../hooks';

export type PlaidProviderProps = PlaidConfig;

export const PlaidProvider = React.memo(
  function PlaidProvider({
    onConnect,
    onDisconnect,
    basePath,
    children,
    clientId,
    clientSecret,
    redirectUri,
    clientName,
    initialAccessTokens,
  }: React.PropsWithChildren<PlaidProviderProps>): JSX.Element {

    const client = React.useMemo(() => new PlaidApi(
      new Configuration({
        basePath: PlaidEnvironments[basePath],
        baseOptions: {
          headers: {'PLAID-CLIENT-ID': clientId, 'PLAID-SECRET': clientSecret},
        },
      }),
    ), [clientId, clientSecret, basePath]);

    return (
      <PlaidContextProvider
        children={children}
        value={useCreatePlaidContext({
          initialAccessTokens,
          client,
          redirect_uri: redirectUri,
          client_name: clientName,
          onConnect,
          onDisconnect,
        })}
      />
    );
  }
);
