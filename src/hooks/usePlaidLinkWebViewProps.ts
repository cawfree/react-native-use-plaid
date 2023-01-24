import qs from 'query-string';
import * as React from 'react';
import {WebViewProps} from 'react-native-webview';
import {ShouldStartLoadRequest} from 'react-native-webview/lib/WebViewTypes';

import {MaybeClientUserId, PlaidLinkStage} from '../@types';
import {usePlaidContext} from '../contexts';

import {usePlaidLinkState} from './usePlaidLinkState';

type Result = Required<
  Pick<
    WebViewProps,
    'source' | 'originWhitelist' | 'onShouldStartLoadWithRequest'
  >
>;

const originWhitelist: string[] = ['*'];
const baseUri = 'https://cdn.plaid.com/link/v2/stable/link.html';

const defaultShouldStartLoadWithRequest = (url: string) => !url.startsWith('plaidlink://');

export function usePlaidLinkWebViewProps({client_user_id}: MaybeClientUserId): Result {
  const {
    redirect_uri,
    updateLinkState,
  } = usePlaidContext();

  const [state] = usePlaidLinkState({
    client_user_id,
  });

  const isInError = React.useRef<boolean>(false);
  const [uri, setUri] = React.useState<string>(baseUri);

  React.useEffect(() => {
    const {stage} = state;

    if (isInError.current) return;

    if (stage === PlaidLinkStage.INITIALIZE)
      setUri(`${baseUri}?isWebview=true&token=${state.link_token}`);

    if (stage === PlaidLinkStage.REINITIALIZE)
      setUri(
        `${baseUri}?isWebview=true&token=${
          state.link_token
          }&receivedRedirectUri=${
          encodeURIComponent(`${
            redirect_uri
          }?oauth_state_id=${
            state.oauth_state_id
          }`)
        }`
      );
  }, [state, redirect_uri]);

  const onShouldStartLoadWithRequest: WebViewProps['onShouldStartLoadWithRequest'] = React.useCallback(
    (req: ShouldStartLoadRequest) => {
      const {stage} = state;
      const {url, query} = qs.parseUrl(req.url);

      __DEV__ && console.log(url, query);

      const hasClient = typeof client_user_id === 'string';

      if (!hasClient) return defaultShouldStartLoadWithRequest(url);

      if (url.trim() === 'plaidlink://exit') {
        updateLinkState(client_user_id, {stage: PlaidLinkStage.GET_TOKEN});
      } else if (stage === PlaidLinkStage.INITIALIZE) {
        const {link_token} = state;

        const oauth_state_id = query?.oauth_state_id;
        const redirected = url === redirect_uri;

        const hasAuth = typeof oauth_state_id === 'string';

        if (isInError.current) return defaultShouldStartLoadWithRequest(url);

        hasAuth && redirected && updateLinkState(
          client_user_id,
          {stage: PlaidLinkStage.REINITIALIZE, link_token, oauth_state_id},
        );

      } else if (url === 'plaidlink://connected') {
        const account_id = query?.account_id;
        const account_name = query?.account_name;
        const institution_id = query?.institution_id;
        const institution_name = query?.institution_name;
        const public_token = query?.public_token;

        const hasAccountId = typeof account_id === 'string' && !!account_id.length;
        const hasAccountName = typeof account_name === 'string' && !!account_name.length;
        const hasInstitutionId = typeof institution_id === 'string' && !!institution_id.length;
        const hasInstitutionName = typeof institution_name === 'string' && !!institution_name.length;
        const hasPublicToken = typeof public_token === 'string' && !!public_token.length;

        const hasAllDeps = hasClient && hasAccountId && hasAccountName && hasInstitutionId && hasInstitutionName && hasPublicToken;

        if (hasAllDeps) {
          updateLinkState(
            client_user_id,
            {
              stage: PlaidLinkStage.EXCHANGE,
              account_id,
              account_name,
              institution_id,
              institution_name,
              public_token,
            },
          );
        } else {
          updateLinkState(
            client_user_id,
            {stage: PlaidLinkStage.ERROR, error: new Error(`Missing dependencies.`)},
          );
        }
      } else if (url === 'plaidlink://event') {
        const event_name = query?.event_name;
        const view_name = query?.view_name;
        const error_code = query?.error_code;
        const error_message = query?.error_message;

        const hasError = typeof error_code === 'string' && !!error_code.length;
        const hasErrorMessage = typeof error_message === 'string' && !!error_message.length;

        if (hasError) isInError.current = true;

        if (isInError.current && event_name === 'TRANSITION_VIEW' && view_name === 'SELECT_INSTITUTION') {

          const discardError = () => isInError.current = false;

          const hasLinkToken = 'link_token' in state && typeof state.link_token === 'string';

          if (hasLinkToken) {
            updateLinkState(
              client_user_id,
              {stage: PlaidLinkStage.INITIALIZE, link_token: state.link_token}
            );
          } else {
            updateLinkState(
              client_user_id,
              {
                stage: PlaidLinkStage.ERROR,
                error: hasErrorMessage
                  ? new Error(error_message)
                  : new Error(`Plaid link failed with error ${error_code}.`),
              },
            );
          }

          requestAnimationFrame(discardError);
        }
      }
      return defaultShouldStartLoadWithRequest(url);
    },
    [state, client_user_id]
  );

  const source = React.useMemo(() => ({uri}), [uri]);

  return React.useMemo<Result>(() => ({
    source,
    onShouldStartLoadWithRequest,
    originWhitelist,
  }), [onShouldStartLoadWithRequest, source]);
}
