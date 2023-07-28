import { KeySpace } from '../KeySpace';
import { ListParams, QueryItemsInput, queryTableItems } from './query';
import { run } from '../util/utils';
import { Table, primaryIndex } from '../Table';
import { GenericAttributes } from '../util/utils';
import { DkClient } from '../Client';

export type QueryGetItemInput = Omit<
	QueryItemsInput<any, any>,
	'keyConditionExpression' | keyof ListParams<any> | 'sort'
>;

export type QueryGetItemOutput<Attributes extends GenericAttributes = GenericAttributes> = Attributes;

export const queryGetTableItem = async <T extends Table = Table, Index extends T['indexes'][number] | never = never>(
	Table: T,
	index: Index,
	key: Table.GetIndexKey<T, Index>,
	input?: QueryGetItemInput,
	dkClient: DkClient = Table.dkClient
): Promise<QueryGetItemOutput<Table.GetAttributes<T>>> => {
	const setIndex = index !== primaryIndex ? index : undefined;

	const hashKey: string & keyof typeof key = Table.config.indexes[index].hash.key;
	const sortKey: string & keyof typeof key = Table.config.indexes[index].sort?.key;

	const output = await run(async () => {
		if (sortKey) {
			return queryTableItems(
				Table,
				{
					...input,
					index: setIndex,
					pageLimit: 1,
					keyConditionExpression: `${hashKey} = :hashValue AND ${sortKey} = :sortValue`,
					expressionAttributeValues: {
						[`:hashValue`]: key[hashKey],
						[`:sortValue`]: key[sortKey],
						...input?.expressionAttributeValues
					}
				},
				dkClient
			);
		}

		return queryTableItems(
			Table,
			{
				...input,
				index: setIndex,
				pageLimit: 1,
				keyConditionExpression: `${hashKey} = :hashValue`,
				expressionAttributeValues: {
					[`:hashValue`]: key[hashKey],
					...input?.expressionAttributeValues
				}
			},
			dkClient
		);
	});

	if (!output.items[0]) throw new Error('Not Found');

	return output.items[0];
};

export const queryGetItem = async <K extends KeySpace = KeySpace, Index extends K['indexes'][number] | never = never>(
	KeySpace: K,
	index: Index,
	keyParams: KeySpace.GetIndexKeyValueParams<K, Index>,
	input?: QueryGetItemInput
): Promise<QueryGetItemOutput<KeySpace.GetAttributes<K>>> => {
	const item = await queryGetTableItem(
		KeySpace.Table,
		index,
		KeySpace.indexKeyOf(index, keyParams),
		input,
		KeySpace.dkClient
	);

	KeySpace.assertAttributesAndKeys(item);

	return KeySpace.omitIndexKeys(item);
};
