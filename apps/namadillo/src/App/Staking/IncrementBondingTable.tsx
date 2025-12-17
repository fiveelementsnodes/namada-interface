import { TableRow } from "@namada/components";
import { formatPercentage } from "@namada/utils";
import { IconTooltip } from "App/Common/IconTooltip";
import { NamCurrency } from "App/Common/NamCurrency";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useValidatorTableSorting } from "hooks/useValidatorTableSorting";
import { FaExclamation } from "react-icons/fa6";
import { IoWarning } from "react-icons/io5";
import { Validator } from "types";
import { AmountField } from "./AmountField";
import { ValidatorCard } from "./ValidatorCard";
import { ValidatorsTable } from "./ValidatorsTable";
import { useMemo } from "react";

type IncrementBondingTableProps = {
  validators: Validator[];
  updatedAmountByAddress: Record<string, BigNumber>;
  stakedAmountByAddress: Record<string, BigNumber>;
  topValidatorsByRank: string[];
  onChangeValidatorAmount: (validator: Validator, amount?: BigNumber) => void;
  resultsPerPage?: number;
  filterByAddress?: string;
};

export const IncrementBondingTable = ({
  validators,
  updatedAmountByAddress,
  stakedAmountByAddress,
  topValidatorsByRank,
  onChangeValidatorAmount,
  resultsPerPage = 10,
}: IncrementBondingTableProps): JSX.Element => {
  const SPECIAL_VALIDATOR_ADDRESS = "tnam1qx4ztg0ca0tu2aw056ksuek5y58tmg454shk6svw";

  const { sortableColumns, sortedValidators } = useValidatorTableSorting({
    validators: validators,
    stakedAmountByAddress,
  });

  // Sposta il validatore speciale in prima posizione
  const sortedValidatorsWithSpecialFirst = useMemo(() => {
    const special = sortedValidators.filter(
      (validator) => validator.address === SPECIAL_VALIDATOR_ADDRESS
    );
    const rest = sortedValidators.filter(
      (validator) => validator.address !== SPECIAL_VALIDATOR_ADDRESS
    );
    return [...special, ...rest];
  }, [sortedValidators]);

  const headers = [
    { children: "Validator" },
    "Amount to Stake",
    {
      children: (
        <div className="leading-tight">
          Stake <small className="block text-xs text-neutral-500">New Stake</small>
        </div>
      ),
      className: "text-right",
      ...sortableColumns["stakedAmount"],
    },
    {
      children: <div className="w-full text-right">Voting Power</div>,
      ...sortableColumns["votingPowerInNAM"],
    },
    {
      children: <div className="w-full text-right">Commission</div>,
      ...sortableColumns["commission"],
    },
  ];

  const renderRow = (validator: Validator): TableRow => {
    const stakedAmount =
      stakedAmountByAddress[validator.address] ?? new BigNumber(0);
    const amountToStake =
      updatedAmountByAddress[validator.address] ?? new BigNumber(0);
    const hasStakedAmount = stakedAmount.gt(0);
    const hasNewAmounts = amountToStake.gt(0);
    const notInConsensusSet = validator.status !== "consensus";

    return {
      className: "",
      cells: [
        <div key={`increment-bonding-alias-${validator.address}`} className="flex flex-col">
          <ValidatorCard validator={validator} hasStake={hasStakedAmount} />
          {validator.votingPowerInNAM && validator.votingPowerInNAM.lt(new BigNumber(1000)) && (
            <span className="text-yellow-500 text-sm flex items-center">
              <IoWarning className="mr-1" /> Below threshold
            </span>
          )}
        </div>,
        <div key={`increment-bonding-new-amounts-${validator.address}`} className="min-w-[24ch] relative">
          {topValidatorsByRank.includes(validator.address) ? (
            <IconTooltip
              className={clsx(
                "hidden absolute -left-6 bg-fail text-black top-1/2 -translate-y-1/2 z-50",
                { "inline-flex": updatedAmountByAddress[validator.address] }
              )}
              icon={<FaExclamation />}
              text="Consider staking to validators outside of the top 10 to increase decentralization"
            />
          ) : notInConsensusSet ? (
            <IconTooltip
              className={clsx(
                "hidden absolute -left-6 bg-fail text-black top-1/2 -translate-y-1/2 z-50",
                { "inline-flex": updatedAmountByAddress[validator.address] }
              )}
              icon={<FaExclamation />}
              text="This validator is outside of the consensus set. You will not receive staking rewards until they are active"
            />
          ) : null}
          <AmountField
            placeholder="Select to increase stake"
            value={updatedAmountByAddress[validator.address]}
            updated={hasNewAmounts}
            validator={validator}
            data-validator-input={validator.address}
            hasStakedAmounts={stakedAmountByAddress[validator.address]?.gt(0)}
            onChange={(e) => onChangeValidatorAmount(validator, new BigNumber(e.target.value || 0))}
          />
        </div>,
        <div key={`increment-bonding-current-stake`} className="text-right leading-tight min-w-[12ch]">
          <span className="block">
            <NamCurrency amount={stakedAmount ?? 0} />
          </span>
          {hasNewAmounts && (
            <span className={clsx("text-neutral-500 text-sm", { "text-yellow": hasNewAmounts })}>
              <NamCurrency amount={amountToStake.plus(stakedAmount)} />
            </span>
          )}
        </div>,
        <div className="flex flex-col text-right leading-tight" key={`validator-voting-power-${validator.address}`}>
          {validator.votingPowerInNAM && <NamCurrency amount={validator.votingPowerInNAM} />}
          <span className="text-neutral-600 text-sm">
            {formatPercentage(BigNumber(validator.votingPowerPercentage || 0))}
          </span>
        </div>,
        <div key={`commission-${validator.uuid}`} className="text-right leading-tight">
          {formatPercentage(validator.commission)}
        </div>,
      ],
    };
  };

  return (
    <ValidatorsTable
      id="increment-bonding-table"
      tableClassName="flex-1 overflow-auto mt-2"
      validatorList={sortedValidatorsWithSpecialFirst}
      updatedAmountByAddress={updatedAmountByAddress}
      headers={headers}
      renderRow={renderRow}
      resultsPerPage={resultsPerPage}
    />
  );
};
