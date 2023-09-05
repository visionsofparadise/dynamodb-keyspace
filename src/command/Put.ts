import { PutCommand, PutCommandInput, PutCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DkCommand } from './Command';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { GenericAttributes } from '../util/utils';
import { ReturnValuesAttributes } from '../util/returnValuesAttributes';
import { executeMiddleware, executeMiddlewares } from '../Middleware';
import { DkClientConfig } from '../Client';
import { applyDefaults } from '../util/defaults';

const PUT_COMMAND_INPUT_DATA_TYPE = 'PutCommandInput' as const;
const PUT_COMMAND_INPUT_HOOK = ['CommandInput', 'WriteCommandInput', PUT_COMMAND_INPUT_DATA_TYPE] as const;

const PUT_COMMAND_OUTPUT_DATA_TYPE = 'PutCommandOutput' as const;
const PUT_COMMAND_OUTPUT_HOOK = ['CommandOutput', 'WriteCommandOutput', PUT_COMMAND_OUTPUT_DATA_TYPE] as const;

export type DkPutReturnValues = Extract<ReturnValue, 'ALL_OLD' | 'NONE'> | undefined;

export interface DkPutCommandInput<
	Attributes extends GenericAttributes = GenericAttributes,
	ReturnValues extends DkPutReturnValues = undefined
> extends Omit<PutCommandInput, 'Item' | 'ReturnValues' | 'Expected' | 'ConditionalOperator'> {
	Item: Attributes;
	ReturnValues?: ReturnValues;
}

export interface DkPutCommandOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	ReturnValues extends DkPutReturnValues = undefined
> extends Omit<PutCommandOutput, 'Attributes'> {
	Attributes: ReturnValuesAttributes<Attributes, ReturnValues>;
}

export class DkPutCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	ReturnValues extends DkPutReturnValues = undefined
> extends DkCommand<
	typeof PUT_COMMAND_INPUT_DATA_TYPE,
	(typeof PUT_COMMAND_INPUT_HOOK)[number],
	DkPutCommandInput<Attributes, ReturnValues>,
	PutCommandInput,
	typeof PUT_COMMAND_OUTPUT_DATA_TYPE,
	(typeof PUT_COMMAND_OUTPUT_HOOK)[number],
	DkPutCommandOutput<Attributes, ReturnValues>,
	PutCommandOutput
> {
	constructor(input: DkPutCommandInput<Attributes, ReturnValues>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: PUT_COMMAND_INPUT_DATA_TYPE, hooks: PUT_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: PUT_COMMAND_OUTPUT_DATA_TYPE, hooks: PUT_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DkClientConfig): Promise<PutCommandInput> => {
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
		output: PutCommandOutput,
		{ middleware }: DkClientConfig
	): Promise<DkPutCommandOutput<Attributes, ReturnValues>> => {
		const typedOutput = output as DkPutCommandOutput<Attributes, ReturnValues>;

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

		const output = await clientConfig.client.send(new PutCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
