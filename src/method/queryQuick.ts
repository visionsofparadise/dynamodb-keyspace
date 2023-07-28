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
		hashKeyParams: HashKeyParams;
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
		Table.GetIndexKey<T, string & Index>[T['config']['indexes'][Index & string]['hash']['key']]
	>,
	dkClient: DkClient = Table.dkClient
): Promise<QueryQuickItemsOutput<Table.GetAttributes<T>, Table.GetIndexCursorKey<T, Index & string>>> => {
	const index = input.index || primaryIndex;

	const { hashKeyParams, beginsWith, greaterThan, lessThan, ...inputRest } = input;

	const hashKey = Table.config.indexes[index].hash.key;
	const hashValue = hashKeyParams![hashKey as keyof typeof hashKeyParams];

	const sortKey = Table.config.indexes[index].sort?.key;

	const sortParams = createQueryQuickSort(sortKey, { beginsWith, greaterThan, lessThan });

	const output = await queryTableItems(
		Table,
		{
			...inputRest,
			keyConditionExpression: `${hashKey} = :hashValue ${sortParams.keyConditionExpression || ''}`,
			expressionAttributeValues: {
				[`:hashValue`]: hashValue,
				...sortParams.expressionAttributeValues,
				...input.expressionAttributeValues
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
		KeySpace.GetIndexHashKeyValueParamsMap<K>[Index extends string ? Index : K['primaryIndex']]
	>
): Promise<QueryQuickItemsOutput<KeySpace.GetAttributes<K>, Table.GetIndexCursorKey<K['Table'], Index>>> => {
	const index = input.index || primaryIndex;

	const hashKeyValue = KeySpace.indexAttributeValue(
		index,
		KeySpace.Table.config.indexes[index].hash.key,
		input.hashKeyParams as any
	);

	const hashKeyParams = {
		[KeySpace.Table.config.indexes[index].hash.key]: hashKeyValue
	};

	const output = await queryQuickTableItems(KeySpace.Table, { ...input, hashKeyParams } as any, KeySpace.dkClient);

	return {
		...output,
		items: output.items.map(item => {
			KeySpace.assertAttributesAndKeys(item);

			return KeySpace.omitIndexKeys(item);
		})
	} as QueryQuickItemsOutput<KeySpace.GetAttributes<K>, Table.GetIndexCursorKey<K['Table'], Index>>;
};
