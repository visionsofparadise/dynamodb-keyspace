import { ScanCommand, ScanCommandInput, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DkCommand } from './Command';
import { GenericAttributes } from '../util/utils';
import { applyDefaults } from '../util/defaults';
import { DkClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';

const SCAN_COMMAND_INPUT_DATA_TYPE = 'ScanCommandInput' as const;
const SCAN_COMMAND_INPUT_HOOK = ['CommandInput', 'ReadCommandInput', SCAN_COMMAND_INPUT_DATA_TYPE] as const;

const SCAN_COMMAND_OUTPUT_DATA_TYPE = 'ScanCommandOutput' as const;
const SCAN_COMMAND_OUTPUT_HOOK = ['CommandOutput', 'ReadCommandOutput', SCAN_COMMAND_OUTPUT_DATA_TYPE] as const;

export interface DkScanCommandInput<ExclusiveStartKey extends GenericAttributes = GenericAttributes>
	extends Omit<ScanCommandInput, 'ExclusiveStartKey' | 'AttributesToGet' | 'ConditionalOperator'> {
	ExclusiveStartKey?: ExclusiveStartKey;
}

export interface DkScanCommandOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	LastEvaluatedKey extends GenericAttributes = GenericAttributes
> extends Omit<ScanCommandOutput, 'Items' | 'LastEvaluatedKey'> {
	Items: Array<Attributes>;
	LastEvaluatedKey?: LastEvaluatedKey;
}

export class DkScanCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	CursorKey extends GenericAttributes = GenericAttributes
> extends DkCommand<
	typeof SCAN_COMMAND_INPUT_DATA_TYPE,
	(typeof SCAN_COMMAND_INPUT_HOOK)[number],
	DkScanCommandInput<CursorKey>,
	ScanCommandInput,
	typeof SCAN_COMMAND_OUTPUT_DATA_TYPE,
	(typeof SCAN_COMMAND_OUTPUT_HOOK)[number],
	DkScanCommandOutput<Attributes, CursorKey>,
	ScanCommandOutput
> {
	constructor(input: DkScanCommandInput<CursorKey>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: SCAN_COMMAND_INPUT_DATA_TYPE, hooks: SCAN_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: SCAN_COMMAND_OUTPUT_DATA_TYPE, hooks: SCAN_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DkClientConfig): Promise<ScanCommandInput> => {
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
		output: ScanCommandOutput,
		{ middleware }: DkClientConfig
	): Promise<DkScanCommandOutput<Attributes, CursorKey>> => {
		const typedOutput = output as DkScanCommandOutput<Attributes, CursorKey>;

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

		return postMiddlewareOutput;
	};

	send = async (clientConfig: DkClientConfig) => {
		const input = await this.handleInput(clientConfig);

		const output = await clientConfig.client.send(new ScanCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
