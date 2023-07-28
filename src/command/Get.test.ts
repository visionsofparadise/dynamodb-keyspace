import { TABLE_NAME, ManyGsiTable, DocumentClient } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomString } from '../util/utils';
import { A } from 'ts-toolbelt';
import { TestClient } from '../ClientTest.dev';
import { GenericAttributes } from '../util/utils';
import { DkGetCommand } from './Get';

it('gets a put item', async () => {
	const string = randomString();

	const item = {
		pk: string,
		sk: string
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: ManyGsiTable.tableName,
			Item: item
		})
	);

	const result = await TestClient.send(
		new DkGetCommand({
			tableName: TABLE_NAME,
			key: item
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['item'], GenericAttributes> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.item).toStrictEqual(item);
});

it('throws on not found', async () => {
	const string = randomString();

	const item = {
		pk: string,
		sk: string
	};

	await TestClient.send(
		new DkGetCommand({
			tableName: TABLE_NAME,
			key: item
		})
	).catch(error => expect(error).toBeDefined());
});
