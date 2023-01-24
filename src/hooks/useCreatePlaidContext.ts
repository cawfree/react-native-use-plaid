import {PlaidApi} from 'plaid';
import * as React from 'react';

import {
  ClientUserIdToAccessToken,
  ClientUserIdToPlaidLinkState,
  PlaidConfigOnConnect,
  PlaidConfigOnDisconnect,
  PlaidContextValue,
  PlaidLinkStage,
  PlaidLinkState,
  UpdateLinkState
} from '../@types';

import {useOnConnectionStateChanged} from './useOnConnectionStateChanged';

export function useCreatePlaidContext({
  onConnect,
  onDisconnect,
  initialAccessTokens,
  client_name,
  client,
  redirect_uri = 'https://cdn.plaid.com/link/v2/stable/link.html',
}: {
  readonly onConnect?: PlaidConfigOnConnect;
  readonly onDisconnect?: PlaidConfigOnDisconnect;
  readonly initialAccessTokens?: ClientUserIdToAccessToken;
  readonly client_name: string;
  readonly client: PlaidApi;
  readonly redirect_uri?: string;
}): PlaidContextValue {
  const [
    clientUserIdToPlaidLinkState,
    setClientUserIdToPlaidLinkState
  ] = React.useState<ClientUserIdToPlaidLinkState>(
    // If the caller has defined some accessTokens on launch,
    // we can automatically initialize the state to enable
    // immediate access.
    Object.entries(initialAccessTokens || {})
     .reduce<ClientUserIdToPlaidLinkState>(
       (res, [clientUserId, accessToken]) => ({
         ...res,
         [clientUserId]: {
           stage: PlaidLinkStage.SUCCESS,
           access_token: accessToken,
         },
       }),
       {},
     ),
  );

  const updateLinkState: UpdateLinkState = React.useCallback(
    (client_user_id: string, state: PlaidLinkState) => void (async () => {
      const {stage} = state;

      if (stage !== PlaidLinkStage.EXCHANGE) return setClientUserIdToPlaidLinkState(
        (currentStates) => ({
          ...currentStates,
          [client_user_id]: state,
        }),
      );

      try {
        const {public_token} = state;
        const {data: {access_token}} = await client.itemPublicTokenExchange({
          public_token,
        });

        __DEV__ && console.log(access_token);

        updateLinkState(
          client_user_id,
          {
            stage: PlaidLinkStage.SUCCESS,
            access_token,
          },
        );
      } catch (cause) {

        updateLinkState(
          client_user_id,
          {
            stage: PlaidLinkStage.ERROR,
            error: new Error('Failed to exchange token.', {cause}),
          }
        );
      }
    })(),
    [client],
  );

  useOnConnectionStateChanged({
    clientUserIdToPlaidLinkState,
    onConnect,
    onDisconnect,
  });

  return React.useMemo<PlaidContextValue>(() => ({
    client,
    redirect_uri,
    clientUserIdToPlaidLinkState,
    client_name,
    updateLinkState,
  }), [
    client,
    redirect_uri,
    clientUserIdToPlaidLinkState,
    client_name,
    updateLinkState,
  ]);
}
