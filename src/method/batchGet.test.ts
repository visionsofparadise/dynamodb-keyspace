import { DocumentClient, NoGsiTable, TABLE_NAME } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { batchGetTableItems } from './batchGet';
import { arrayOfLength, randomString } from '../util/utils';
import { NoGsiKeySpace } from '../KeySpaceTest.dev';

it('it gets 120 items', async () => {
	const items: Array<{ string: string; number: number }> = arrayOfLength(120).map(() => {
		const string = randomString();
		const number = 1;

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

	const result = await batchGetTableItems(
		NoGsiTable,
		items.map(item => NoGsiKeySpace.keyOf(item))
	);

	expect(result.items.length).toBe(120);
});
