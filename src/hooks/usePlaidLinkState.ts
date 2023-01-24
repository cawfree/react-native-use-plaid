import {LinkTokenCreateRequest, Products} from 'plaid';
import * as React from 'react';

import {
  MaybeClientUserId,
  PlaidConfigOnDisconnectParams,
  PlaidLinkErrorState,
  PlaidLinkGetTokenState,
  PlaidLinkStage,
  PlaidLinkState,
  PlaidLinkStateResultOptionsConnect,
  PlaidLinkStateResultOptionsConnectParams,
  UsePlaidLinkStateResult
} from '../@types';
import {usePlaidContext} from '../contexts';

const ERROR_INVALID_USER_ID_STATE: PlaidLinkErrorState = {
  stage: PlaidLinkStage.ERROR,
  error: new Error('Invalid client_user_id.'),
};

const GET_TOKEN_STATE: PlaidLinkGetTokenState = {
  stage: PlaidLinkStage.GET_TOKEN,
};

export function usePlaidLinkState({client_user_id}: MaybeClientUserId): UsePlaidLinkStateResult {
  const {
    client_name,
    redirect_uri,
    client,
    clientUserIdToPlaidLinkState,
    updateLinkState,
  } = usePlaidContext();

  const state = React.useMemo<PlaidLinkState>(
    () => {
      if (typeof client_user_id !== 'string' || !client_user_id.length)
        return ERROR_INVALID_USER_ID_STATE;

      const maybePlaidLinkState = clientUserIdToPlaidLinkState[client_user_id];

      return maybePlaidLinkState ?? GET_TOKEN_STATE;
    },
    [clientUserIdToPlaidLinkState, client_user_id]
  );

  const connect: PlaidLinkStateResultOptionsConnect = React.useCallback(
    async ({
      products = [Products.Auth, Products.Transactions],
      country_codes,
      language,
    }: PlaidLinkStateResultOptionsConnectParams): Promise<void> => {
      if (typeof client_user_id !== 'string' || !client_user_id.length)
        throw new Error(`Expected non-empty string client_user_id, encountered "${
          String(client_user_id)
        }".`);

      const request: LinkTokenCreateRequest = {
        user: {client_user_id},
        client_name,
        products,
        country_codes,
        language,
        redirect_uri,
      };

      try {
        const {data: {link_token}} = await client.linkTokenCreate(request);
        updateLinkState(
          client_user_id,
          {
            stage: PlaidLinkStage.INITIALIZE,
            link_token,
          }
        );
      } catch (cause) {
        updateLinkState(
          client_user_id,
          {
            stage: PlaidLinkStage.ERROR,
            error: new Error('Failed to link.', {cause}),
          }
        );
      }
    },
    [
      client,
      client_user_id,
      redirect_uri,
      client_name,
      updateLinkState,
    ],
  );

  const disconnect = React.useCallback(
    ({client_user_id}: PlaidConfigOnDisconnectParams) => {
      if (typeof client_user_id !== 'string' || !client_user_id.length) return;
      updateLinkState(client_user_id, {stage: PlaidLinkStage.GET_TOKEN});
    },
    [updateLinkState]
  );

  return [state, {connect, client, disconnect}];
}
