import { Table } from '../Table';
import { GenericAttributes } from '../util/utils';
import { DkScanCommand, DkScanCommandInput, DkScanCommandOutput } from '../command/Scan';
import { ListParams } from './query';

export interface ScanItemsInput<
	Index extends string | never = never,
	CursorKey extends GenericAttributes = GenericAttributes
> extends Omit<DkScanCommandInput<CursorKey>, 'tableName' | 'index' | 'limit' | 'scanIndexForward'>,
		ListParams<Index> {}

export type ScanItemsOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	CursorKey extends GenericAttributes = GenericAttributes
> = DkScanCommandOutput<Attributes, CursorKey>;

export const scanTableItems = async <
	T extends Table = Table,
	Index extends T['secondaryIndexes'][number] | never = never
>(
	Table: T,
	input?: ScanItemsInput<Index, Table.GetIndexCursorKey<T, Index>>
): Promise<ScanItemsOutput<Table.GetAttributes<T>, Table.GetIndexCursorKey<T, Index>>> => {
	const recurse = async (
		totalCount: number,
		pageCursorKey?: Table.GetIndexCursorKey<T, Index>
	): Promise<ScanItemsOutput<Table.GetAttributes<T>, Table.GetIndexCursorKey<T, Index>>> => {
		const { autoPage, pageLimit, totalLimit, ...inputRest } =
			input || ({} as ScanItemsInput<Index, Table.GetIndexCursorKey<T, Index>>);

		const output = await Table.dkClient.send(
			new DkScanCommand<Table.GetAttributes<T>, Table.GetIndexCursorKey<T, Index>>({
				...inputRest,
				tableName: Table.tableName,
				cursorKey: pageCursorKey,
				limit: pageLimit
			})
		);

		const { items, cursorKey, count = 0, ...rest } = output;

		const newTotalCount = totalCount + items.length;

		if (!autoPage || !cursorKey || (totalLimit && newTotalCount >= totalLimit)) {
			return {
				items: items.slice(0, totalLimit),
				cursorKey,
				count,
				...rest
			};
		}

		const nextPage = await recurse(newTotalCount, cursorKey);

		return {
			items: [...items, ...nextPage.items].slice(0, totalLimit),
			cursorKey: nextPage.cursorKey,
			count: count + (nextPage.count || 0),
			...rest
		};
	};

	return recurse(0, input?.cursorKey);
};
