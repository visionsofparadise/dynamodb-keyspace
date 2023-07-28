import { Table } from '../Table';
import { DkGetCommand, DkGetCommandInput } from '../command/Get';
import { GenericAttributes } from '../util/utils';
import { KeySpace } from '../KeySpace';
import { DkClient } from '../Client';

export interface GetItemInput extends Omit<DkGetCommandInput, 'tableName' | 'key'> {}

export type GetItemOutput<Attributes extends GenericAttributes = GenericAttributes> = Attributes;

export const getTableItem = async <T extends Table>(
	Table: T,
	key: Table.GetIndexKey<T, T['primaryIndex']>,
	input?: GetItemInput,
	dkClient: DkClient = Table.dkClient
): Promise<GetItemOutput<Table.GetAttributes<T>>> => {
	const output = await dkClient.send(
		new DkGetCommand<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>>({
			...input,
			tableName: Table.tableName,
			key: key
		})
	);

	return output.item;
};

export const getItem = async <K extends KeySpace>(
	KeySpace: K,
	keyParams: KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']>,
	input?: GetItemInput
): Promise<GetItemOutput<KeySpace.GetAttributes<K>>> => {
	const item = await getTableItem(KeySpace.Table, KeySpace.keyOf(keyParams), input, KeySpace.dkClient);

	KeySpace.assertAttributesAndKeys(item);

	return KeySpace.omitIndexKeys(item);
};
