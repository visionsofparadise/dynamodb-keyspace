import { ScanCommand, ScanCommandInput, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DkCommand } from './Command';
import { GenericAttributes } from '../util/utils';
import { LowerCaseObjectKeys, lowerCaseKeys, upperCaseKeys } from '../util/keyCapitalize';
import { applyDefaults } from '../util/defaults';
import { DkClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';

const SCAN_COMMAND_INPUT_DATA_TYPE = 'ScanCommandInput' as const;
const SCAN_COMMAND_INPUT_HOOK = ['CommandInput', 'ReadCommandInput', SCAN_COMMAND_INPUT_DATA_TYPE] as const;

const SCAN_COMMAND_OUTPUT_DATA_TYPE = 'ScanCommandOutput' as const;
const SCAN_COMMAND_OUTPUT_HOOK = ['CommandOutput', 'ReadCommandOutput', SCAN_COMMAND_OUTPUT_DATA_TYPE] as const;

export interface DkScanCommandInput<CursorKey extends GenericAttributes = GenericAttributes>
	extends LowerCaseObjectKeys<Omit<ScanCommandInput, 'ExclusiveStartKey' | 'AttributesToGet' | 'ConditionalOperator'>> {
	cursorKey?: CursorKey;
}

export interface DkScanCommandOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	CursorKey extends GenericAttributes = GenericAttributes
> extends LowerCaseObjectKeys<Omit<ScanCommandOutput, 'Items' | 'LastEvaluatedKey'>> {
	items: Array<Attributes>;
	cursorKey?: CursorKey;
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
		const postDefaultsInput = applyDefaults(this.input, defaults, ['returnConsumedCapacity']);

		const { data: postMiddlewareInput } = await executeMiddlewares(
			[...this.inputMiddlewareConfig.hooks],
			{
				dataType: this.inputMiddlewareConfig.dataType,
				data: postDefaultsInput
			},
			middleware
		);

		const { cursorKey, ...rest } = postMiddlewareInput;

		const formattedInput = {
			exclusiveStartKey: cursorKey,
			...rest
		};

		const upperCaseInput = upperCaseKeys(formattedInput);

		return upperCaseInput;
	};

	handleOutput = async (
		output: ScanCommandOutput,
		{ middleware }: DkClientConfig
	): Promise<DkScanCommandOutput<Attributes, CursorKey>> => {
		const lowerCaseOutput = lowerCaseKeys(output);

		const items = (output.Items || []) as Array<Attributes>;
		const cursorKey = output.LastEvaluatedKey as CursorKey | undefined;

		const formattedOutput: DkScanCommandOutput<Attributes, CursorKey> = {
			...lowerCaseOutput,
			items,
			cursorKey
		};

		const { data: postMiddlewareOutput } = await executeMiddlewares(
			[...this.outputMiddlewareConfig.hooks],
			{
				dataType: this.outputMiddlewareConfig.dataType,
				data: formattedOutput
			},
			middleware
		);

		if (postMiddlewareOutput.consumedCapacity)
			await executeMiddleware(
				'ConsumedCapacity',
				{ dataType: 'ConsumedCapacity', data: postMiddlewareOutput.consumedCapacity },
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
