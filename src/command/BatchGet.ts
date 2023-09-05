import { BatchGetCommand, BatchGetCommandInput, BatchGetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DkCommand } from './Command';
import { applyDefaults } from '../util/defaults';
import { DkClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';
import { KeysAndAttributes } from '@aws-sdk/client-dynamodb';
import { GenericAttributes } from '../util/utils';

const BATCH_GET_COMMAND_INPUT_DATA_TYPE = 'BatchGetCommandInput' as const;
const BATCH_GET_COMMAND_INPUT_HOOK = ['CommandInput', 'ReadCommandInput', BATCH_GET_COMMAND_INPUT_DATA_TYPE] as const;

const BATCH_GET_COMMAND_OUTPUT_DATA_TYPE = 'BatchGetCommandOutput' as const;
const BATCH_GET_COMMAND_OUTPUT_HOOK = [
	'CommandOutput',
	'ReadCommandOutput',
	BATCH_GET_COMMAND_OUTPUT_DATA_TYPE
] as const;

export interface DkBatchGetCommandInput<Key extends GenericAttributes = GenericAttributes>
	extends Omit<BatchGetCommandInput, 'RequestItems'> {
	RequestItems: Record<
		string,
		Omit<KeysAndAttributes, 'Keys' | 'AttributesToGet'> & {
			Keys: Key[];
		}
	>;
}

export interface DkBatchGetCommandOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends Omit<BatchGetCommandOutput, 'Responses' | 'UnprocessedKeys'> {
	Responses: Record<string, Attributes[]>;
	UnprocessedKeys: Record<
		string,
		| (Omit<KeysAndAttributes, 'Keys' | 'AttributesToGet'> & {
				Keys: Key[];
		  })
		| undefined
	>;
}

export class DkBatchGetCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends DkCommand<
	typeof BATCH_GET_COMMAND_INPUT_DATA_TYPE,
	(typeof BATCH_GET_COMMAND_INPUT_HOOK)[number],
	DkBatchGetCommandInput<Key>,
	BatchGetCommandInput,
	typeof BATCH_GET_COMMAND_OUTPUT_DATA_TYPE,
	(typeof BATCH_GET_COMMAND_OUTPUT_HOOK)[number],
	DkBatchGetCommandOutput<Attributes, Key>,
	BatchGetCommandOutput
> {
	constructor(input: DkBatchGetCommandInput<Key>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: BATCH_GET_COMMAND_INPUT_DATA_TYPE, hooks: BATCH_GET_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: BATCH_GET_COMMAND_OUTPUT_DATA_TYPE, hooks: BATCH_GET_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DkClientConfig): Promise<BatchGetCommandInput> => {
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
		output: BatchGetCommandOutput,
		{ middleware }: DkClientConfig
	): Promise<DkBatchGetCommandOutput<Attributes, Key>> => {
		const typedOutput = output as DkBatchGetCommandOutput<Attributes, Key>;

		const { data: postMiddlewareOutput } = await executeMiddlewares(
			[...this.outputMiddlewareConfig.hooks],
			{
				dataType: this.outputMiddlewareConfig.dataType,
				data: typedOutput
			},
			middleware
		);

		if (postMiddlewareOutput.ConsumedCapacity) {
			for (const ConsumedCapacity of postMiddlewareOutput.ConsumedCapacity) {
				await executeMiddleware(
					'ConsumedCapacity',
					{ dataType: 'ConsumedCapacity', data: ConsumedCapacity },
					middleware
				);
			}
		}

		return postMiddlewareOutput;
	};

	send = async (clientConfig: DkClientConfig) => {
		const input = await this.handleInput(clientConfig);

		const output = await clientConfig.client.send(new BatchGetCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
