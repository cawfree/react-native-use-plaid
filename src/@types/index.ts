import {CountryCode, PlaidApi, Products} from 'plaid';

export type PlaidEnvironmentType = 'production' | 'sandbox' | 'development';

export enum PlaidLinkStage {
  GET_TOKEN = 'GET_TOKEN',
  INITIALIZE = 'INITIALIZE',
  REINITIALIZE = 'REINITIALIZE',
  EXCHANGE = 'EXCHANGE',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

type AbstractPlaidLinkState<Stage extends PlaidLinkStage> = {
  readonly stage: Stage;
};

export type PlaidLinkGetTokenState = AbstractPlaidLinkState<PlaidLinkStage.GET_TOKEN>;

export type PlaidLinkInitializeState = AbstractPlaidLinkState<PlaidLinkStage.INITIALIZE> & {
  readonly link_token: string;
};

export type PlaidLinkReinitializeState = AbstractPlaidLinkState<PlaidLinkStage.REINITIALIZE> & {
  readonly link_token: string;
  readonly oauth_state_id: string;
};

export type PlaidLinkExchangeState = AbstractPlaidLinkState<PlaidLinkStage.EXCHANGE> & {
  readonly account_id: string;
  readonly account_name: string;
  readonly institution_id: string;
  readonly institution_name: string;
  readonly public_token: string;
};

export type PlaidLinkSuccessState = AbstractPlaidLinkState<PlaidLinkStage.SUCCESS> & {
  readonly access_token: string;
};

export type PlaidLinkErrorState = AbstractPlaidLinkState<PlaidLinkStage.ERROR> & {
  readonly error: Error;
};

export type PlaidLinkState =
  | PlaidLinkGetTokenState
  | PlaidLinkInitializeState
  | PlaidLinkReinitializeState
  | PlaidLinkExchangeState
  | PlaidLinkSuccessState
  | PlaidLinkErrorState;

export type ClientUserIdToPlaidLinkState = Record<string, PlaidLinkState>;
export type ClientUserIdToAccessToken = Record<string, string>;

export type MaybeClientUserId = {
  readonly client_user_id?: string | null;
};

export type PlaidConfig = {
  readonly basePath: PlaidEnvironmentType;
  readonly clientName: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri?: string;
  readonly initialAccessTokens?: ClientUserIdToAccessToken;
  readonly onConnect?: PlaidConfigOnConnect;
  readonly onDisconnect?: PlaidConfigOnDisconnect;
};

export type UpdateLinkState = (client_user_id: string, state: PlaidLinkState) => void;

export type PlaidContextValue = {
  readonly client_name: string;
  readonly client: PlaidApi;
  readonly redirect_uri: string;
  readonly clientUserIdToPlaidLinkState: ClientUserIdToPlaidLinkState;
  readonly updateLinkState: UpdateLinkState;
};

export type PlaidLinkStateResultOptionsConnectParams = {
  readonly products?: Products[];
  readonly country_codes: CountryCode[];
  readonly language: string;
};

export type PlaidLinkStateResultOptionsConnect = (
  params: PlaidLinkStateResultOptionsConnectParams
) => Promise<void>;

export type PlaidConfigOnDisconnectParams = Required<MaybeClientUserId>;

export type PlaidLinkStateResultOptionsDisconnect =
  (params: PlaidConfigOnDisconnectParams) => void;

export type PlaidConfigOnConnectParams = Required<MaybeClientUserId> & {
  readonly access_token: string;
};

export type PlaidConfigOnConnect = (params: PlaidConfigOnConnectParams) => void;

export type PlaidConfigOnDisconnect = PlaidLinkStateResultOptionsDisconnect;

export type PlaidLinkStateResultOptions = {
  readonly connect: PlaidLinkStateResultOptionsConnect;
  readonly disconnect: PlaidLinkStateResultOptionsDisconnect;
  readonly client: PlaidApi;
};

export type UsePlaidLinkStateResult = readonly [
  state: PlaidLinkState,
  options: PlaidLinkStateResultOptions,
];
