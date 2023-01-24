import * as React from 'react';

import {
  ClientUserIdToPlaidLinkState,
  PlaidConfigOnConnect,
  PlaidConfigOnDisconnect,
  PlaidLinkStage,
} from '../@types';

const findClientUserIdsWithAccessTokens = (
  clientUserIdToPlaidLinkState: ClientUserIdToPlaidLinkState
) => Object.entries(clientUserIdToPlaidLinkState)
  .flatMap(
    ([client_user_id, e]) =>
      e.stage === PlaidLinkStage.SUCCESS ? [{client_user_id, access_token: e.access_token}]: []
  );

export function useOnConnectionStateChanged({
  clientUserIdToPlaidLinkState,
  onConnect,
  onDisconnect,
}: {
  readonly clientUserIdToPlaidLinkState: ClientUserIdToPlaidLinkState;
  readonly onConnect?: PlaidConfigOnConnect;
  readonly onDisconnect?: PlaidConfigOnDisconnect;
}) {

  const clientUserIdsWithAccessTokens = findClientUserIdsWithAccessTokens(clientUserIdToPlaidLinkState);
  const clientUserIdsWithAccessTokensIds =
    clientUserIdsWithAccessTokens.map(({client_user_id}) => client_user_id);

  const latchClientUserIdsWithAccessTokensIds = React.useRef<readonly string[]>(clientUserIdsWithAccessTokensIds);

  const {current: lastClientUserIdsWithAccessTokensIds} = latchClientUserIdsWithAccessTokensIds;

  latchClientUserIdsWithAccessTokensIds.current = clientUserIdsWithAccessTokensIds;

  const added = clientUserIdsWithAccessTokensIds
    .filter(e => !lastClientUserIdsWithAccessTokensIds.includes(e));

  const removed = lastClientUserIdsWithAccessTokensIds
    .filter(e => !clientUserIdsWithAccessTokensIds.includes(e));

  onConnect && clientUserIdsWithAccessTokens
    .filter(({client_user_id}) => added.includes(client_user_id))
    .forEach(onConnect);

  removed.forEach(client_user_id => onDisconnect?.({client_user_id}));

}

