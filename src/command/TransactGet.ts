import { TransactGetCommand, TransactGetCommandInput, TransactGetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DkCommand } from './Command';
import { GenericAttributes } from '../util/utils';
import { applyDefaults } from '../util/defaults';
import { DkClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';
import { Get } from '@aws-sdk/client-dynamodb';

const TRANSACT_GET_COMMAND_INPUT_DATA_TYPE = 'TransactGetCommandInput' as const;
const TRANSACT_GET_COMMAND_INPUT_HOOK = [
	'CommandInput',
	'ReadCommandInput',
	TRANSACT_GET_COMMAND_INPUT_DATA_TYPE
] as const;

const TRANSACT_GET_COMMAND_OUTPUT_DATA_TYPE = 'TransactGetCommandOutput' as const;
const TRANSACT_GET_COMMAND_OUTPUT_HOOK = [
	'CommandOutput',
	'ReadCommandOutput',
	TRANSACT_GET_COMMAND_OUTPUT_DATA_TYPE
] as const;

export interface DkTransactGetCommandInput<Key extends GenericAttributes = GenericAttributes>
	extends Omit<TransactGetCommandInput, 'TransactItems'> {
	TransactItems: {
		Get: Omit<Get, 'Key'> & {
			Key: Key;
		};
	}[];
}

export interface DkTransactGetCommandOutput<Attributes extends GenericAttributes = GenericAttributes>
	extends Omit<TransactGetCommandOutput, 'Responses'> {
	Responses: Array<Attributes>;
}

export class DkTransactGetCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends DkCommand<
	typeof TRANSACT_GET_COMMAND_INPUT_DATA_TYPE,
	(typeof TRANSACT_GET_COMMAND_INPUT_HOOK)[number],
	DkTransactGetCommandInput<Key>,
	TransactGetCommandInput,
	typeof TRANSACT_GET_COMMAND_OUTPUT_DATA_TYPE,
	(typeof TRANSACT_GET_COMMAND_OUTPUT_HOOK)[number],
	DkTransactGetCommandOutput<Attributes>,
	TransactGetCommandOutput
> {
	constructor(input: DkTransactGetCommandInput<Key>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: TRANSACT_GET_COMMAND_INPUT_DATA_TYPE, hooks: TRANSACT_GET_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: TRANSACT_GET_COMMAND_OUTPUT_DATA_TYPE, hooks: TRANSACT_GET_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DkClientConfig): Promise<TransactGetCommandInput> => {
		const postDefaultsInput = applyDefaults(this.input, defaults, ['ReturnConsumedCapacity']);

		const { data: postMiddlewareInput } = await executeMiddlewares(
			[...this.inputMiddlewareConfig.hooks],
			{
				dataType: this.inputMiddlewareConfig.dataType,
				data: postDefaultsInput
			},
			middleware
		);

		return postMiddlewareInput;
	};

	handleOutput = async (
		output: TransactGetCommandOutput,
		{ middleware }: DkClientConfig
	): Promise<DkTransactGetCommandOutput<Attributes>> => {
		const typedOutput = output as DkTransactGetCommandOutput<Attributes>;

		const { data: postMiddlewareOutput } = await executeMiddlewares(
			[...this.outputMiddlewareConfig.hooks],
			{
				dataType: this.outputMiddlewareConfig.dataType,
				data: typedOutput
			},
			middleware
		);

		if (postMiddlewareOutput.ConsumedCapacity) {
			for (const consumedCapacity of postMiddlewareOutput.ConsumedCapacity) {
				await executeMiddleware(
					'ConsumedCapacity',
					{ dataType: 'ConsumedCapacity', data: consumedCapacity },
					middleware
				);
			}
		}

		return postMiddlewareOutput;
	};

	send = async (clientConfig: DkClientConfig) => {
		const input = await this.handleInput(clientConfig);

		const output = await clientConfig.client.send(new TransactGetCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
