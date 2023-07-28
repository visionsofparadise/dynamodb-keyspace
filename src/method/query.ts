import { Table } from '../Table';
import { KeySpace } from '../KeySpace';
import { GenericAttributes } from '../util/utils';
import { DkQueryCommand, DkQueryCommandInput, DkQueryCommandOutput } from '../command/Query';
import { DkClient } from '../Client';

export interface ListParams<Index extends string | never | undefined> {
	index?: Index;
	pageLimit?: number;
	totalLimit?: number;
	autoPage?: boolean;
}

export interface QueryItemsInput<
	Index extends string | never | undefined = undefined,
	CursorKey extends GenericAttributes = GenericAttributes
> extends Omit<DkQueryCommandInput<CursorKey>, 'tableName' | 'index' | 'limit'>,
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
		const { autoPage, pageLimit, totalLimit, ...inputRest } = input;

		const output = await dkClient.send(
			new DkQueryCommand<Table.GetAttributes<T>, Table.GetIndexCursorKey<T, Index & string>>({
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
		items: output.items.map(item => {
			KeySpace.assertAttributesAndKeys(item);

			return KeySpace.omitIndexKeys(item);
		})
	};
};
