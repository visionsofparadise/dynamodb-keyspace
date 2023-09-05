import { TransactWriteCommand, TransactWriteCommandInput, TransactWriteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DkCommand } from './Command';
import { GenericAttributes } from '../util/utils';
import { applyDefaults } from '../util/defaults';
import { DkClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';
import { ConditionCheck, Delete, Put, TransactWriteItem, Update } from '@aws-sdk/client-dynamodb';

const TRANSACT_WRITE_COMMAND_INPUT_DATA_TYPE = 'TransactWriteCommandInput' as const;
const TRANSACT_WRITE_COMMAND_INPUT_HOOK = [
	'CommandInput',
	'WriteCommandInput',
	TRANSACT_WRITE_COMMAND_INPUT_DATA_TYPE
] as const;

const TRANSACT_WRITE_COMMAND_OUTPUT_DATA_TYPE = 'TransactWriteCommandOutput' as const;
const TRANSACT_WRITE_COMMAND_OUTPUT_HOOK = [
	'CommandOutput',
	'WriteCommandOutput',
	TRANSACT_WRITE_COMMAND_OUTPUT_DATA_TYPE
] as const;

export interface DkTransactWriteCommandInput<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends Omit<TransactWriteCommandInput, 'TransactItems'> {
	TransactItems: (Omit<TransactWriteItem, 'ConditionCheck' | 'Put' | 'Delete' | 'Update'> & {
		ConditionCheck?: Omit<ConditionCheck, 'Key'> & {
			Key: Key;
		};
		Delete?: Omit<Delete, 'Key'> & {
			Key: Key;
		};
		Put?: Omit<Put, 'Item'> & {
			Item: Attributes;
		};
		Update?: Omit<Update, 'Key'> & {
			Key: Key;
		};
	})[];
}

export interface DkTransactWriteCommandOutput extends TransactWriteCommandOutput {}

export class DkTransactWriteCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes
> extends DkCommand<
	typeof TRANSACT_WRITE_COMMAND_INPUT_DATA_TYPE,
	(typeof TRANSACT_WRITE_COMMAND_INPUT_HOOK)[number],
	DkTransactWriteCommandInput<Attributes, Key>,
	TransactWriteCommandInput,
	typeof TRANSACT_WRITE_COMMAND_OUTPUT_DATA_TYPE,
	(typeof TRANSACT_WRITE_COMMAND_OUTPUT_HOOK)[number],
	DkTransactWriteCommandOutput,
	TransactWriteCommandOutput
> {
	constructor(input: DkTransactWriteCommandInput<Attributes, Key>) {
		super(input);
	}

	inputMiddlewareConfig = {
		dataType: TRANSACT_WRITE_COMMAND_INPUT_DATA_TYPE,
		hooks: TRANSACT_WRITE_COMMAND_INPUT_HOOK
	};
	outputMiddlewareConfig = {
		dataType: TRANSACT_WRITE_COMMAND_OUTPUT_DATA_TYPE,
		hooks: TRANSACT_WRITE_COMMAND_OUTPUT_HOOK
	};

	handleInput = async ({ defaults, middleware }: DkClientConfig): Promise<TransactWriteCommandInput> => {
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
		output: TransactWriteCommandOutput,
		{ middleware }: DkClientConfig
	): Promise<DkTransactWriteCommandOutput> => {
		const { data: postMiddlewareOutput } = await executeMiddlewares(
			[...this.outputMiddlewareConfig.hooks],
			{
				dataType: this.outputMiddlewareConfig.dataType,
				data: output
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

		const output = await clientConfig.client.send(new TransactWriteCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
