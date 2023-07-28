import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { GenericAttributes } from '../util/utils';

export type DkFullReturnValues = Extract<ReturnValue, 'ALL_NEW' | 'ALL_OLD'>;
export type DkPartialReturnValues = Extract<ReturnValue, 'UPDATED_NEW' | 'UPDATED_OLD'>;

export type ReturnValuesAttributes<
	Attributes extends GenericAttributes | Partial<GenericAttributes> | undefined,
	ReturnValues extends ReturnValue | undefined
> = ReturnValues extends DkFullReturnValues
	? Attributes
	: ReturnValues extends DkPartialReturnValues
	? Partial<Attributes> | undefined
	: undefined;

export const assertReturnValuesAttributes: <
	Attributes extends GenericAttributes,
	ReturnValues extends ReturnValue | undefined
>(
	attributes?: Attributes | Partial<Attributes> | undefined,
	returnValues?: ReturnValues
) => asserts attributes is ReturnValuesAttributes<Attributes, ReturnValues> = (attributes, returnValues) => {
	if ((returnValues === ReturnValue.ALL_NEW || returnValues === ReturnValue.ALL_OLD) && !attributes) throw new Error();
	if ((!returnValues || returnValues === ReturnValue.NONE) && attributes) throw new Error();
};
