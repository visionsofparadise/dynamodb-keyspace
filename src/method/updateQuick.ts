import { KeySpace } from '../KeySpace';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { O } from 'ts-toolbelt';
import { convertObjectToUpdateExpression } from '../util/convertObjectToUpdateExpression';
import { UpdateItemInput, UpdateItemOutput, updateTableItem } from './update';
import { AllSchema } from '../util/Schema';
import { DkOp } from '../UpdateOp';
import { GenericAttributes } from '../util/utils';
import { Table } from '../Table';
import { ReturnValuesAttributes } from '../util/returnValuesAttributes';
import { DkClient } from '../Client';

export interface UpdateQuickItemInput<RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW>
	extends UpdateItemInput<RV> {}

export type UpdateQuickItemOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
> = UpdateItemOutput<Attributes, RV>;

export const updateQuickTableItem = async <
	T extends Table = Table,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	Table: T,
	key: Table.GetIndexKey<T, T['primaryIndex']>,
	updateAttributes: O.Partial<O.Unionize<Table.GetAttributes<T>, AllSchema<Table.GetAttributes<T>, DkOp>>, 'deep'>,
	input?: UpdateQuickItemInput<RV>,
	dkClient: DkClient = Table.dkClient
): Promise<UpdateQuickItemOutput<Table.GetAttributes<T>, RV>> => {
	const updateExpressionParams = convertObjectToUpdateExpression(updateAttributes);

	const attributes = await updateTableItem(
		Table,
		key,
		{
			...input,
			...updateExpressionParams,
			expressionAttributeNames: {
				...updateExpressionParams.expressionAttributeNames,
				...input?.expressionAttributeNames
			},
			expressionAttributeValues: {
				...updateExpressionParams.expressionAttributeValues,
				...input?.expressionAttributeValues
			}
		},
		dkClient
	);

	return attributes;
};

export const updateQuickItem = async <
	K extends KeySpace = KeySpace,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	KeySpace: K,
	keyParams: KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']>,
	updateAttributes: O.Partial<
		O.Unionize<KeySpace.GetAttributes<K>, AllSchema<KeySpace.GetAttributes<K>, DkOp>>,
		'deep'
	>,
	input?: UpdateQuickItemInput<RV>
): Promise<UpdateQuickItemOutput<KeySpace.GetAttributes<K>, RV>> => {
	const attributes = await updateQuickTableItem(
		KeySpace.Table,
		KeySpace.keyOf(keyParams),
		updateAttributes,
		input,
		KeySpace.dkClient
	);

	const strippedAttributes = (
		attributes ? KeySpace.omitIndexKeys(attributes as unknown as KeySpace.GetAttributesAndKeys<K>) : undefined
	) as ReturnValuesAttributes<KeySpace.GetAttributes<K>, RV>;

	return strippedAttributes;
};
