import { Table } from './Table';
import { ManyGsiTable, NoGsiTable } from './TableTest.dev';
import { A } from 'ts-toolbelt';
import { Remap } from './util/utils';

export const manyGsiPrimaryIndexKeyCheck: A.Equals<
	Table.GetIndexKey<typeof ManyGsiTable, (typeof ManyGsiTable)['primaryIndex']>,
	{ pk: string; sk: string }
> = 1;

export const manyGsiSecondaryIndexCheck: A.Equals<
	(typeof ManyGsiTable)['secondaryIndexes'][number],
	'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5'
> = 1;

type SecondaryIndexKeys = {
	gsi0Pk: string;
	gsi0Sk: string;
	gsi1Pk: number;
	gsi1Sk: number | undefined;
	gsi2Pk: string;
	gsi2Sk: number;
	gsi3Pk: number;
	gsi3Sk: string | undefined;
	gsi4Pk: string;
	gsi5Pk: number;
};

export const manyGsiSecondaryIndexKeyCheck: A.Equals<
	Table.GetIndexKey<typeof ManyGsiTable, (typeof ManyGsiTable)['secondaryIndexes'][number]>,
	SecondaryIndexKeys
> = 1;

export const manyGsiAttributeKeysCheck: A.Equals<
	(typeof ManyGsiTable)['attributeKeys'],
	Array<'pk' | 'sk' | keyof SecondaryIndexKeys>
> = 1;

const gsi0AttributeKeys = ManyGsiTable.indexAttributeKeys('gsi0');

export const manyGsiIndexAttributeKeysCheck: A.Equals<typeof gsi0AttributeKeys, Array<'gsi0Pk' | 'gsi0Sk'>> = 1;

export const manyGsiAttributesCheck: A.Equals<
	Table.GetAttributes<typeof ManyGsiTable>,
	Remap<{ pk: string; sk: string } & Partial<SecondaryIndexKeys>>
> = 1;

export const noGsiPrimaryIndexKeyCheck: A.Equals<
	Table.GetIndexKey<typeof NoGsiTable, (typeof NoGsiTable)['primaryIndex']>,
	{ pk: string; sk: string }
> = 1;

export const noGsiSecondaryIndexCheck: A.Equals<(typeof NoGsiTable)['secondaryIndexes'][number], never> = 1;

export const neverSecondaryIndexCheck: A.Equals<Table.GetIndexKey<typeof NoGsiTable, never>, never> = 1;

export const noGsiSecondaryIndexKeyCheck: A.Equals<
	Table.GetIndexKey<typeof NoGsiTable, (typeof NoGsiTable)['indexes'][number]>,
	{ pk: string; sk: string }
> = 1;

export const noGsiAttributesCheck: A.Equals<Table.GetAttributes<typeof NoGsiTable>, { pk: string; sk: string }> = 1;

it('type checks are valid', () => {
	expect(true).toBe(true);
});
