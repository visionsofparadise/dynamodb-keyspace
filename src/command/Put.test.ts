import { A } from 'ts-toolbelt';
import { randomString } from '../util/utils';
import { TABLE_NAME, DocumentClient } from '../TableTest.dev';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { TestClient } from '../ClientTest.dev';
import { DkPutCommand } from './Put';

it('puts new item', async () => {
	const string = randomString();

	const item = {
		pk: string,
		sk: string
	};

	const result = await TestClient.send(
		new DkPutCommand({
			tableName: TABLE_NAME,
			item
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['attributes'], undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.attributes).toBeUndefined();
});

it('puts over existing item', async () => {
	const string = randomString();

	const item = {
		pk: string,
		sk: string
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: TABLE_NAME,
			Item: item
		})
	);

	const result = await TestClient.send(
		new DkPutCommand({
			tableName: TABLE_NAME,
			item
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['attributes'], undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.attributes).toBeUndefined();
});

it('returns old values', async () => {
	const string = randomString();

	const item = {
		pk: string,
		sk: string
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: TABLE_NAME,
			Item: item
		})
	);

	const updatedItem = {
		...item,
		string: randomString()
	};

	const result = await TestClient.send(
		new DkPutCommand({
			tableName: TABLE_NAME,
			item: updatedItem,
			returnValues: ReturnValue.ALL_OLD
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['attributes'], typeof updatedItem> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.attributes).toStrictEqual(item);
});
