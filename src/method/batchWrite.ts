import { KeySpace } from '../KeySpace';
import { GenericAttributes } from '../util/utils';
import { Table } from '../Table';
import { DkBatchWriteCommand, DkBatchWriteCommandInput, DkBatchWriteCommandOutput } from '../command/BatchWrite';
import { DkClient } from '../Client';

export interface BatchWriteItemsInput extends Omit<DkBatchWriteCommandInput, 'requests'> {
	pageLimit?: number;
}

export interface BatchWriteItemsOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends Partial<Omit<DkBatchWriteCommandOutput, 'unprocessedRequests'>> {
	unprocessedRequests: NonNullable<DkBatchWriteCommandOutput<Attributes, Key>['unprocessedRequests']>[string];
}

export const batchWriteTableItems = async <T extends Table = Table>(
	Table: T,
	requests: Array<{ put: Table.GetAttributes<T> } | { delete: Table.GetIndexKey<T, T['primaryIndex']> }>,
	input?: BatchWriteItemsInput,
	dkClient: DkClient = Table.dkClient
): Promise<BatchWriteItemsOutput<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>>> => {
	if (requests.length === 0) {
		return {
			unprocessedRequests: []
		};
	}

	const pageLimit = input?.pageLimit ? Math.min(input.pageLimit, 25) : 25;

	const recurse = async (
		remainingRequests: DkBatchWriteCommandInput<
			Table.GetAttributes<T>,
			Table.GetIndexKey<T, T['primaryIndex']>
		>['requests'][string]
	): Promise<BatchWriteItemsOutput<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>>> => {
		const currentRequests = remainingRequests.slice(0, pageLimit);

		const output = await dkClient.send(
			new DkBatchWriteCommand<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>>({
				...input,
				requests: {
					[Table.tableName]: currentRequests
				}
			})
		);

		const unprocessedRequests = output.unprocessedRequests[Table.tableName] || [];

		const nextRemainingRequests = remainingRequests.slice(pageLimit);

		if (nextRemainingRequests.length === 0) {
			return {
				...output,
				unprocessedRequests: unprocessedRequests
			};
		}

		const nextPage = await recurse(nextRemainingRequests);

		return {
			...output,
			unprocessedRequests: [...unprocessedRequests, ...nextPage.unprocessedRequests]
		};
	};

	return recurse(requests);
};

export const batchWriteItems = async <K extends KeySpace = KeySpace>(
	KeySpace: K,
	requests: Array<
		{ put: KeySpace.GetAttributes<K> } | { delete: KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']> }
	>,
	input?: BatchWriteItemsInput
): Promise<BatchWriteItemsOutput<KeySpace.GetAttributesAndKeys<K>, KeySpace.GetIndexKey<K, K['primaryIndex']>>> =>
	batchWriteTableItems(
		KeySpace.Table,
		requests.map(request => {
			if ('put' in request) {
				return { put: KeySpace.withIndexKeys(request.put) };
			}

			return { delete: KeySpace.keyOf(request.delete) };
		}),
		input,
		KeySpace.dkClient
	) as Promise<BatchWriteItemsOutput<KeySpace.GetAttributesAndKeys<K>, KeySpace.GetIndexKey<K, K['primaryIndex']>>>;
