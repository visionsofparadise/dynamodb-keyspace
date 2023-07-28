import { Table } from '../Table';
import { scanTableItems } from './scan';
import { batchWriteTableItems } from './batchWrite';

export const resetTableItems = async <T extends Table = Table>(Table: T) => {
	const scanData = await scanTableItems(Table, undefined);

	if (scanData.items.length === 0) return;

	await batchWriteTableItems(
		Table,
		scanData.items.map(item => ({
			delete: Table.pickPrimaryIndexKey(item)
		})),
		undefined
	);

	return;
};
