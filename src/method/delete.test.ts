import { DocumentClient, TABLE_NAME } from '../TableTest.dev';
import { deleteItem } from './delete';
import { randomNumber, randomString } from '../util/utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { NoGsiKeySpace } from '../KeySpaceTest.dev';
import { A } from 'ts-toolbelt';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { KeySpace } from '../KeySpace';

it('deletes an existing item', async () => {
	const string = randomString();
	const number = randomNumber();

	const item = {
		string,
		number
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: TABLE_NAME,
			Item: NoGsiKeySpace.withIndexKeys(item)
		})
	);

	const result = await deleteItem(NoGsiKeySpace, item);

	const resultTypeCheck: A.Equals<typeof result, undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toBeUndefined();
});

it('throws on deleting not existing item', async () => {
	const string = randomString();
	const number = randomNumber();

	const item = {
		string,
		number
	};

	await deleteItem(NoGsiKeySpace, item).catch(error => expect(error).toBeDefined());
});

it('returns old values', async () => {
	const string = randomString();
	const number = randomNumber();

	const item = {
		string,
		number
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: TABLE_NAME,
			Item: NoGsiKeySpace.withIndexKeys(item)
		})
	);

	const result = await deleteItem(NoGsiKeySpace, item, {
		returnValues: ReturnValue.ALL_OLD
	});

	const resultTypeCheck: A.Equals<typeof result, KeySpace.GetAttributes<typeof NoGsiKeySpace>> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(item);
});
