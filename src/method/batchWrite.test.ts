import { DocumentClient, NoGsiTable, TABLE_NAME } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { batchWriteTableItems } from './batchWrite';
import { arrayOfLength, randomNumber, randomString } from '../util/utils';
import { NoGsiKeySpace } from '../KeySpaceTest.dev';

it('it puts 50 items', async () => {
	const items: Array<{ string: string; number: number }> = arrayOfLength(50).map(() => {
		const string = randomString();
		const number = randomNumber();

		return {
			string,
			number
		};
	});

	for (const item of items) {
		await DocumentClient.send(
			new PutCommand({
				TableName: TABLE_NAME,
				Item: NoGsiKeySpace.withIndexKeys(item)
			})
		);
	}

	const updatedItems = items.map(item => ({
		...item,
		updateableString: randomString()
	}));

	const result = await batchWriteTableItems(
		NoGsiTable,
		updatedItems.map(item => {
			return { put: NoGsiKeySpace.withIndexKeys(item) };
		})
	);

	expect(result.unprocessedRequests.length).toBe(0);
});

it('it deletes 50 items', async () => {
	const items: Array<{ string: string; number: number }> = arrayOfLength(50).map(() => {
		const string = randomString();
		const number = randomNumber();

		return {
			string,
			number
		};
	});

	for (const item of items) {
		await DocumentClient.send(
			new PutCommand({
				TableName: TABLE_NAME,
				Item: NoGsiKeySpace.withIndexKeys(item)
			})
		);
	}

	const result = await batchWriteTableItems(
		NoGsiTable,
		items.map(item => {
			return { delete: NoGsiKeySpace.keyOf(item) };
		})
	);

	expect(result.unprocessedRequests.length).toBe(0);
});
