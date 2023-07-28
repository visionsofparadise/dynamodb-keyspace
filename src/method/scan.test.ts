import { DocumentClient } from '../TableTest.dev';
import { randomString } from '../util/utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { scanTableItems } from './scan';
import { A } from 'ts-toolbelt';
import { Table } from '../Table';
import { resetTableItems } from './reset';

const SCAN_TABLE_NAME = process.env.DYNAMODB_SCAN_TABLE || 'scanTest';

export const ScanTable = new Table({
	client: DocumentClient,
	name: SCAN_TABLE_NAME,
	indexes: {
		primaryIndex: {
			hash: {
				key: 'pk',
				value: 'string'
			},
			sort: {
				key: 'sk',
				value: 'string'
			}
		},
		gsi0: {
			hash: {
				key: 'gsi0Pk',
				value: 'string'
			},
			sort: {
				key: 'gsi0Sk',
				value: 'string'
			}
		}
	}
});

beforeAll(async () => {
	await resetTableItems(ScanTable);

	for (let i = 0; i < 10; i++) {
		const string = randomString();

		const item = {
			pk: string,
			sk: string,
			gsi0Pk: string,
			gsi0Sk: string
		};

		await DocumentClient.send(
			new PutCommand({
				TableName: SCAN_TABLE_NAME,
				Item: item
			})
		);
	}
});

it('scan returns list of items', async () => {
	const result = await scanTableItems(ScanTable);

	const cursorTypeCheck: A.Equals<(typeof result)['cursorKey'], { pk: string; sk: string } | undefined> = 1;

	expect(cursorTypeCheck).toBe(1);

	const itemsTypeCheck: A.Equals<
		(typeof result)['items'],
		Array<{ pk: string; sk: string; gsi0Pk?: string; gsi0Sk?: string }>
	> = 1;

	expect(itemsTypeCheck).toBe(1);

	expect(result.items.length).toBe(10);
});

it('scan on index returns list of items', async () => {
	const result = await scanTableItems(ScanTable, {
		index: 'gsi0'
	});

	const cursorTypeCheck: A.Equals<
		(typeof result)['cursorKey'],
		{ pk: string; sk: string; gsi0Pk: string; gsi0Sk: string } | undefined
	> = 1;

	expect(cursorTypeCheck).toBe(1);

	expect(result.items.length).toBe(10);
});

it('limits and pages correctly', async () => {
	const result = await scanTableItems(ScanTable, {
		pageLimit: 5
	});

	expect(result.items.length).toBe(5);
	expect(result.cursorKey).toBeDefined();

	const result2 = await scanTableItems(ScanTable, {
		cursorKey: result.cursorKey
	});

	expect(result2.items.length).toBe(5);
	expect(result2.cursorKey).toBeUndefined();
});
