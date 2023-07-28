import { scanTableItems } from './scan';
import { DocumentClient } from '../TableTest.dev';
import { resetTableItems } from './reset';
import { randomString } from '../util/utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { Table } from '../Table';

const RESET_TABLE_NAME = process.env.DYNAMODB_RESET_TABLE || 'resetTest';

export const ResetTable = new Table({
	client: DocumentClient,
	name: RESET_TABLE_NAME,
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
		}
	}
});

it('reset deletes all items', async () => {
	for (let i = 0; i < 10; i++) {
		const string = randomString();

		const item = {
			pk: string,
			sk: string
		};

		await DocumentClient.send(
			new PutCommand({
				TableName: RESET_TABLE_NAME,
				Item: item
			})
		);
	}

	const beforeReset = await scanTableItems(ResetTable);

	expect(beforeReset.items.length).toBe(10);

	await resetTableItems(ResetTable);

	const result = await scanTableItems(ResetTable);

	expect(result.items.length).toBe(0);
});
