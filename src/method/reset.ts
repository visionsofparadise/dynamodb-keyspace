import { Table } from '../Table';
import { scanTableItems } from './scan';
import { batchWriteTableItems } from './batchWrite';

export const resetTableItems = async <T extends Table = Table>(Table: T) => {
	const scanData = await scanTableItems(Table, undefined);

	if (scanData.Items.length === 0) return;

	await batchWriteTableItems(
		Table,
		scanData.Items.map(item => ({
			Delete: Table.pickPrimaryIndexKey(item)
		})),
		undefined
	);

	return;
};
