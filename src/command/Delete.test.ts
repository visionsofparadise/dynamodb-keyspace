import { TABLE_NAME, DocumentClient } from '../TableTest.dev';
import { randomString } from '../util/utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { A } from 'ts-toolbelt';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { DkDeleteCommand } from './Delete';
import { TestClient } from '../ClientTest.dev';
import { GenericAttributes } from '../util/utils';

it('deletes an existing item', async () => {
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
		new DkDeleteCommand({
			tableName: TABLE_NAME,
			key: item
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['attributes'], undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.attributes).toBeUndefined();
});

it('throws on deleting not existing item', async () => {
	const string = randomString();

	const item = {
		pk: string,
		sk: string
	};

	await TestClient.send(
		new DkDeleteCommand({
			tableName: TABLE_NAME,
			key: item
		})
	).catch(error => expect(error).toBeDefined());
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

	const result = await TestClient.send(
		new DkDeleteCommand({
			tableName: TABLE_NAME,
			key: item,
			returnValues: ReturnValue.ALL_OLD
		})
	);

	const resultTypeCheck: A.Equals<(typeof result)['attributes'], GenericAttributes> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result.attributes).toStrictEqual(item);
});
