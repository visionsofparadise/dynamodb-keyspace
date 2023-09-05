import { BatchWriteCommand, BatchWriteCommandInput, BatchWriteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DkCommand } from './Command';
import { GenericAttributes } from '../util/utils';
import { applyDefaults } from '../util/defaults';
import { DkClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';
import { DeleteRequest, PutRequest } from '@aws-sdk/client-dynamodb';

const BATCH_WRITE_COMMAND_INPUT_DATA_TYPE = 'BatchWriteCommandInput' as const;
const BATCH_WRITE_COMMAND_INPUT_HOOK = [
	'CommandInput',
	'WriteCommandInput',
	BATCH_WRITE_COMMAND_INPUT_DATA_TYPE
] as const;

const BATCH_WRITE_COMMAND_OUTPUT_DATA_TYPE = 'BatchWriteCommandOutput' as const;
const BATCH_WRITE_COMMAND_OUTPUT_HOOK = [
	'CommandOutput',
	'WriteCommandOutput',
	BATCH_WRITE_COMMAND_OUTPUT_DATA_TYPE
] as const;

export interface DkBatchWriteCommandInput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends Omit<BatchWriteCommandInput, 'RequestItems'> {
	RequestItems: Record<
		string,
		Array<
			| { PutRequest: Omit<PutRequest, 'Item'> & { Item: Attributes } }
			| { DeleteRequest: Omit<DeleteRequest, 'Key'> & { Key: Key } }
		>
	>;
}

export interface DkBatchWriteCommandOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends Omit<BatchWriteCommandOutput, 'UnprocessedItems'> {
	UnprocessedItems: Record<
		string,
		Array<
			| { PutRequest: Omit<PutRequest, 'Item'> & { Item: Attributes } }
			| { DeleteRequest: Omit<DeleteRequest, 'Key'> & { Key: Key } }
		>
	>;
}

export class DkBatchWriteCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends DkCommand<
	typeof BATCH_WRITE_COMMAND_INPUT_DATA_TYPE,
	(typeof BATCH_WRITE_COMMAND_INPUT_HOOK)[number],
	DkBatchWriteCommandInput<Attributes, Key>,
	BatchWriteCommandInput,
	typeof BATCH_WRITE_COMMAND_OUTPUT_DATA_TYPE,
	(typeof BATCH_WRITE_COMMAND_OUTPUT_HOOK)[number],
	DkBatchWriteCommandOutput<Attributes, Key>,
	BatchWriteCommandOutput
> {
	constructor(input: DkBatchWriteCommandInput<Attributes, Key>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: BATCH_WRITE_COMMAND_INPUT_DATA_TYPE, hooks: BATCH_WRITE_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: BATCH_WRITE_COMMAND_OUTPUT_DATA_TYPE, hooks: BATCH_WRITE_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DkClientConfig): Promise<BatchWriteCommandInput> => {
		const postDefaultsInput = applyDefaults(this.input, defaults, [
			'ReturnConsumedCapacity',
			'ReturnItemCollectionMetrics'
		]);

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
		output: BatchWriteCommandOutput,
		{ middleware }: DkClientConfig
	): Promise<DkBatchWriteCommandOutput<Attributes, Key>> => {
		const typedOutput = output as DkBatchWriteCommandOutput<Attributes, Key>;

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

		if (postMiddlewareOutput.ItemCollectionMetrics) {
			await executeMiddleware(
				'ItemCollectionMetrics',
				{ dataType: 'ItemCollectionMetrics', data: postMiddlewareOutput.ItemCollectionMetrics },
				middleware
			);
		}

		return postMiddlewareOutput;
	};

	send = async (clientConfig: DkClientConfig) => {
		const input = await this.handleInput(clientConfig);

		const output = await clientConfig.client.send(new BatchWriteCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
