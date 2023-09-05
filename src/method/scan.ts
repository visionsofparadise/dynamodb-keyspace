import { Table } from '../Table';
import { GenericAttributes } from '../util/utils';
import { DkScanCommand, DkScanCommandInput, DkScanCommandOutput } from '../command/Scan';
import { ListParams } from './query';

export interface ScanItemsInput<
	Index extends string | never = never,
	CursorKey extends GenericAttributes = GenericAttributes
> extends Omit<DkScanCommandInput<CursorKey>, 'TableName' | 'IndexName'>,
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
		const { AutoPage, PageLimit, Limit, ...inputRest } =
			input || ({} as ScanItemsInput<Index, Table.GetIndexCursorKey<T, Index>>);

		const output = await Table.dkClient.send(
			new DkScanCommand<Table.GetAttributes<T>, Table.GetIndexCursorKey<T, Index>>({
				...inputRest,
				TableName: Table.name,
				ExclusiveStartKey: pageCursorKey,
				Limit: PageLimit
			})
		);

		const { Items, LastEvaluatedKey, Count = 0, ...rest } = output;

		const newTotalCount = totalCount + Items.length;

		if (!AutoPage || !LastEvaluatedKey || (Limit && newTotalCount >= Limit)) {
			return {
				Items: Items.slice(0, Limit),
				LastEvaluatedKey,
				Count,
				...rest
			};
		}

		const nextPage = await recurse(newTotalCount, LastEvaluatedKey);

		return {
			Items: [...Items, ...nextPage.Items].slice(0, Limit),
			LastEvaluatedKey: nextPage.LastEvaluatedKey,
			Count: Count + (nextPage.Count || 0),
			...rest
		};
	};

	return recurse(0, input?.ExclusiveStartKey);
};
