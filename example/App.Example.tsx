import {CountryCode} from 'plaid';
import * as React from 'react';
import {Button, StyleSheet, View} from 'react-native';

import {
  PlaidLinkStage,
  PlaidProviderLinkWebView,
  usePlaidLinkState,
} from 'react-native-use-plaid';

export const AppExample = React.memo(
  function AppExample({
    client_user_id,
  }: {
    readonly client_user_id: string;
  }): JSX.Element {
    const [
      state,
      {connect, client, disconnect},
    ] = usePlaidLinkState({client_user_id});

    const onPressConnect = React.useCallback(() => connect({
      country_codes: [CountryCode.Gb],
      language: 'en',
    }), [connect]);

    const onListTransactions = React.useCallback(async () => {
      try {
        const {stage} = state;

        if (stage !== PlaidLinkStage.SUCCESS)
          throw new Error(`Expected "${PlaidLinkStage.SUCCESS}", encountered "${PlaidLinkStage.ERROR}".`);

        const {access_token} = state;

        const {data} = await client.transactionsGet({
          access_token,
          start_date: "2018-01-01",
          end_date: "2018-02-01",
        });

        console.warn(JSON.stringify(data));
      } catch (e) {
        console.error(e);
      }
    }, [client, client_user_id, state]);

    const onPressDisconnect = React.useCallback(
      () => disconnect({client_user_id}),
      [disconnect, client_user_id]
    );

    const {stage} = state;

    return (
      <View style={StyleSheet.absoluteFill}>
        {[
          PlaidLinkStage.INITIALIZE,
          PlaidLinkStage.REINITIALIZE,
          PlaidLinkStage.ERROR,
        ].includes(stage) ? (
          <PlaidProviderLinkWebView
            client_user_id={client_user_id}
            style={styles.link}
          />
        ) : (
          <View style={StyleSheet.absoluteFill}>
            <View style={[styles.flex, styles.center]}>
              <Button
                onPress={stage === PlaidLinkStage.SUCCESS ? onListTransactions : onPressConnect}
                title={stage}
              />
              {stage === PlaidLinkStage.SUCCESS && (
                <Button title="Disconnect" onPress={onPressDisconnect} />
              )}
            </View>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  bottomRight: {alignItems: 'flex-end', justifyContent: 'flex-end'},
  center: {alignItems: 'center', justifyContent: 'center'},
  flex: {flex: 1},
  link: {marginTop: 55, marginBottom: 10},
});
