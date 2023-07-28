import { KeySpace } from '../KeySpace';
import { ReturnValuesAttributes } from '../util/returnValuesAttributes';
import { GenericAttributes } from '../util/utils';
import { DkDeleteCommand, DkDeleteCommandInput, DkDeleteReturnValues } from '../command/Delete';
import { Table } from '../Table';
import { DkClient } from '../Client';

export interface DeleteItemInput<RV extends DkDeleteReturnValues = undefined>
	extends Omit<DkDeleteCommandInput<any, RV>, 'tableName' | 'key'> {}

export type DeleteItemOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends DkDeleteReturnValues = undefined
> = ReturnValuesAttributes<Attributes, RV>;

export const deleteTableItem = async <T extends Table = Table, RV extends DkDeleteReturnValues = undefined>(
	Table: T,
	key: Table.GetIndexKey<T, T['primaryIndex']>,
	input?: DeleteItemInput<RV>,
	dkClient: DkClient = Table.dkClient
): Promise<DeleteItemOutput<Table.GetAttributes<T>, RV>> => {
	const output = await dkClient.send(
		new DkDeleteCommand<Table.GetAttributes<T>, Table.GetIndexKey<T, T['primaryIndex']>, RV>({
			...input,
			tableName: Table.tableName,
			key
		})
	);

	return output.attributes;
};

export const deleteItem = async <K extends KeySpace = KeySpace, RV extends DkDeleteReturnValues = undefined>(
	KeySpace: K,
	keyParams: KeySpace.GetIndexKeyValueParams<K, K['primaryIndex']>,
	input?: DeleteItemInput<RV>
): Promise<DeleteItemOutput<KeySpace.GetAttributes<K>, RV>> => {
	const attributes = await deleteTableItem(KeySpace.Table, KeySpace.keyOf(keyParams), input, KeySpace.dkClient);

	const strippedAttributes = (
		attributes ? KeySpace.omitIndexKeys(attributes as unknown as KeySpace.GetAttributesAndKeys<K>) : undefined
	) as ReturnValuesAttributes<KeySpace.GetAttributes<K>, RV>;

	return strippedAttributes;
};
