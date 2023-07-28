import { TABLE_NAME, ManyGsiTable, DocumentClient } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { A } from 'ts-toolbelt';
import { randomString } from '../util/utils';
import { TestClient } from '../ClientTest.dev';
import { DkQueryCommand } from './Query';
import { GenericAttributes } from '../util/utils';

it('query returns list of items', async () => {
	const hash = randomString();

	for (let i = 0; i < 10; i++) {
		const string = randomString();

		const item = {
			pk: hash,
			sk: string
		};

		await DocumentClient.send(
			new PutCommand({
				TableName: ManyGsiTable.tableName,
				Item: item
			})
		);
	}

	const result = await TestClient.send(
		new DkQueryCommand({
			tableName: TABLE_NAME,
			keyConditionExpression: 'pk = :pk',
			expressionAttributeValues: {
				':pk': hash
			}
		})
	);

	const itemsTypeCheck: A.Equals<(typeof result)['items'], Array<GenericAttributes>> = 1;

	expect(itemsTypeCheck).toBe(1);

	expect(result.items.length).toBe(10);
});
