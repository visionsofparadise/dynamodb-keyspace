import { KeySpace } from '../KeySpace';
import { Table } from '../Table';
import {
	DkTransactWriteCommand,
	DkTransactWriteCommandInput,
	DkTransactWriteCommandInputConditionCheck,
	DkTransactWriteCommandInputDelete,
	DkTransactWriteCommandInputPut,
	DkTransactWriteCommandInputUpdate,
	DkTransactWriteCommandOutput
} from '../command/TransactWrite';
import { DkClient } from '../Client';

export interface TransactWriteItemsInput extends Omit<DkTransactWriteCommandInput, 'requests'> {}

export type TransactWriteItemsOutput = DkTransactWriteCommandOutput;

export const transactWriteTableItems = async <T extends Table = Table>(
	Table: T,
	requests: Array<
		| Omit<DkTransactWriteCommandInputConditionCheck<Table.GetIndexKey<T, T['primaryIndex']>>, 'tableName'>
		| Omit<DkTransactWriteCommandInputDelete<Table.GetIndexKey<T, T['primaryIndex']>>, 'tableName'>
		| Omit<DkTransactWriteCommandInputPut<Table.GetAttributes<T>>, 'tableName'>
		| Omit<DkTransactWriteCommandInputUpdate<Table.GetIndexKey<T, T['primaryIndex']>>, 'tableName'>
	>,
	input?: TransactWriteItemsInput,
	dkClient: DkClient = Table.dkClient
): Promise<TransactWriteItemsOutput> =>
	dkClient.send(
		new DkTransactWriteCommand<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>>({
			...input,
			requests: requests.map(request => ({ ...request, tableName: Table.tableName }))
		})
	);

export const transactWriteItems = async <K extends KeySpace = KeySpace>(
	KeySpace: K,
	requests: Array<
		| Omit<
				DkTransactWriteCommandInputConditionCheck<KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']>>,
				'tableName'
		  >
		| Omit<DkTransactWriteCommandInputDelete<KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']>>, 'tableName'>
		| Omit<DkTransactWriteCommandInputPut<KeySpace.GetAttributes<K>>, 'tableName'>
		| Omit<DkTransactWriteCommandInputUpdate<KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']>>, 'tableName'>
	>,
	input?: TransactWriteItemsInput
): Promise<TransactWriteItemsOutput> =>
	transactWriteTableItems(
		KeySpace.Table,
		requests.map(request => {
			if (request.type === 'put') {
				return {
					...request,
					item: KeySpace.withIndexKeys(request.item)
				};
			}

			return {
				...request,
				key: KeySpace.keyOf(request.key)
			};
		}),
		input,
		KeySpace.dkClient
	);
