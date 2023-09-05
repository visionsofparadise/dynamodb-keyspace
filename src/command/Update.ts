import { UpdateCommand, UpdateCommandInput, UpdateCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DkCommand } from './Command';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { GenericAttributes } from '../util/utils';
import { ReturnValuesAttributes } from '../util/returnValuesAttributes';
import { applyDefaults } from '../util/defaults';
import { DkClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';

const UPDATE_COMMAND_INPUT_DATA_TYPE = 'UpdateCommandInput' as const;
const UPDATE_COMMAND_INPUT_HOOK = ['CommandInput', 'WriteCommandInput', UPDATE_COMMAND_INPUT_DATA_TYPE] as const;

const UPDATE_COMMAND_OUTPUT_DATA_TYPE = 'UpdateCommandOutput' as const;
const UPDATE_COMMAND_OUTPUT_HOOK = ['CommandOutput', 'WriteCommandOutput', UPDATE_COMMAND_OUTPUT_DATA_TYPE] as const;

export type DkUpdateReturnValues = ReturnValue | undefined;

export interface DkUpdateCommandInput<
	Key extends GenericAttributes = GenericAttributes,
	ReturnValues extends DkUpdateReturnValues = DkUpdateReturnValues
> extends Omit<UpdateCommandInput, 'Key' | 'ReturnValues' | 'AttributeUpdates' | 'Expected' | 'ConditionalOperator'> {
	Key: Key;
	ReturnValues?: ReturnValues;
}

export interface DkUpdateCommandOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	ReturnValues extends DkUpdateReturnValues = DkUpdateReturnValues
> extends Omit<UpdateCommandOutput, 'Attributes'> {
	Attributes: ReturnValuesAttributes<Attributes, ReturnValues>;
}

export class DkUpdateCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	Key extends GenericAttributes = GenericAttributes,
	ReturnValues extends DkUpdateReturnValues = DkUpdateReturnValues
> extends DkCommand<
	typeof UPDATE_COMMAND_INPUT_DATA_TYPE,
	(typeof UPDATE_COMMAND_INPUT_HOOK)[number],
	DkUpdateCommandInput<Key, ReturnValues>,
	UpdateCommandInput,
	typeof UPDATE_COMMAND_OUTPUT_DATA_TYPE,
	(typeof UPDATE_COMMAND_OUTPUT_HOOK)[number],
	DkUpdateCommandOutput<Attributes, ReturnValues>,
	UpdateCommandOutput
> {
	constructor(input: DkUpdateCommandInput<Key, ReturnValues>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: UPDATE_COMMAND_INPUT_DATA_TYPE, hooks: UPDATE_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: UPDATE_COMMAND_OUTPUT_DATA_TYPE, hooks: UPDATE_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DkClientConfig): Promise<UpdateCommandInput> => {
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
		output: UpdateCommandOutput,
		{ middleware }: DkClientConfig
	): Promise<DkUpdateCommandOutput<Attributes, ReturnValues>> => {
		const typedOutput = output as DkUpdateCommandOutput<Attributes, ReturnValues>;

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

		const output = await clientConfig.client.send(new UpdateCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
