import { DkOp } from '../UpdateOp';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { GenericAttributes, randomString } from './utils';

export interface DkUpdateExpressionParams {
	UpdateExpression?: string;
	ExpressionAttributeNames?: Record<string, string>;
	ExpressionAttributeValues?: GenericAttributes;
}

const createUpdateExpressionPart = (
	alias: string,
	key: string,
	value: NativeAttributeValue,
	precedingKeys?: Array<string>
): DkUpdateExpressionParams => ({
	UpdateExpression: `${
		precedingKeys ? `${precedingKeys.map(key => `#${key}`).join('.')}.` : ''
	}#${alias} = :${alias}, `,
	ExpressionAttributeNames: {
		[`#${alias}`]: key
	},
	ExpressionAttributeValues: {
		[`:${alias}`]: value
	}
});

export const createUpdateExpressionParts = <Attributes extends GenericAttributes>(
	attributes: Attributes,
	precedingKeys?: Array<string>
): Array<DkUpdateExpressionParams> => {
	return Object.entries(attributes).flatMap(entry => {
		const [key, value] = entry;

		const alias = randomString(10);

		if (value instanceof DkOp) {
			const updateExpressionPart = value.createUpdateExpressionPart({ key, alias, precedingKeys });

			return [updateExpressionPart];
		}

		if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
			const updateExpressionPrecedingKeyPart = {
				UpdateExpression: '',
				ExpressionAttributeNames: {
					[`#${alias}`]: key
				},
				ExpressionAttributeValues: {}
			};

			return [
				updateExpressionPrecedingKeyPart,
				...createUpdateExpressionParts(value, precedingKeys ? [...precedingKeys, alias] : [alias])
			];
		}

		const updateExpressionPart = createUpdateExpressionPart(alias, key, value, precedingKeys);

		return [updateExpressionPart];
	});
};

export const mergeUpdateExpressionParts = (parts: Array<DkUpdateExpressionParams>) =>
	parts.reduce(
		(accumulator, expressionPart) => {
			return {
				UpdateExpression: (accumulator.UpdateExpression || '') + expressionPart.UpdateExpression,
				ExpressionAttributeNames: {
					...accumulator.ExpressionAttributeNames,
					...expressionPart.ExpressionAttributeNames
				},
				ExpressionAttributeValues: {
					...accumulator.ExpressionAttributeValues,
					...expressionPart.ExpressionAttributeValues
				}
			};
		},
		{
			UpdateExpression: '',
			ExpressionAttributeNames: {},
			ExpressionAttributeValues: {}
		}
	);

export const convertObjectToUpdateExpression = <Attributes extends GenericAttributes>(attributes: Attributes) => {
	const parts = createUpdateExpressionParts(attributes);

	if (parts.length === 0) throw new Error('Invalid update object');

	const merged = mergeUpdateExpressionParts(parts);

	const updateExpression = {
		...merged,
		UpdateExpression: `SET ${merged.UpdateExpression!.trim().slice(0, -1)}`
	};

	return updateExpression;
};
