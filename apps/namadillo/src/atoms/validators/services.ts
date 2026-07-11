import {
  DefaultApi,
  VotingPower as IndexerVotingPower,
  MergedBond,
  Unbond,
  VotingPower,
} from "@namada/indexer-client";
import { Account } from "@namada/types";
import { ChainParameters, Validator } from "types";
import { toValidator } from "./functions";

export const fetchVotingPower = async (
  api: DefaultApi
): Promise<VotingPower> => {
  const response = await api.apiV1PosVotingPowerGet();
  return response.data;
};

export const fetchAllValidators = async (
  api: DefaultApi,
  chainParameters: ChainParameters,
  votingPower: IndexerVotingPower
): Promise<Validator[]> => {
  const nominalApr = chainParameters.apr;
  const validatorsResponse = await api.apiV1PosValidatorAllGet();
  const validators = validatorsResponse.data;
  return validators.map((v) =>
    toValidator(v, votingPower, chainParameters.unbondingPeriod, nominalApr)
  );
};

const toNumber = (v: unknown, fallback: number): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
};

export const fetchMyBondedAmounts = async (
  api: DefaultApi,
  account: Account
): Promise<MergedBond[]> => {
  const all: MergedBond[] = [];
  let page = 1;
  const MAX_PAGES = 10_000;

  while (page <= MAX_PAGES) {
    const resp = await api.apiV1PosMergedBondsAddressGet(account.address, page);

    const results: MergedBond[] = resp.data?.results ?? [];
    all.push(...results);

    const totalPages = toNumber(resp.data?.pagination?.totalPages, 1);
    if (page >= totalPages) break;

    page += 1;
  }

  return all;
};

export const fetchMyUnbondedAmounts = async (
  api: DefaultApi,
  account: Account
): Promise<Unbond[]> => {
  const all: Unbond[] = [];
  let page = 1;
  const MAX_PAGES = 10_000;

  while (page <= MAX_PAGES) {
    const resp = await api.apiV1PosMergedUnbondsAddressGet(
      account.address,
      page
    );

    const results: Unbond[] = resp.data?.results ?? [];
    all.push(...results);

    const totalPages = toNumber(resp.data?.pagination?.totalPages, 1);
    if (page >= totalPages) break;

    page += 1;
  }

  return all;
};
