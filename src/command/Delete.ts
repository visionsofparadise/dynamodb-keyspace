import { DeleteCommand, DeleteCommandInput, DeleteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DkCommand } from './Command';
import { GenericAttributes } from '../util/utils';
import { applyDefaults } from '../util/defaults';
import { DkClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { ReturnValuesAttributes } from '../util/returnValuesAttributes';

const DELETE_COMMAND_INPUT_DATA_TYPE = 'DeleteCommandInput' as const;
const DELETE_COMMAND_INPUT_HOOK = ['CommandInput', 'WriteCommandInput', DELETE_COMMAND_INPUT_DATA_TYPE] as const;

const DELETE_COMMAND_OUTPUT_DATA_TYPE = 'DeleteCommandOutput' as const;
const DELETE_COMMAND_OUTPUT_HOOK = ['CommandOutput', 'WriteCommandOutput', DELETE_COMMAND_OUTPUT_DATA_TYPE] as const;

export type DkDeleteReturnValues = Extract<ReturnValue, 'ALL_OLD' | 'NONE'> | undefined;

export interface DkDeleteCommandInput<
	Key extends GenericAttributes = GenericAttributes,
	ReturnValues extends DkDeleteReturnValues = undefined
> extends Omit<DeleteCommandInput, 'Key' | 'ReturnValues'> {
	Key: Key;
	ReturnValues?: ReturnValues;
}

export interface DkDeleteCommandOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	ReturnValues extends DkDeleteReturnValues = undefined
> extends Omit<DeleteCommandOutput, 'Attributes'> {
	Attributes: ReturnValuesAttributes<Attributes, ReturnValues>;
}

export class DkDeleteCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes,
	ReturnValues extends DkDeleteReturnValues = undefined
> extends DkCommand<
	typeof DELETE_COMMAND_INPUT_DATA_TYPE,
	(typeof DELETE_COMMAND_INPUT_HOOK)[number],
	DkDeleteCommandInput<Key, ReturnValues>,
	DeleteCommandInput,
	typeof DELETE_COMMAND_OUTPUT_DATA_TYPE,
	(typeof DELETE_COMMAND_OUTPUT_HOOK)[number],
	DkDeleteCommandOutput<Attributes, ReturnValues>,
	DeleteCommandOutput
> {
	constructor(input: DkDeleteCommandInput<Key, ReturnValues>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: DELETE_COMMAND_INPUT_DATA_TYPE, hooks: DELETE_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: DELETE_COMMAND_OUTPUT_DATA_TYPE, hooks: DELETE_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DkClientConfig): Promise<DeleteCommandInput> => {
		const postDefaultsInput = applyDefaults(this.input, defaults, [
			'ReturnConsumedCapacity',
			'ReturnItemCollectionMetrics',
			'ReturnValuesOnConditionCheckFailure'
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
		output: DeleteCommandOutput,
		{ middleware }: DkClientConfig
	): Promise<DkDeleteCommandOutput<Attributes, ReturnValues>> => {
		const typedOutput = output as DkDeleteCommandOutput<Attributes, ReturnValues>;

		const { data: postMiddlewareOutput } = await executeMiddlewares(
			[...this.outputMiddlewareConfig.hooks],
			{
				dataType: this.outputMiddlewareConfig.dataType,
				data: typedOutput
			},
			middleware
		);

		if (postMiddlewareOutput.ConsumedCapacity)
			await executeMiddleware(
				'ConsumedCapacity',
				{ dataType: 'ConsumedCapacity', data: postMiddlewareOutput.ConsumedCapacity },
				middleware
			);

		if (postMiddlewareOutput.ItemCollectionMetrics)
			await executeMiddleware(
				'ItemCollectionMetrics',
				{ dataType: 'ItemCollectionMetrics', data: postMiddlewareOutput.ItemCollectionMetrics },
				middleware
			);

		return postMiddlewareOutput;
	};

	send = async (clientConfig: DkClientConfig) => {
		const input = await this.handleInput(clientConfig);

		const output = await clientConfig.client.send(new DeleteCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
