import { SortableHeaderOptions, TableHeader } from "@namada/components";
import BigNumber from "bignumber.js";
import { useMemo, useState } from "react";
import { SortOptions, SortedColumnPair, Validator } from "types";
import { sortCollection } from "utils/sorting";

const ValidatorSortableColumnsList = [
  "votingPowerInNAM",
  "commission",
] as const;

type ValidatorSortableColumns = (typeof ValidatorSortableColumnsList)[number];

const isValidatorColumn = (value: string): value is ValidatorSortableColumns =>
  ValidatorSortableColumnsList.includes(value as ValidatorSortableColumns);

type SortableColumns = ValidatorSortableColumns | "stakedAmount";

type useValidatorTableSortingProps = {
  validators: Validator[];
  stakedAmountByAddress: Record<string, BigNumber>;
};

type useValidatorTableSortingOutput = {
  sortedValidators: Validator[];
  sortableColumns: Record<SortableColumns, Partial<TableHeader>>;
};

export const useValidatorTableSorting = ({
  validators,
}: useValidatorTableSortingProps): useValidatorTableSortingOutput => {
  // Imposta il sorting di default: per commissione in ordine ascendente
  const [sorting, setSorting] = useState<SortedColumnPair<SortableColumns>>([
    "commission",
    "asc",
  ]);

  const getSortingParam = (key: SortableColumns): SortOptions | undefined =>
    sorting && sorting[0] === key ? sorting[1] : undefined;

  const onSortCallback =
    (key: SortableColumns) => (order: SortableHeaderOptions) =>
      order ? setSorting([key, order]) : setSorting(undefined);

  const makeSortableColumn = (key: SortableColumns): Partial<TableHeader> => ({
    sortable: true,
    sorting: getSortingParam(key),
    onSort: onSortCallback(key),
  });

  const sortedValidators = useMemo(() => {
    // Cloniamo l'array per evitare modifiche in-place
    const validatorsCopy = [...validators];

    return validatorsCopy.sort((v1, v2) => {
      // 1. Priorità: i validatori con commissione >= 1% hanno la priorità
      const v1Priority = v1.commission.gte(0.01) ? 1 : 0;
      const v2Priority = v2.commission.gte(0.01) ? 1 : 0;

      if (v1Priority !== v2Priority) {
        return v2Priority - v1Priority;
      }

      // 2. Se esiste un sorting attivo sulle colonne gestite, applicalo
      if (sorting && isValidatorColumn(sorting[0])) {
        const sortedPair = sortCollection<Validator, ValidatorSortableColumns>(
          [v1, v2],
          sorting as SortedColumnPair<ValidatorSortableColumns>
        );
        return sortedPair[0] === v1 ? -1 : 1;
      }

      // 3. Altrimenti manteniamo l'ordine originale
      return 0;
    });
  }, [sorting, validators]);

  const sortableColumns: Record<SortableColumns, Partial<TableHeader>> = {
    stakedAmount: makeSortableColumn("stakedAmount"),
    commission: makeSortableColumn("commission"),
    votingPowerInNAM: makeSortableColumn("votingPowerInNAM"),
  };

  return {
    sortedValidators,
    sortableColumns,
  };
};
