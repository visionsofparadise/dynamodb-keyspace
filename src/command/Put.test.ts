import { A } from 'ts-toolbelt';
import { randomString } from '../util/utils';
import { TABLE_NAME, DocumentClient } from '../TableTest.dev';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { TestClient } from '../ClientTest.dev';
import { DkPutCommand } from './Put';

it('puts new item', async () => {
	const string = randomString();

	const Item = {
		pk: string,
		sk: string
	};

	const result = await TestClient.send(
		new DkPutCommand({
			TableName: TABLE_NAME,
			Item
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['Attributes'], undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.Attributes).toBeUndefined();
});

it('puts over existing item', async () => {
	const string = randomString();

	const Item = {
		pk: string,
		sk: string
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: TABLE_NAME,
			Item
		})
	);

	const result = await TestClient.send(
		new DkPutCommand({
			TableName: TABLE_NAME,
			Item
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['Attributes'], undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.Attributes).toBeUndefined();
});

it('returns old values', async () => {
	const string = randomString();

	const Item = {
		pk: string,
		sk: string
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: TABLE_NAME,
			Item
		})
	);

	const updatedItem = {
		...Item,
		string: randomString()
	};

	const result = await TestClient.send(
		new DkPutCommand({
			TableName: TABLE_NAME,
			Item: updatedItem,
			ReturnValues: ReturnValue.ALL_OLD
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['Attributes'], typeof updatedItem> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.Attributes).toStrictEqual(Item);
});
