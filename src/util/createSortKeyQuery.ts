export type DkQuickQueryOperators = {
	BeginsWith?: string | number;
	GreaterThan?: string | number;
	LessThan?: string | number;
};

export const createQueryQuickSort = (sortKey?: string | undefined, operators?: DkQuickQueryOperators) => {
	if (operators && sortKey) {
		if (operators.GreaterThan && operators.LessThan) {
			return {
				KeyConditionExpression: `AND ${sortKey} BETWEEN :min AND :max`,
				ExpressionAttributeValues: {
					[`:min`]: operators.GreaterThan,
					[`:max`]: operators.LessThan
				}
			};
		}

		if (operators.LessThan) {
			return {
				KeyConditionExpression: `AND ${sortKey} < :max`,
				ExpressionAttributeValues: {
					[`:max`]: operators.LessThan
				}
			};
		}

		if (operators.GreaterThan) {
			return {
				KeyConditionExpression: `AND ${sortKey} > :min`,
				ExpressionAttributeValues: {
					[`:min`]: operators.GreaterThan
				}
			};
		}

		if (operators.BeginsWith) {
			return {
				KeyConditionExpression: `AND begins_with(${sortKey}, :beginsWith)`,
				ExpressionAttributeValues: {
					[`:beginsWith`]: operators.BeginsWith
				}
			};
		}
	}

	return {
		KeyConditionExpression: ``,
		ExpressionAttributeValues: {}
	};
};
