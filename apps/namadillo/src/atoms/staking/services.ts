import { DefaultApi, Reward } from "@namada/indexer-client";
import {
  BondProps,
  ClaimRewardsProps,
  RedelegateProps,
  TxProps,
  UnbondProps,
  WithdrawProps,
  WrapperTxProps,
} from "@namada/sdk-multicore";
import { Account } from "@namada/types";
import { queryClient } from "App/Common/QueryProvider";
import { EncodedTxData, buildTx } from "lib/query";
import { Address, AddressBalance, ChainSettings, GasConfig } from "types";
import { getSdkInstance } from "utils/sdk";

const DEFAULT_MEMO = "Namadillo 5ElementsNodes";
const normalizeMemo = (m?: string | null): string => {
  const trimmed = typeof m === "string" ? m.trim() : "";
  return trimmed !== "" ? trimmed : DEFAULT_MEMO;
};

export const fetchClaimableRewards = async (
  api: DefaultApi,
  address: Address
): Promise<Reward[]> => {
  const response = await api.apiV1PosRewardAddressGet(address);
  return response.data;
};

export const createBondTx = async (
  chain: ChainSettings,
  account: Account,
  bondProps: BondProps[],
  gasConfig: GasConfig,
  memo?: string
): Promise<EncodedTxData<BondProps> | undefined> => {
  const sdk = await getSdkInstance();
  return await buildTx(
    sdk,
    account,
    gasConfig,
    chain,
    bondProps,
    sdk.tx.buildBond,
    normalizeMemo(memo)
  );
};

export const createUnbondTx = async (
  chain: ChainSettings,
  account: Account,
  unbondProps: UnbondProps[],
  gasConfig: GasConfig,
  memo?: string
): Promise<EncodedTxData<UnbondProps>> => {
  const sdk = await getSdkInstance();
  return await buildTx(
    sdk,
    account,
    gasConfig,
    chain,
    unbondProps,
    sdk.tx.buildUnbond,
    normalizeMemo(memo)
  );
};

export const createReDelegateTx = async (
  chain: ChainSettings,
  account: Account,
  redelegateProps: RedelegateProps[],
  gasConfig: GasConfig,
  memo?: string
): Promise<EncodedTxData<RedelegateProps>> => {
  const sdk = await getSdkInstance();
  return await buildTx(
    sdk,
    account,
    gasConfig,
    chain,
    redelegateProps,
    sdk.tx.buildRedelegate,
    normalizeMemo(memo)
  );
};

export const createWithdrawTx = async (
  chain: ChainSettings,
  account: Account,
  withdrawProps: WithdrawProps[],
  gasConfig: GasConfig,
  memo?: string
): Promise<EncodedTxData<WithdrawProps>> => {
  const sdk = await getSdkInstance();
  return await buildTx(
    sdk,
    account,
    gasConfig,
    chain,
    withdrawProps,
    sdk.tx.buildWithdraw,
    normalizeMemo(memo)
  );
};

export const createClaimTx = async (
  chain: ChainSettings,
  account: Account,
  params: ClaimRewardsProps[],
  gasConfig: GasConfig,
  memo?: string
): Promise<EncodedTxData<ClaimRewardsProps>> => {
  const sdk = await getSdkInstance();
  return await buildTx(
    sdk,
    account,
    gasConfig,
    chain,
    params,
    sdk.tx.buildClaimRewards,
    normalizeMemo(memo)
  );
};

export const createClaimAndStakeTx = async (
  chain: ChainSettings,
  account: Account,
  params: ClaimRewardsProps[],
  claimableRewardsByValidator: AddressBalance,
  gasConfig: GasConfig,
  memo?: string
): Promise<EncodedTxData<ClaimRewardsProps>> => {
  const sdk = await getSdkInstance();
  const normalizedMemo = normalizeMemo(memo);

  // BuildTx wrapper to handle different commitment types
  const buildClaimRewardsAndStake = async (
    wrapperTxProps: WrapperTxProps,
    props: ClaimRewardsProps | BondProps
  ): Promise<TxProps> => {
    // imponiamo anche qui il memo, nel caso il wrapper di buildTx non lo faccia
    const wrapperWithMemo: WrapperTxProps = {
      ...wrapperTxProps,
      memo: normalizedMemo,
    };

    if ("amount" in props) {
      // force nel caso balance < rewards
      wrapperWithMemo.force = true;
      return sdk.tx.buildBond(wrapperWithMemo, props as BondProps);
    } else {
      return sdk.tx.buildClaimRewards(
        wrapperWithMemo,
        props as ClaimRewardsProps
      );
    }
  };

  // ordine: prima claim, poi bond
  const claimAndStakingParams: (ClaimRewardsProps | BondProps)[] =
    Array.from(params);

  params.forEach((claimParam) => {
    const { validator, source } = claimParam;
    if (claimableRewardsByValidator.hasOwnProperty(validator)) {
      claimAndStakingParams.push({
        amount: claimableRewardsByValidator[validator],
        source,
        validator,
      } as BondProps);
    }
  });

  return await buildTx(
    sdk,
    account,
    gasConfig,
    chain,
    claimAndStakingParams,
    buildClaimRewardsAndStake,
    normalizedMemo
  );
};

export const clearClaimRewards = (accountAddress: string): void => {
  const emptyClaimRewards = {};
  queryClient.setQueryData(
    ["claim-rewards", accountAddress],
    () => emptyClaimRewards
  );
};

export const simulateShieldedRewards = async (
  chainId: string,
  token: string,
  amount: string = "0"
): Promise<string> => {
  const sdk = await getSdkInstance();
  return await sdk.rpc.simulateShieldedRewards(chainId, token, amount);
};
