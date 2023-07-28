import { DocumentClient, ManyGsiTable } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { transactGetTableItems } from './transactGet';
import { arrayOfLength, randomNumber, randomString } from '../util/utils';
import { NoGsiKeySpace } from '../KeySpaceTest.dev';

it('it gets 10 items', async () => {
	const items = arrayOfLength(10).map(() => {
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
				TableName: ManyGsiTable.tableName,
				Item: NoGsiKeySpace.withIndexKeys(item)
			})
		);
	}

	const result = await transactGetTableItems(
		ManyGsiTable,
		items.map(item => NoGsiKeySpace.keyOf(item))
	);

	expect(result.length).toBe(10);
});
