import { TableHeader, TableRow } from "@namada/components";
import { TableWithPaginator } from "App/Common/TableWithPaginator";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoInfo } from "react-icons/go";
import { twMerge } from "tailwind-merge";
import { Validator } from "types";
import { ValidatorInfoPanel } from "./ValidatorInfoPanel";

type ValidatorsTableProps = {
  id: string;
  headers: (TableHeader | React.ReactNode)[];
  validatorList: Validator[];
  renderRow: (validator: Validator) => TableRow;
  resultsPerPage?: number;
  initialPage?: number;
  tableClassName?: string;
  // kept for API compatibility even if unused here
  updatedAmountByAddress?: Record<string, unknown>;
};

export const ValidatorsTable = ({
  id,
  headers,
  renderRow,
  validatorList,
  resultsPerPage = 10,
  initialPage = 0,
  tableClassName,
}: ValidatorsTableProps): JSX.Element => {
  const [page, setPage] = useState(initialPage);

  const [selectedValidator, setSelectedValidator] = useState<
    Validator | undefined
  >();

  // Close info panel when clicking outside
  useEffect(() => {
    const onCloseInfo = (): void => setSelectedValidator(undefined);
    document.documentElement.addEventListener("click", onCloseInfo);
    return () => {
      document.documentElement.removeEventListener("click", onCloseInfo);
    };
  }, []);

  // Append empty header for the info icon column (stable reference)
  const headersWithInfo = useMemo(() => headers.concat(""), [headers]);

  // Compute pageCount
  const pageCount = useMemo(
    () => Math.ceil(validatorList.length / resultsPerPage),
    [validatorList.length, resultsPerPage]
  );

  // Clamp page if list shrinks (e.g., filtering)
  useEffect(() => {
    const maxPage = Math.max(0, pageCount - 1);
    setPage((p) => Math.min(p, maxPage));
  }, [pageCount]);

  // Reset to page 0 ONLY when the actual set/order of validators changes,
  // not merely when the array reference changes (e.g., due to typing).
  const listFingerprint = useMemo(
    () => validatorList.map((v) => v.address).join("|"),
    [validatorList]
  );
  const prevFingerprintRef = useRef<string>(listFingerprint);

  useEffect(() => {
    if (prevFingerprintRef.current !== listFingerprint) {
      prevFingerprintRef.current = listFingerprint;
      setPage(0);
    }
  }, [listFingerprint]);

  // Slice items for current page
  const paginatedItems = useMemo(() => {
    const start = page * resultsPerPage;
    return validatorList.slice(start, start + resultsPerPage);
  }, [validatorList, page, resultsPerPage]);

  // Map row and append info icon
  const mapValidatorRow = useCallback(
    (validator: Validator, _index: number): TableRow => {
      const row = renderRow(validator);

      row.cells.push(
        <i
          key={`validator-info-${validator.address}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedValidator(validator);
          }}
          className={clsx(
            "cursor-pointer flex justify-end relative",
            "hover:text-cyan active:top-px"
          )}
        >
          <GoInfo />
        </i>
      );

      return row;
    },
    [renderRow]
  );

  // Memoize props objects to avoid unnecessary downstream resets
  const tableProps = useMemo(
    () => ({
      className: twMerge(
        "w-full flex-1 [&_td]:px-1 [&_th]:px-1 [&_td:first-child]:pl-4 [&_td]:h-[64px]",
        "[&_td]:font-normal [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4",
        "[&_td:first-child]:rounded-s-md [&_td:last-child]:rounded-e-md",
        tableClassName
      ),
    }),
    [tableClassName]
  );

  const headProps = useMemo(() => ({ className: "text-neutral-500" }), []);

  return (
    <TableWithPaginator
      id={id}
      headers={headersWithInfo}
      renderRow={mapValidatorRow}
      itemList={paginatedItems}
      page={page}
      pageCount={pageCount}
      onPageChange={setPage}
      tableProps={tableProps}
      headProps={headProps}
    >
      {selectedValidator && (
        <ValidatorInfoPanel
          className="h-full right-0 top-0"
          validator={selectedValidator}
          onClose={() => setSelectedValidator(undefined)}
        />
      )}
    </TableWithPaginator>
  );
};
