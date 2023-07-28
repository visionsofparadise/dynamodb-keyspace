import { QueryCommand, QueryCommandInput, QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DkCommand } from './Command';
import { GenericAttributes } from '../util/utils';
import { LowerCaseObjectKeys, lowerCaseKeys, upperCaseKeys } from '../util/keyCapitalize';
import { applyDefaults } from '../util/defaults';
import { DkClientConfig } from '../Client';
import { executeMiddlewares, executeMiddleware } from '../Middleware';

export enum DkQueryItemsSort {
	ASCENDING = 'ascending',
	DESCENDING = 'descending'
}

const QUERY_COMMAND_INPUT_DATA_TYPE = 'QueryCommandInput' as const;
const QUERY_COMMAND_INPUT_HOOK = ['CommandInput', 'ReadCommandInput', QUERY_COMMAND_INPUT_DATA_TYPE] as const;

const QUERY_COMMAND_OUTPUT_DATA_TYPE = 'QueryCommandOutput' as const;
const QUERY_COMMAND_OUTPUT_HOOK = ['CommandOutput', 'ReadCommandOutput', QUERY_COMMAND_OUTPUT_DATA_TYPE] as const;

export interface DkQueryCommandInput<CursorKey extends GenericAttributes = GenericAttributes>
	extends LowerCaseObjectKeys<
		Omit<
			QueryCommandInput,
			'ExclusiveStartKey' | 'IndexName' | 'ScanIndexForward' | 'AttributesToGet' | 'ConditionalOperator'
		>
	> {
	index?: string | undefined;
	cursorKey?: CursorKey;
	sort?: DkQueryItemsSort;
}

export interface DkQueryCommandOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	CursorKey extends GenericAttributes = GenericAttributes
> extends LowerCaseObjectKeys<Omit<QueryCommandOutput, 'Items' | 'LastEvaluatedKey'>> {
	items: Array<Attributes>;
	cursorKey?: CursorKey;
}

export class DkQueryCommand<
	Attributes extends GenericAttributes = GenericAttributes,
	CursorKey extends GenericAttributes = GenericAttributes
> extends DkCommand<
	typeof QUERY_COMMAND_INPUT_DATA_TYPE,
	(typeof QUERY_COMMAND_INPUT_HOOK)[number],
	DkQueryCommandInput<CursorKey>,
	QueryCommandInput,
	typeof QUERY_COMMAND_OUTPUT_DATA_TYPE,
	(typeof QUERY_COMMAND_OUTPUT_HOOK)[number],
	DkQueryCommandOutput<Attributes, CursorKey>,
	QueryCommandOutput
> {
	constructor(input: DkQueryCommandInput<CursorKey>) {
		super(input);
	}

	inputMiddlewareConfig = { dataType: QUERY_COMMAND_INPUT_DATA_TYPE, hooks: QUERY_COMMAND_INPUT_HOOK };
	outputMiddlewareConfig = { dataType: QUERY_COMMAND_OUTPUT_DATA_TYPE, hooks: QUERY_COMMAND_OUTPUT_HOOK };

	handleInput = async ({ defaults, middleware }: DkClientConfig): Promise<QueryCommandInput> => {
		const postDefaultsInput = applyDefaults(this.input, defaults, ['returnConsumedCapacity']);

		const { data: postMiddlewareInput } = await executeMiddlewares(
			[...this.inputMiddlewareConfig.hooks],
			{
				dataType: this.inputMiddlewareConfig.dataType,
				data: postDefaultsInput
			},
			middleware
		);

		const { cursorKey, index, sort = DkQueryItemsSort.ASCENDING, ...rest } = postMiddlewareInput;

		const formattedInput = {
			exclusiveStartKey: cursorKey,
			indexName: index,
			scanIndexForward: sort === DkQueryItemsSort.ASCENDING ? true : false,
			...rest
		};

		const upperCaseInput = upperCaseKeys(formattedInput);

		return upperCaseInput;
	};

	handleOutput = async (
		output: QueryCommandOutput,
		{ middleware }: DkClientConfig
	): Promise<DkQueryCommandOutput<Attributes, CursorKey>> => {
		const lowerCaseOutput = lowerCaseKeys(output);

		const items = (output.Items || []) as Array<Attributes>;
		const cursorKey = output.LastEvaluatedKey as CursorKey | undefined;

		const formattedOutput: DkQueryCommandOutput<Attributes, CursorKey> = {
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

		const output = await clientConfig.client.send(new QueryCommand(input));

		return this.handleOutput(output, clientConfig);
	};
}
