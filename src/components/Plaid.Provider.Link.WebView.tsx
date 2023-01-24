import * as React from 'react';
import {WebView, WebViewProps} from 'react-native-webview';

import {MaybeClientUserId} from '../@types';
import {usePlaidLinkWebViewProps} from '../hooks';

export type PlaidProviderLinkWebViewProps = MaybeClientUserId & Omit<
  WebViewProps,
  keyof ReturnType<typeof usePlaidLinkWebViewProps>
>;

export const PlaidProviderLinkWebView = React.memo(
  function PlaidProviderLinkWebView({
    client_user_id,
    ...extras
  }: PlaidProviderLinkWebViewProps): JSX.Element {
    return (
      <WebView
        scalesPageToFit={false}
        pullToRefreshEnabled={false}
        setBuiltInZoomControls={false}
        {...extras}
        {...usePlaidLinkWebViewProps({client_user_id})}
      />
    );
  }
);
