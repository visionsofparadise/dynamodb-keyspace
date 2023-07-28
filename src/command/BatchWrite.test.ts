import { TABLE_NAME, DocumentClient } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { DkBatchWriteCommand } from './BatchWrite';
import { arrayOfLength, randomString } from '../util/utils';
import { TestClient } from '../ClientTest.dev';

it('it puts 50 items', async () => {
	const items: Array<{ pk: string; sk: string }> = arrayOfLength(25).map(() => {
		const string = randomString();

		return {
			pk: string,
			sk: string
		};
	});

	const result = await TestClient.send(
		new DkBatchWriteCommand({
			requests: {
				[TABLE_NAME]: items.map(i => ({ put: i }))
			}
		})
	);

	expect(result.unprocessedRequests[TABLE_NAME]).toBeUndefined();
});

it('it deletes 50 items', async () => {
	const items: Array<{ pk: string; sk: string }> = arrayOfLength(25).map(() => {
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
		new DkBatchWriteCommand({
			requests: {
				[TABLE_NAME]: items.map(({ pk, sk }) => ({ delete: { pk, sk } }))
			}
		})
	);

	expect(result.unprocessedRequests[TABLE_NAME]).toBeUndefined();
});
