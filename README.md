# [`react-native-use-plaid`](https://npmjs.com/package/react-native-use-plaid)
⚛️ 💸 Simple hooks for [__Plaid__](https://plaid.com/) open banking on [__React Native__](https://reactnative.dev), which enables you to very quickly integrate with a user's bank account via a user-friendly onboarding process. What's contained here is the raw logic; you can customize the generic hooks arbitrarily for your own applications, navigation state and user journeys.

## 🚀 Getting Started

Using [__Yarn__](https://yarnpkg.com/):

```shell
yarn add react-native-use-plaid react-native-webview
```
This project depends on the [`react-native-webview`](https://github.com/react-native-webview/react-native-webview) Native Module.

> For vanilla React Native projects, you can install this as usual with `yarn add react-native-webview`. For [__Expo__](https://expo.dev/), you can use `npx expo install react-native-webview`.

## ✍️ Usage

This package manages user bank authentication using [__Plaid Link__](https://plaid.com/docs/link/), which is used to orchestrate the authentication and  permissions process necessary to interact with a user's bank account, to do things like [__view their transaction history__](https://plaid.com/products/transactions/) or [__request a payment__](https://plaid.com/en-gb/use-cases/payments/).

We provide the appropriate life cycle hooks to easily initiate, persist, consume and relinquish connections to user bank accounts. Additionally, all user-facing onboarding has been expressed using Plaid's [`WebView`](https://github.com/react-native-webview/react-native-webview)-optimized onboarding process, making the integration process as straight-forward as possible.

### 1. Configuring the `<PlaidProvider />` 🔧

First you'll need to wrap your application in a `PlaidProvider`, which manages global application state for all login processes:

```typescript
import * as React from 'react';
import {PlaidProvider} from 'react-native-use-plaid';

import {MyNativeApp} from './src';

export default function App(): JSX.Element {
  return (
    <PlaidProvider
      redirectUri="https://cdn.plaid.com/link/v2/stable/link.html" /* example */
      basePath="sandbox"
      clientName="cawfree's kitchen"
      redirectUri="<your-redirect-uri>"
      clientId="<your-client-id>"
      clientSecret="<your-client-secret>">
      <MyNativeApp />
    </PlaidProvider>
  );
}
```

This part is pretty straight forward; though you'll need to head over to the [__Plaid Developer Portal__](https://dashboard.plaid.com/signup) and create some API keys for your application.

For each application instance you register on Plaid, you're going to be given three different API keys for three different environments; `sandbox`, `development` and `production`. You'll see in the example above, we've configured our `PlaidProvider`'s `basePath` to work using `sandbox` credentials.

> ⚠️ You __must__ configure a `redirectUri` for your project from your project settings in Plaid, which is configured under [__the API tab__](https://dashboard.plaid.com/team/api) in your [__Team Settings__](https://dashboard.plaid.com/team).

### 2. Connecting to accounts 👛

Once your application is wrapped in a `PlaidProvider`, you're free to start connecting with Plaid from any child component in your application.

To manage a connection, we call the `usePlaidLinkState` hook:

```typescript
import {usePlaidLinkState} from 'react-native-use-plaid';

const client_user_id = '$myApplicationSpecificUserId';

const [state] = usePlaidLinkState({client_user_id});
```

The returned `state` will delcare how far along in the connection process your user currently is.

> In Plaid, we identify users using the `client_user_id` field; this is a __unique__ identifier for an individual user native to your application stack.

To check if a `client_user_id`'s account is connected, you can use:

```typescript
import {PlaidLinkStage} from 'react-native-use-plaid';

const {stage} = state;

const isConnected = stage === PlaidLinkStage.SUCCESS;
```

When a user is connected, their `state` will contain their [__Plaid Access Token__]():

```typescript
import {PlaidLinkSuccessState} from 'react-native-use-plaid';

const {access_token} = state as PlaidLinkSuccessState;
```

The `access_token` can be used to perform operations on a user account, for example, listing their transactions using the `client` instance returned by a call to `usePlaidLinkState`:

```typescript
import {PlaidLinkStage, usePlaidLinkState} from 'react-native-use-plaid';

const [state, {client}] = usePlaidLinkState({client_user_id});

const {stage} = state;

if (stage !== PlaidLinkStage.SUCCESS) return;

const {data} = await client.authGet({
  access_token: state.access_token,
});
```

> __Note:__ If we've checked that `stage === PlaidLinkStage.SUCCESS`, it is not necessary to cast the `state` as `PlaidLinkSuccessState` since this type will be automatically inferred.

Finally, we need to see how to actually connect to a user. This is also done using the `usePlaidLinkState` hook, where we can call the `connect` function:

```typescript
import {CountryCode, Products} from 'plaid';

const [, {connect, disconnect}] = usePlaidLinkState({
  client_user_id,
});

await connect({
  country_codes: [CountryCode.Gb],
  language: 'en',
  products: [Products.Auth, Products.Transactions],
});
```

When you call `connect`, `react-native-use-plaid` will manage the entire authentication process based on the given parameters end-to-end.

There is only a single obligation you have as the implementor: you need to find somewhere to render a `PlaidProviderLinkWebView`:


```typescript
import {PlaidProviderLinkWebView} from 'react-native-use-plaid';

return (
  <PlaidProviderLinkWebView
    client_user_id="$myApplicationSpecificUserId"
  />
);
```

The `PlaidProviderLinkWebView` is the user-facing component of [__Plaid Link__](https://plaid.com/docs/link/).

All you need to do is present it; you could mount it in a [`<Modal visible />`](https://reactnative.dev/docs/modal), navigate to a dedicated screen using [`react-navigation`](https://reactnavigation.org/), you can use _any mechanism you desire_ to present this content to the user; what's important is you do render it!

Without the `PlaidProviderLinkWebView` visible to the user, they will be unable to complete the authentication process. Please check the [__example__](./example) for a simple demonstration of this concept.

### 3. Persistence 💾

Although the link process is relatively quick and simple for a user, it's something we should avoid doing too often since this inconveniences the user.

In the `PlaidProvider`, you can specify three additional properties to help you resume authentication state:

```typescript
import * as React from 'react';
import {PlaidProvider} from 'react-native-use-plaid';

export default function App(): JSX.Element {
  return (
    <PlaidProvider
      // On launch, we can synchronously resume user sessions
      // for individual users if we pass an access_token. Here
      // we can track the authentication state of multiple users.
      initialAccessTokens={React.useMemo(() => ({
        '$myApplicationSpecificUserId': 'someAccessTokenFromPreviousSession',
      }), [])}
      // When a user begins a new session, onConnect is called providing
      // the client_user_id and their access_token.
      onConnect={React.useCallback(({client_user_id, access_token}) => {
        console.log(`${client_user_id}'s access_token is "${access_token}"!`);
      }, [])}
      // When a user disconnects, `onDisconnect` is called.
      onDisconnect={React.useCallback(({client_user_id}) => {
        console.log(`${client_user_id} has disconnected.`);
      }, [])}
    />
  );
}
````

In combination with a client persistence library such as [`react-native-async-storage`](https://github.com/react-native-async-storage/async-storage) or [`react-native-mmkv`](https://github.com/mrousavy/react-native-mmkv), user session state can be stored between launches of your application.

## ✌️ License
[__MIT__](./LICENSE)
