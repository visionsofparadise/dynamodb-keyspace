import { DkMiddlewareHandler } from '../Middleware';
import { GenericAttributes } from '../util/utils';
import { DkCommandGenericData } from '../command/Command';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';

export const dkSetAttributeOnWriteMiddleware = <Attributes extends GenericAttributes = GenericAttributes>(
	key: string & keyof Attributes,
	setter: () => NativeAttributeValue
): Array<DkMiddlewareHandler> => {
	const batchWriteHandler: DkMiddlewareHandler<
		'BatchWriteCommandInput',
		DkCommandGenericData & { Attributes: Attributes }
	> = {
		hook: 'BatchWriteCommandInput',
		handler: ({ data: batchWriteCommandInput }) => {
			return {
				...batchWriteCommandInput,
				requests: Object.fromEntries(
					Object.entries(batchWriteCommandInput.requests).map(([tableName, requests]) => [
						tableName,
						requests.map(request => {
							if ('put' in request) {
								return {
									put: {
										...request.put,
										[key]: setter()
									}
								};
							}

							return request;
						})
					])
				)
			};
		}
	};

	const putHandler: DkMiddlewareHandler<'PutCommandInput', DkCommandGenericData & { Attributes: Attributes }> = {
		hook: 'PutCommandInput',
		handler: ({ data: putCommandInput }) => {
			return {
				...putCommandInput,
				item: {
					...putCommandInput.item,
					[key]: setter()
				}
			};
		}
	};

	const transactWriteHandler: DkMiddlewareHandler<
		'TransactWriteCommandInput',
		DkCommandGenericData & { Attributes: Attributes }
	> = {
		hook: 'TransactWriteCommandInput',
		handler: ({ data: transactWriteCommandInput }) => {
			return {
				...transactWriteCommandInput,
				requests: transactWriteCommandInput.requests.map(request => {
					if (request.type === 'put') {
						return {
							...request,
							item: {
								...request.item,
								[key]: setter()
							}
						};
					}

					if (request.type === 'update') {
						if (!request.updateExpression!.startsWith('SET')) return request;

						return {
							...request,
							updateExpression: request.updateExpression + `, ${key} = :${key}`,
							expressionAttributeValues: {
								...request.expressionAttributeValues,
								[`:${key}`]: setter()
							}
						};
					}

					return request;
				})
			};
		}
	};

	const updateHandler: DkMiddlewareHandler<'UpdateCommandInput', DkCommandGenericData & { Attributes: Attributes }> = {
		hook: 'UpdateCommandInput',
		handler: ({ data: updateCommandInput }) => {
			if (!updateCommandInput.updateExpression!.startsWith('SET')) return;

			return {
				...updateCommandInput,
				updateExpression: updateCommandInput.updateExpression + `, ${key} = :${key}`,
				expressionAttributeValues: {
					...updateCommandInput.expressionAttributeValues,
					[`:${key}`]: setter()
				}
			};
		}
	};

	return [batchWriteHandler, putHandler, transactWriteHandler, updateHandler] as any;
};
