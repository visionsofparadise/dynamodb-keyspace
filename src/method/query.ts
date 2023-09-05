import { Table } from '../Table';
import { KeySpace } from '../KeySpace';
import { GenericAttributes } from '../util/utils';
import { DkQueryCommand, DkQueryCommandInput, DkQueryCommandOutput } from '../command/Query';
import { DkClient } from '../Client';

export interface ListParams<Index extends string | never | undefined> {
	IndexName?: Index;
	PageLimit?: number;
	AutoPage?: boolean;
}

export interface QueryItemsInput<
	Index extends string | never | undefined = undefined,
	CursorKey extends GenericAttributes = GenericAttributes
> extends Omit<DkQueryCommandInput<CursorKey>, 'TableName' | 'IndexName'>,
		ListParams<Index> {}

export type QueryItemsOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	CursorKey extends GenericAttributes = GenericAttributes
> = DkQueryCommandOutput<Attributes, CursorKey>;

export const queryTableItems = async <
	T extends Table = Table,
	Index extends T['secondaryIndexes'][number] | never | undefined = never | undefined
>(
	Table: T,
	input: QueryItemsInput<Index, Table.GetIndexCursorKey<T, Index & string>>,
	dkClient: DkClient = Table.dkClient
): Promise<QueryItemsOutput<Table.GetAttributes<T>, Table.GetIndexCursorKey<T, Index & string>>> => {
	const recurse = async (
		totalCount: number,
		pageCursorKey?: Table.GetIndexCursorKey<T, Index & string>
	): Promise<QueryItemsOutput<Table.GetAttributes<T>, Table.GetIndexCursorKey<T, Index & string>>> => {
		const { AutoPage, PageLimit, Limit, ...inputRest } = input;

		const output = await dkClient.send(
			new DkQueryCommand<Table.GetAttributes<T>, Table.GetIndexCursorKey<T, Index & string>>({
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

export const queryItems = async <
	K extends KeySpace = KeySpace,
	Index extends K['secondaryIndexes'][number] | never | undefined = never | undefined
>(
	KeySpace: K,
	input: QueryItemsInput<Index, Table.GetIndexCursorKey<K['Table'], Index>>
): Promise<QueryItemsOutput<KeySpace.GetAttributes<K>, Table.GetIndexCursorKey<K['Table'], Index>>> => {
	const output = await queryTableItems(KeySpace.Table, input, KeySpace.dkClient);

	return {
		...output,
		Items: output.Items.map(item => {
			KeySpace.assertAttributesAndKeys(item);

			return KeySpace.omitIndexKeys(item);
		})
	};
};
