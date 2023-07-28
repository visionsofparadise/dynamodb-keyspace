import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DkCommand } from './command/Command';
import { Defaults } from './util/defaults';
import { DkMiddlewareHandler } from './Middleware';
import { ILogger } from './util/utils';

export interface DkClientConfig {
	client: DynamoDBDocumentClient;
	defaults: Defaults;
	middleware: Array<DkMiddlewareHandler>;
	logger?: ILogger;
}

export class DkClient implements DkClientConfig {
	defaults: Defaults = {};
	middleware: Array<DkMiddlewareHandler> = [];
	logger?: ILogger;

	constructor(public client: DynamoDBDocumentClient) {}

	setClient = (client?: DynamoDBDocumentClient) => {
		if (client) this.client = client;
	};

	setDefaults = (defaults?: Defaults) => {
		if (defaults) this.defaults = defaults;
	};

	setMiddleware = (middleware?: Array<DkMiddlewareHandler>) => {
		if (middleware) this.middleware = middleware;
	};

	setLogger = (logger?: ILogger) => {
		if (logger) this.logger = logger;
	};

	send = async <Command extends DkCommand<any, any, any, any, any, any, any, any>>(
		command: Command
	): Promise<ReturnType<Command['send']>> => {
		return command.send({
			client: this.client,
			defaults: this.defaults,
			middleware: this.middleware
		});
	};
}
