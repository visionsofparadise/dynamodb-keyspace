import {
	ReturnConsumedCapacity,
	ReturnItemCollectionMetrics,
	ReturnValuesOnConditionCheckFailure
} from '@aws-sdk/client-dynamodb';

export interface DkReturnParams {
	ReturnConsumedCapacity?: ReturnConsumedCapacity;
	ReturnItemCollectionMetrics?: ReturnItemCollectionMetrics;
	ReturnValuesOnConditionCheckFailure?: ReturnValuesOnConditionCheckFailure;
}

export interface Defaults
	extends Pick<
		DkReturnParams,
		'ReturnConsumedCapacity' | 'ReturnItemCollectionMetrics' | 'ReturnValuesOnConditionCheckFailure'
	> {}

export const applyDefaults = <Input extends object>(
	input: Input,
	defaults: Defaults,
	defaultableKeys: Readonly<Array<keyof Input & keyof Defaults>>
): Input => {
	const inputDefaults = Object.fromEntries(defaultableKeys.map(key => [key, defaults[key]]));

	return {
		...inputDefaults,
		...input
	};
};
