import { Table, primaryIndex } from '../Table';
import { KeySpace } from '../KeySpace';
import { QueryItemsInput, QueryItemsOutput, queryTableItems } from './query';
import { DkQuickQueryOperators, createQueryQuickSort } from '../util/createSortKeyQuery';
import { GenericAttributes } from '../util/utils';
import { DkClient } from '../Client';

export type QueryQuickItemsInput<
	Index extends string | never | undefined = never | undefined,
	CursorKey extends GenericAttributes = GenericAttributes,
	HashKeyParams extends any = any
> = Omit<QueryItemsInput<Index, CursorKey>, 'keyConditionExpression'> &
	DkQuickQueryOperators & {
		HashKeyParams: HashKeyParams;
	};

export type QueryQuickItemsOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	CursorKey extends GenericAttributes = GenericAttributes
> = QueryItemsOutput<Attributes, CursorKey>;

export const queryQuickTableItems = async <
	T extends Table = Table,
	Index extends T['secondaryIndexes'][number] | never | undefined = never | undefined
>(
	Table: T,
	input: QueryQuickItemsInput<
		Index & string,
		Table.GetIndexCursorKey<T, Index & string>,
		Index extends T['secondaryIndexes'][number]
			? Table.GetIndexKey<T, Index>[T['config']['indexes'][Index]['hash']['key']]
			: Table.GetIndexKey<T, T['primaryIndex']>[T['config']['indexes'][T['primaryIndex']]['hash']['key']]
	>,
	dkClient: DkClient = Table.dkClient
): Promise<QueryQuickItemsOutput<Table.GetAttributes<T>, Table.GetIndexCursorKey<T, Index & string>>> => {
	const index = input.IndexName || primaryIndex;

	const { HashKeyParams, BeginsWith, GreaterThan, LessThan, ...inputRest } = input;

	const hashKey = Table.config.indexes[index].hash.key;
	const hashValue = HashKeyParams![hashKey as keyof typeof HashKeyParams];

	const sortKey = Table.config.indexes[index].sort?.key;

	const sortParams = createQueryQuickSort(sortKey, { BeginsWith, GreaterThan, LessThan });

	const output = await queryTableItems(
		Table,
		{
			...inputRest,
			KeyConditionExpression: `${hashKey} = :hashValue ${sortParams.KeyConditionExpression || ''}`,
			ExpressionAttributeValues: {
				[`:hashValue`]: hashValue,
				...sortParams.ExpressionAttributeValues,
				...input.ExpressionAttributeValues
			}
		},
		dkClient
	);

	return output;
};

export const queryQuickItems = async <
	K extends KeySpace = KeySpace,
	Index extends K['secondaryIndexes'][number] | never | undefined = never | undefined
>(
	KeySpace: K,
	input: QueryQuickItemsInput<
		Index,
		Table.GetIndexCursorKey<K['Table'], Index>,
		Index extends K['secondaryIndexes'][number]
			? KeySpace.GetIndexHashKeyValueParamsMap<K>[Index]
			: KeySpace.GetIndexHashKeyValueParamsMap<K>[K['primaryIndex']]
	>
): Promise<QueryQuickItemsOutput<KeySpace.GetAttributes<K>, Table.GetIndexCursorKey<K['Table'], Index>>> => {
	const index = input.IndexName || primaryIndex;

	const hashKeyValue = KeySpace.indexAttributeValue(
		index,
		KeySpace.Table.config.indexes[index].hash.key,
		input.HashKeyParams as any
	);

	const HashKeyParams = {
		[KeySpace.Table.config.indexes[index].hash.key]: hashKeyValue
	};

	const output = await queryQuickTableItems(KeySpace.Table, { ...input, HashKeyParams } as any, KeySpace.dkClient);

	return {
		...output,
		items: output.Items.map(item => {
			KeySpace.assertAttributesAndKeys(item);

			return KeySpace.omitIndexKeys(item);
		})
	} as QueryQuickItemsOutput<KeySpace.GetAttributes<K>, Table.GetIndexCursorKey<K['Table'], Index>>;
};
