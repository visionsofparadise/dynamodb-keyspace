import { ConsumedCapacity, ItemCollectionMetrics } from '@aws-sdk/client-dynamodb';
import { DkCommandGenericData, DkCommandMiddlewareData } from './command/Command';

export type DkMiddlewareHandlerDataType<DataType extends string, Data> = {
	dataType: DataType;
	data: Data;
};

export type DkMiddlewareConfigType<DataType extends string, Hook extends string, Data> = {
	hook: Hook;
	handlerData: DkMiddlewareHandlerDataType<DataType, Data>;
};

export type DkMiddlewareConfig<Data extends DkCommandGenericData = DkCommandGenericData> =
	| DkCommandMiddlewareData<Data>
	| DkMiddlewareConfigType<'ConsumedCapacity', 'ConsumedCapacity', ConsumedCapacity>
	| DkMiddlewareConfigType<'ItemCollectionMetrics', 'ItemCollectionMetrics', ItemCollectionMetrics>;

export type DkMiddlewareHook = DkMiddlewareConfig['hook'];
export type DkMiddlewareDataType = DkMiddlewareConfig['handlerData']['dataType'];

export type GetDkMiddlewareConfig<
	Hook extends DkMiddlewareHook = DkMiddlewareHook,
	Data extends DkCommandGenericData = DkCommandGenericData
> = Extract<DkMiddlewareConfig<Data>, { hook: Hook }>;

export type DkMiddlewareHandler<
	Hook extends DkMiddlewareHook = DkMiddlewareHook,
	Data extends DkCommandGenericData = DkCommandGenericData
> = {
	hook: Hook;
	handler: (
		params: GetDkMiddlewareConfig<Hook, Data>['handlerData']
	) =>
		| GetDkMiddlewareConfig<Hook, Data>['handlerData']['data']
		| Promise<GetDkMiddlewareConfig<Hook, Data>['handlerData']['data']>
		| undefined;
};

export const executeMiddleware = async <
	Hook extends DkMiddlewareHook,
	Params extends GetDkMiddlewareConfig<Hook>['handlerData']
>(
	hook: Hook,
	params: Params,
	middleware: Array<DkMiddlewareHandler>
) => {
	const recurse = async (currentParams: Params, remainingMiddleware: Array<DkMiddlewareHandler>): Promise<Params> => {
		if (remainingMiddleware.length === 0) return currentParams;

		const middleware = remainingMiddleware[0];
		const nextMiddlewares = remainingMiddleware.slice(1);

		if (middleware.hook !== hook) return recurse(currentParams, nextMiddlewares);

		const output = await middleware.handler(currentParams);

		const newParams = {
			dataType: currentParams.dataType,
			data: output || currentParams.data
		};

		return recurse(newParams as Params, nextMiddlewares);
	};

	return recurse(params, middleware);
};

export const executeMiddlewares = async <
	Hook extends DkMiddlewareHook,
	Params extends GetDkMiddlewareConfig<Hook>['handlerData']
>(
	hooks: Array<Hook>,
	params: Params,
	middleware: Array<DkMiddlewareHandler>
) => {
	const recurse = async (currentParams: Params, remainingHooks: Array<Hook>): Promise<Params> => {
		if (remainingHooks.length === 0) return currentParams;

		const hook = remainingHooks[0];
		const nextHooks = remainingHooks.slice(1);

		const newParams: Params = await executeMiddleware(hook, currentParams as any, middleware);

		return recurse(newParams, nextHooks);
	};

	return recurse(params, hooks);
};

export const appendMiddleware = (
	middlewares1: Array<DkMiddlewareHandler<DkMiddlewareHook, any>>,
	middlewares2: Array<DkMiddlewareHandler<DkMiddlewareHook, any>>
) => [...middlewares1, ...middlewares2];
