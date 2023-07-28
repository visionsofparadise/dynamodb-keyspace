import { KeySpace } from '../KeySpace';
import { Table } from '../Table';
import { PutItemInput, putTableItem } from './put';
import { DkClient } from '../Client';

export interface CreateItemInput extends Omit<PutItemInput, 'returnValues'> {}

export type CreateItemOutput = void;

export const createTableItem = async <T extends Table = Table>(
	Table: T,
	item: Table.GetAttributes<T>,
	input?: CreateItemInput,
	dkClient: DkClient = Table.dkClient
): Promise<CreateItemOutput> => {
	await putTableItem(
		Table,
		item,
		{
			...input,
			conditionExpression: `attribute_not_exists(#hashKey)${
				input?.conditionExpression ? ` ${input?.conditionExpression}` : ''
			}`,
			expressionAttributeNames: {
				'#hashKey': Table.config.indexes.primaryIndex.hash.key,
				...input?.expressionAttributeNames
			}
		},
		dkClient
	);

	return;
};

export const createItem = async <K extends KeySpace = KeySpace>(
	KeySpace: K,
	item: KeySpace.GetAttributes<K>,
	input?: CreateItemInput
): Promise<CreateItemOutput> => createTableItem(KeySpace.Table, KeySpace.withIndexKeys(item), input, KeySpace.dkClient);
