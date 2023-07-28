import { KeySpace } from '../KeySpace';
import { ReturnValuesAttributes } from '../util/returnValuesAttributes';
import { GenericAttributes } from '../util/utils';
import { DkPutCommand, DkPutCommandInput, DkPutReturnValues } from '../command/Put';
import { Table } from '../Table';
import { DkClient } from '../Client';

export interface PutItemInput<RV extends DkPutReturnValues = undefined>
	extends Omit<DkPutCommandInput<any, RV>, 'tableName' | 'item'> {}

export type PutItemsOutput<
	Attributes extends GenericAttributes = GenericAttributes,
	RV extends DkPutReturnValues = undefined
> = ReturnValuesAttributes<Attributes, RV>;

export const putTableItem = async <T extends Table = Table, RV extends DkPutReturnValues = undefined>(
	Table: T,
	item: Table.GetAttributes<T>,
	input?: PutItemInput<RV>,
	dkClient: DkClient = Table.dkClient
): Promise<PutItemsOutput<Table.GetAttributes<T>, RV>> => {
	const output = await dkClient.send(
		new DkPutCommand<Table.GetAttributes<T>, RV>({
			...input,
			tableName: Table.tableName,
			item
		})
	);

	return output.attributes;
};

export const putItem = async <K extends KeySpace = KeySpace, RV extends DkPutReturnValues = undefined>(
	KeySpace: K,
	item: KeySpace.GetAttributes<K>,
	input?: PutItemInput<RV>
): Promise<PutItemsOutput<KeySpace.GetAttributes<K>, RV>> => {
	const attributes = await putTableItem(KeySpace.Table, KeySpace.withIndexKeys(item), input, KeySpace.dkClient);

	const strippedAttributes = (
		attributes ? KeySpace.omitIndexKeys(attributes as unknown as KeySpace.GetAttributesAndKeys<K>) : undefined
	) as ReturnValuesAttributes<KeySpace.GetAttributes<K>, RV>;

	return strippedAttributes;
};
