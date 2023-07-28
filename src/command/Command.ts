import { DkPutCommand } from './Put';
import { DkGetCommand } from './Get';
import { DkMiddlewareConfigType } from '../Middleware';
import { DkUpdateCommand } from './Update';
import { DkClientConfig } from '../Client';
import { DkDeleteCommand } from './Delete';
import { DkQueryCommand } from './Query';
import { DkScanCommand } from './Scan';
import { DkBatchGetCommand } from './BatchGet';
import { DkBatchWriteCommand } from './BatchWrite';
import { DkTransactGetCommand } from './TransactGet';
import { DkTransactWriteCommand } from './TransactWrite';
import { GenericAttributes } from '../util/utils';

export interface DkCommandGenericData {
	Attributes: GenericAttributes;
	Key: GenericAttributes;
	CursorKey: GenericAttributes;
}

export type DkCommandMap<Data extends DkCommandGenericData = DkCommandGenericData> = {
	BatchGetCommand: DkBatchGetCommand<Data['Attributes'], Data['Key']>;
	BatchWriteCommand: DkBatchWriteCommand<Data['Attributes'], Data['Key']>;
	DeleteCommand: DkDeleteCommand<Data['Attributes'], Data['Key'], any>;
	GetCommand: DkGetCommand<Data['Attributes'], Data['Key']>;
	PutCommand: DkPutCommand<Data['Attributes'], any>;
	QueryCommand: DkQueryCommand<Data['Attributes'], Data['CursorKey']>;
	ScanCommand: DkScanCommand<Data['Attributes'], Data['CursorKey']>;
	TransactGetCommand: DkTransactGetCommand<Data['Attributes'], Data['Key']>;
	TransactWriteCommand: DkTransactWriteCommand<Data['Attributes'], Data['Key']>;
	UpdateCommand: DkUpdateCommand<Data['Attributes'], Data['Key'], any>;
};

export type DkCommandMiddlewareData<Data extends DkCommandGenericData = DkCommandGenericData> = {
	[x in keyof DkCommandMap]:
		| {
				[y in DkCommandMap[x]['inputMiddlewareConfig']['hooks'][number]]: DkMiddlewareConfigType<
					DkCommandMap[x]['inputMiddlewareConfig']['dataType'],
					y,
					DkCommandMap<Data>[x]['Input']
				>;
		  }[DkCommandMap[x]['inputMiddlewareConfig']['hooks'][number]]
		| {
				[y in DkCommandMap[x]['outputMiddlewareConfig']['hooks'][number]]: DkMiddlewareConfigType<
					DkCommandMap[x]['outputMiddlewareConfig']['dataType'],
					y,
					DkCommandMap<Data>[x]['Output']
				>;
		  }[DkCommandMap[x]['outputMiddlewareConfig']['hooks'][number]];
}[keyof DkCommandMap];

export abstract class DkCommand<
	InputDataType extends string,
	InputHook extends string,
	Input extends object,
	BaseInput extends object,
	OutputDataType extends string,
	OutputHook extends string,
	Output extends object,
	BaseOutput extends object
> {
	constructor(public readonly input: Input) {}

	Input!: Input;
	Output!: Output;

	abstract inputMiddlewareConfig: { dataType: InputDataType; hooks: Readonly<Array<InputHook>> };
	abstract outputMiddlewareConfig: { dataType: OutputDataType; hooks: Readonly<Array<OutputHook>> };

	abstract handleInput: (clientConfig: DkClientConfig) => Promise<BaseInput>;
	abstract handleOutput: (output: BaseOutput, clientConfig: DkClientConfig) => Promise<Output>;

	abstract send: (clientConfig: DkClientConfig) => Promise<Output>;
}
