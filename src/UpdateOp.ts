import { DkUpdateExpressionParams } from './util/convertObjectToUpdateExpression';

type Params = {
	key: string;
	alias: string;
	precedingKeys?: Array<string>;
};

type CreateUpdateExpressionPart = (params: Params) => DkUpdateExpressionParams;

export class DkOp {
	constructor(public createUpdateExpressionPart: CreateUpdateExpressionPart) {}
}

const attributePath = ({ alias, precedingKeys }: Pick<Params, 'alias' | 'precedingKeys'>) =>
	`${
		precedingKeys && precedingKeys.length > 0
			? `${precedingKeys.map(precedingKey => `#${precedingKey}`).join('.')}.`
			: ''
	}#${alias}`;

export const dkOp = {
	Value: <T = any>(value: T) => {
		const output = new DkOp(({ key, alias, precedingKeys }) => {
			return {
				updateExpression: `${attributePath({ alias, precedingKeys })} = :${alias}, `,
				expressionAttributeNames: {
					[`#${alias}`]: key
				},
				expressionAttributeValues: {
					[`:${alias}`]: value
				}
			};
		});

		return output as T;
	},

	Add: (value: number) => {
		const output = new DkOp(({ key, alias, precedingKeys }) => {
			const path = attributePath({ alias, precedingKeys });

			return {
				updateExpression: `${path} = ${path} + :${alias}, `,
				expressionAttributeNames: {
					[`#${alias}`]: key
				},
				expressionAttributeValues: {
					[`:${alias}`]: value
				}
			};
		});

		return output as unknown as number;
	},

	Minus: (value: number) => {
		const output = new DkOp(({ key, alias, precedingKeys }) => {
			const path = attributePath({ alias, precedingKeys });

			return {
				updateExpression: `${path} = ${path} - :${alias}, `,
				expressionAttributeNames: {
					[`#${alias}`]: key
				},
				expressionAttributeValues: {
					[`:${alias}`]: value
				}
			};
		});

		return output as unknown as number;
	},

	ListAppend: <T extends unknown>(value: Array<T>, end: 'head' | 'tail' = 'tail') => {
		const output = new DkOp(({ key, alias, precedingKeys }) => {
			const path = attributePath({ alias, precedingKeys });

			return {
				updateExpression: `${path} = list_append(${end === 'head' ? `:${alias}, ${path}` : `${path}, :${alias}`}), `,
				expressionAttributeNames: {
					[`#${alias}`]: key
				},
				expressionAttributeValues: {
					[`:${alias}`]: value
				}
			};
		});

		return output as unknown as Array<T>;
	},

	IfNotExists: <T = unknown>(value: T) => {
		const output = new DkOp(({ key, alias, precedingKeys }) => {
			const path = attributePath({ alias, precedingKeys });

			return {
				updateExpression: `${path} = if_not_exists(${path}, :${alias}), `,
				expressionAttributeNames: {
					[`#${alias}`]: key
				},
				expressionAttributeValues: {
					[`:${alias}`]: value
				}
			};
		});

		return output as T;
	}
};
