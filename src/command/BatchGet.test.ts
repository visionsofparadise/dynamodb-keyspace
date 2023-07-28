import { TABLE_NAME, DocumentClient } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { arrayOfLength, randomString } from '../util/utils';
import { TestClient } from '../ClientTest.dev';
import { DkBatchGetCommand } from './BatchGet';

it('it gets 10 items', async () => {
	const items: Array<{ pk: string; sk: string }> = arrayOfLength(10).map(() => {
		const string = randomString();

		return {
			pk: string,
			sk: string
		};
	});

	for (const item of items) {
		await DocumentClient.send(
			new PutCommand({
				TableName: TABLE_NAME,
				Item: item
			})
		);
	}

	const result = await TestClient.send(
		new DkBatchGetCommand({
			requests: {
				[TABLE_NAME]: {
					keys: items.map(({ pk, sk }) => ({ pk, sk }))
				}
			}
		})
	);

	expect(result.items[TABLE_NAME].length).toBe(10);
});
