import { GenericAttributes } from '../util/utils';
import { Table } from '../Table';
import { DkBatchGetCommand, DkBatchGetCommandInput, DkBatchGetCommandOutput } from '../command/BatchGet';
import { KeySpace } from '../KeySpace';
import { DkClient } from '../Client';

export interface BatchGetItemsInput<Key extends GenericAttributes = GenericAttributes>
	extends Omit<DkBatchGetCommandInput<Key>, 'RequestItems'> {
	PageLimit?: number;
}

export interface BatchGetItemsOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends Partial<Omit<DkBatchGetCommandOutput, 'Responses' | 'UnprocessedKeys'>> {
	Responses: DkBatchGetCommandOutput<Attributes, Key>['Responses'][string];
	UnprocessedKeys: DkBatchGetCommandOutput<Attributes, Key>['UnprocessedKeys'][string];
}

export const batchGetTableItems = async <T extends Table = Table>(
	Table: T,
	keys: Array<Table.GetIndexKey<T, T['primaryIndex']>>,
	input?: BatchGetItemsInput,
	dkClient: DkClient = Table.dkClient
): Promise<BatchGetItemsOutput<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>>> => {
	const { PageLimit = 100, ReturnConsumedCapacity, ...rest } = input || ({} as BatchGetItemsInput);

	if (keys.length === 0)
		return {
			Responses: [],
			UnprocessedKeys: {
				Keys: [],
				...rest
			}
		};

	const limitedPageLimit = Math.min(PageLimit, 100);

	const recurse = async (
		remainingKeys: Array<Table.GetIndexKey<T, T['primaryIndex']>>
	): Promise<BatchGetItemsOutput<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>>> => {
		const currentKeys = remainingKeys.slice(0, limitedPageLimit);

		const output = await dkClient.send(
			new DkBatchGetCommand<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>>({
				RequestItems: {
					[Table.name]: {
						Keys: currentKeys,
						...rest
					}
				},
				ReturnConsumedCapacity
			})
		);

		const nextRemainingKeys = remainingKeys.slice(limitedPageLimit);

		const Responses = output.Responses[Table.name];
		const UnprocessedKeys = output.UnprocessedKeys[Table.name] || { Keys: [] };

		if (nextRemainingKeys.length === 0) {
			return {
				Responses,
				UnprocessedKeys
			};
		}

		const nextPage = await recurse(nextRemainingKeys);

		return {
			Responses: [...Responses, ...nextPage.Responses],
			UnprocessedKeys: {
				Keys: [...UnprocessedKeys.Keys, ...(nextPage.UnprocessedKeys?.Keys || [])],
				...rest
			}
		};
	};

	return recurse(keys);
};

export const batchGetItems = async <K extends KeySpace = KeySpace>(
	KeySpace: K,
	keys: Array<KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']>>,
	input?: BatchGetItemsInput
): Promise<BatchGetItemsOutput<KeySpace.GetAttributes<K>, KeySpace.GetIndexKey<K, K['primaryIndex']>>> => {
	return batchGetTableItems<K['Table']>(
		KeySpace.Table,
		keys.map(key => KeySpace.keyOf(key), input),
		input,
		KeySpace.dkClient
	);
};
