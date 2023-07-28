import { KeySpace } from '../KeySpace';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { ReturnValuesAttributes } from '../util/returnValuesAttributes';
import { GenericAttributes } from '../util/utils';
import { DkUpdateCommand, DkUpdateCommandInput } from '../command/Update';
import { Table } from '../Table';
import { DkClient } from '../Client';

export interface UpdateItemInput<RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW>
	extends Omit<DkUpdateCommandInput<any, RV>, 'tableName' | 'key'> {}

export type UpdateItemOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
> = ReturnValuesAttributes<Attributes, RV>;

export const updateTableItem = async <
	T extends Table = Table,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	Table: T,
	key: Table.GetIndexKey<T, T['primaryIndex']>,
	input: UpdateItemInput<RV>,
	dkClient: DkClient = Table.dkClient
): Promise<UpdateItemOutput<Table.GetAttributes<T>, RV>> => {
	const output = await dkClient.send(
		new DkUpdateCommand<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>, RV>({
			...input,
			tableName: Table.tableName,
			key,
			returnValues: (input.returnValues || ReturnValue.ALL_NEW) as RV
		})
	);

	return output.attributes;
};

export const updateItem = async <
	K extends KeySpace = KeySpace,
	RV extends ReturnValue | undefined = typeof ReturnValue.ALL_NEW
>(
	KeySpace: K,
	keyParams: KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']>,
	input: UpdateItemInput<RV>
): Promise<UpdateItemOutput<KeySpace.GetAttributes<K>, RV>> => {
	const attributes = await updateTableItem(KeySpace.Table, KeySpace.keyOf(keyParams), input, KeySpace.dkClient);

	const strippedAttributes = (
		attributes ? KeySpace.omitIndexKeys(attributes as unknown as KeySpace.GetAttributesAndKeys<K>) : undefined
	) as ReturnValuesAttributes<KeySpace.GetAttributes<K>, RV>;

	return strippedAttributes;
};
