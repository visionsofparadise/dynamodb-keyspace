import { DkOp } from '../UpdateOp';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { GenericAttributes, randomString } from './utils';

export interface DkUpdateExpressionParams {
	updateExpression?: string;
	expressionAttributeNames?: Record<string, string>;
	expressionAttributeValues?: GenericAttributes;
}

const createUpdateExpressionPart = (
	alias: string,
	key: string,
	value: NativeAttributeValue,
	precedingKeys?: Array<string>
): DkUpdateExpressionParams => ({
	updateExpression: `${
		precedingKeys ? `${precedingKeys.map(key => `#${key}`).join('.')}.` : ''
	}#${alias} = :${alias}, `,
	expressionAttributeNames: {
		[`#${alias}`]: key
	},
	expressionAttributeValues: {
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
				updateExpression: '',
				expressionAttributeNames: {
					[`#${alias}`]: key
				},
				expressionAttributeValues: {}
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
				updateExpression: (accumulator.updateExpression || '') + expressionPart.updateExpression,
				expressionAttributeNames: {
					...accumulator.expressionAttributeNames,
					...expressionPart.expressionAttributeNames
				},
				expressionAttributeValues: {
					...accumulator.expressionAttributeValues,
					...expressionPart.expressionAttributeValues
				}
			};
		},
		{
			updateExpression: '',
			expressionAttributeNames: {},
			expressionAttributeValues: {}
		}
	);

export const convertObjectToUpdateExpression = <Attributes extends GenericAttributes>(attributes: Attributes) => {
	const parts = createUpdateExpressionParts(attributes);

	if (parts.length === 0) throw new Error('Invalid update object');

	const merged = mergeUpdateExpressionParts(parts);

	const updateExpression = {
		...merged,
		updateExpression: `SET ${merged.updateExpression!.trim().slice(0, -1)}`
	};

	return updateExpression;
};
