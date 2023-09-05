import { KeySpace } from '../KeySpace';
import { Table } from '../Table';
import {
	DkTransactWriteCommand,
	DkTransactWriteCommandInput,
	DkTransactWriteCommandOutput
} from '../command/TransactWrite';
import { DkClient } from '../Client';
import { ConditionCheck, Delete, Put, TransactWriteItem, Update } from '@aws-sdk/client-dynamodb';

export interface TransactWriteItemsInput extends Omit<DkTransactWriteCommandInput, 'requests'> {}

export type TransactWriteItemsOutput = DkTransactWriteCommandOutput;

export const transactWriteTableItems = async <T extends Table = Table>(
	Table: T,
	requests: Array<
		Omit<TransactWriteItem, 'ConditionCheck' | 'Put' | 'Delete' | 'Update'> & {
			ConditionCheck?: Omit<ConditionCheck, 'Key' | 'TableName'> & {
				Key: Table.GetIndexKey<T, T['primaryIndex']>;
			};
			Delete?: Omit<Delete, 'Key' | 'TableName'> & {
				Key: Table.GetIndexKey<T, T['primaryIndex']>;
			};
			Put?: Omit<Put, 'Item' | 'TableName'> & {
				Item: Table.GetAttributes<T>;
			};
			Update?: Omit<Update, 'Key' | 'TableName'> & {
				Key: Table.GetIndexKey<T, T['primaryIndex']>;
			};
		}
	>,
	input?: TransactWriteItemsInput,
	dkClient: DkClient = Table.dkClient
): Promise<TransactWriteItemsOutput> =>
	dkClient.send(
		new DkTransactWriteCommand<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>>({
			...input,
			TransactItems: requests.map(request => {
				return Object.fromEntries(
					Object.entries(request).map(([key, value]) => [
						key,
						value
							? {
									...value,
									TableName: Table.name
							  }
							: value
					])
				);
			})
		})
	);

export const transactWriteItems = async <K extends KeySpace = KeySpace>(
	KeySpace: K,
	requests: Array<
		Omit<TransactWriteItem, 'ConditionCheck' | 'Put' | 'Delete' | 'Update'> & {
			ConditionCheck?: Omit<ConditionCheck, 'Key' | 'TableName'> & {
				Key: KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']>;
			};
			Delete?: Omit<Delete, 'Key' | 'TableName'> & {
				Key: KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']>;
			};
			Put?: Omit<Put, 'Item' | 'TableName'> & {
				Item: KeySpace.GetAttributes<K>;
			};
			Update?: Omit<Update, 'Key' | 'TableName'> & {
				Key: KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']>;
			};
		}
	>,
	input?: TransactWriteItemsInput
): Promise<TransactWriteItemsOutput> =>
	transactWriteTableItems(
		KeySpace.Table,
		requests.map(request => {
			return Object.fromEntries(
				Object.entries(request).map(([key, value]) => {
					if (key === 'ConditionCheck' || key === 'Delete' || key === 'Update') {
						return [
							key,
							value
								? {
										...value,
										Key: KeySpace.keyOf((request as { Key: KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']> }).Key)
								  }
								: value
						];
					}

					if (key === 'Put') {
						return [
							key,
							value
								? {
										...value,
										Item: KeySpace.withIndexKeys((request as { Item: KeySpace.GetAttributes<K> }).Item)
								  }
								: value
						];
					}

					return [key, value];
				})
			);
		}),
		input,
		KeySpace.dkClient
	);
