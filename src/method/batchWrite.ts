import { KeySpace } from '../KeySpace';
import { GenericAttributes } from '../util/utils';
import { Table } from '../Table';
import { DkBatchWriteCommand, DkBatchWriteCommandInput, DkBatchWriteCommandOutput } from '../command/BatchWrite';
import { DkClient } from '../Client';

export interface BatchWriteItemsInput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends Omit<DkBatchWriteCommandInput<Attributes, Key>, 'RequestItems'> {
	PageLimit?: number;
}

export interface BatchWriteItemsOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends Partial<Omit<DkBatchWriteCommandOutput, 'UnprocessedItems'>> {
	UnprocessedItems: DkBatchWriteCommandOutput<Attributes, Key>['UnprocessedItems'][string];
}

export const batchWriteTableItems = async <T extends Table = Table>(
	Table: T,
	requests: Array<{ Put: Table.GetAttributes<T> } | { Delete: Table.GetIndexKey<T, T['primaryIndex']> }>,
	input?: BatchWriteItemsInput,
	dkClient: DkClient = Table.dkClient
): Promise<BatchWriteItemsOutput<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>>> => {
	if (requests.length === 0) {
		return {
			UnprocessedItems: []
		};
	}

	const pageLimit = input?.PageLimit ? Math.min(input.PageLimit, 25) : 25;

	const recurse = async (
		remainingRequests: DkBatchWriteCommandInput<
			Table.GetAttributes<T>,
			Table.GetIndexKey<T, T['primaryIndex']>
		>['RequestItems'][string]
	): Promise<BatchWriteItemsOutput<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>>> => {
		const currentRequests = remainingRequests.slice(0, pageLimit);

		const output = await dkClient.send(
			new DkBatchWriteCommand<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>>({
				...input,
				RequestItems: {
					[Table.name]: currentRequests
				}
			})
		);

		const UnprocessedItems = output.UnprocessedItems[Table.name] || [];

		const nextRemainingRequests = remainingRequests.slice(pageLimit);

		if (nextRemainingRequests.length === 0) {
			return {
				...output,
				UnprocessedItems
			};
		}

		const nextPage = await recurse(nextRemainingRequests);

		return {
			...output,
			UnprocessedItems: [...UnprocessedItems, ...nextPage.UnprocessedItems]
		};
	};

	return recurse(
		requests.map(request => {
			if ('Put' in request) {
				return {
					PutRequest: {
						Item: request.Put
					}
				};
			}

			if ('Delete' in request) {
				return {
					DeleteRequest: {
						Key: request.Delete
					}
				};
			}

			throw new Error('Invalid request');
		})
	);
};

export const batchWriteItems = async <K extends KeySpace = KeySpace>(
	KeySpace: K,
	requests: Array<
		{ Put: KeySpace.GetAttributes<K> } | { Delete: KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']> }
	>,
	input?: BatchWriteItemsInput
): Promise<BatchWriteItemsOutput<Table.GetAttributes<K['Table']>, Table.GetIndexKey<K['Table'], K['primaryIndex']>>> =>
	batchWriteTableItems<K['Table']>(
		KeySpace.Table,
		requests.map(request => {
			if ('Put' in request) {
				return { Put: KeySpace.withIndexKeys(request.Put) };
			}

			if ('Delete' in request) {
				return { Delete: KeySpace.keyOf(request.Delete) };
			}

			throw new Error('Invalid request');
		}) as Array<
			{ Put: Table.GetAttributes<K['Table']> } | { Delete: Table.GetIndexKey<K['Table'], K['primaryIndex']> }
		>,
		input,
		KeySpace.dkClient
	);
