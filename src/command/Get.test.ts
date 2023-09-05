import { TABLE_NAME, ManyGsiTable, DocumentClient } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomString } from '../util/utils';
import { A } from 'ts-toolbelt';
import { TestClient } from '../ClientTest.dev';
import { GenericAttributes } from '../util/utils';
import { DkGetCommand } from './Get';

it('gets a put item', async () => {
	const string = randomString();

	const Item = {
		pk: string,
		sk: string
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: ManyGsiTable.name,
			Item
		})
	);

	const result = await TestClient.send(
		new DkGetCommand({
			TableName: TABLE_NAME,
			Key: Item
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['Item'], GenericAttributes> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.Item).toStrictEqual(Item);
});

it('throws on not found', async () => {
	const string = randomString();

	const Item = {
		pk: string,
		sk: string
	};

	await TestClient.send(
		new DkGetCommand({
			TableName: TABLE_NAME,
			Key: Item
		})
	).catch(error => expect(error).toBeDefined());
});
