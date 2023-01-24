import 'react-native-url-polyfill/auto';

import * as React from 'react';
import Constants from 'expo-constants';

import {PlaidProvider} from 'react-native-use-plaid';

import {AppExample} from './App.Example';

const client_user_id = '$myCustomUserId';

export default function App() {
  // NOTE: This assumes you've registered the redirectUri
  //       "https://cdn.plaid.com/link/v2/stable/link.html"
  //       in your project settings.
  return (
    <PlaidProvider
      basePath="sandbox"
      clientName="My Plaid App"
      clientId={Constants.expoConfig!.extra!.CLIENT_ID}
      clientSecret={Constants.expoConfig!.extra!.CLIENT_SECRET}>
      <AppExample client_user_id={client_user_id} />
    </PlaidProvider>
  );
}

