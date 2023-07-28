import { KeySpace } from '../KeySpace';
import { DkTransactGetCommand, DkTransactGetCommandInput } from '../command/TransactGet';
import { GenericAttributes } from '../util/utils';
import { Table } from '../Table';
import { DkClient } from '../Client';

export interface TransactGetItemsInput extends Omit<DkTransactGetCommandInput, 'requests'> {}

export type TransactGetItemsOutput<Attributes extends GenericAttributes = GenericAttributes> = Array<Attributes>;

export const transactGetTableItems = async <T extends Table = Table>(
	Table: T,
	keys: Array<Table.GetIndexKey<T, T['primaryIndex']>>,
	input?: TransactGetItemsInput,
	dkClient: DkClient = Table.dkClient
): Promise<TransactGetItemsOutput<Table.GetAttributes<T>>> => {
	const output = await dkClient.send(
		new DkTransactGetCommand<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>>({
			...input,
			requests: keys.map(key => ({ tableName: Table.tableName, key }))
		})
	);

	return output.items;
};

export const transactGetItems = async <K extends KeySpace = KeySpace>(
	KeySpace: K,
	keyParams: Array<KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']>>,
	input?: TransactGetItemsInput
): Promise<TransactGetItemsOutput<KeySpace.GetAttributes<K>>> => {
	const items = await transactGetTableItems(
		KeySpace.Table,
		keyParams.map(kp => KeySpace.keyOf(kp), input),
		input,
		KeySpace.dkClient
	);

	return items.map(item => {
		KeySpace.assertAttributesAndKeys(item);

		return KeySpace.omitIndexKeys(item);
	});
};
