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
				RequestItems: Object.fromEntries(
					Object.entries(batchWriteCommandInput.RequestItems).map(([tableName, RequestItems]) => [
						tableName,
						RequestItems.map(request => {
							if ('PutRequest' in request) {
								return {
									PutRequest: {
										...request.PutRequest,
										Item: {
											...request.PutRequest.Item,
											[key]: setter()
										}
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
				Item: {
					...putCommandInput.Item,
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
				TransactItems: transactWriteCommandInput.TransactItems.map(request => {
					return Object.fromEntries(
						Object.entries(request).map(([key, value]) => {
							if (key === 'Put') {
								return [
									key,
									value
										? {
												...value,
												Item: {
													...(value as any).Item,
													[key]: setter()
												}
										  }
										: value
								];
							}

							if (key === 'Update') {
								if (!(value as any).UpdateExpression?.startsWith('SET')) return [key, value];

								return [
									key,
									value
										? {
												...value,
												UpdateExpression: (value as any).UpdateExpression + `, ${key} = :${key}`,
												ExpressionAttributeValues: {
													...value.ExpressionAttributeValues,
													[`:${key}`]: setter()
												}
										  }
										: value
								];
							}

							return [key, value];
						})
					);
				})
			};
		}
	};

	const updateHandler: DkMiddlewareHandler<'UpdateCommandInput', DkCommandGenericData & { Attributes: Attributes }> = {
		hook: 'UpdateCommandInput',
		handler: ({ data: updateCommandInput }) => {
			if (!updateCommandInput.UpdateExpression?.startsWith('SET')) return;

			return {
				...updateCommandInput,
				UpdateExpression: updateCommandInput.UpdateExpression + `, ${key} = :${key}`,
				ExpressionAttributeValues: {
					...updateCommandInput.ExpressionAttributeValues,
					[`:${key}`]: setter()
				}
			};
		}
	};

	return [batchWriteHandler, putHandler, transactWriteHandler, updateHandler] as any;
};
