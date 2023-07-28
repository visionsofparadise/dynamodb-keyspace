export type DkQuickQueryOperators = {
	beginsWith?: string | number;
	greaterThan?: string | number;
	lessThan?: string | number;
};

export const createQueryQuickSort = (sortKey?: string | undefined, operators?: DkQuickQueryOperators) => {
	if (operators && sortKey) {
		if (operators.greaterThan && operators.lessThan) {
			return {
				keyConditionExpression: `AND ${sortKey} BETWEEN :min AND :max`,
				expressionAttributeValues: {
					[`:min`]: operators.greaterThan,
					[`:max`]: operators.lessThan
				}
			};
		}

		if (operators.lessThan) {
			return {
				keyConditionExpression: `AND ${sortKey} < :max`,
				expressionAttributeValues: {
					[`:max`]: operators.lessThan
				}
			};
		}

		if (operators.greaterThan) {
			return {
				keyConditionExpression: `AND ${sortKey} > :min`,
				expressionAttributeValues: {
					[`:min`]: operators.greaterThan
				}
			};
		}

		if (operators.beginsWith) {
			return {
				keyConditionExpression: `AND begins_with(${sortKey}, :beginsWith)`,
				expressionAttributeValues: {
					[`:beginsWith`]: operators.beginsWith
				}
			};
		}
	}

	return {
		KeyConditionExpression: ``,
		ExpressionAttributeValues: {}
	};
};
