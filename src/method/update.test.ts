import { DocumentClient, TABLE_NAME } from '../TableTest.dev';
import { updateItem } from './update';
import { randomNumber, randomString } from '../util/utils';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { NoGsiKeySpace } from '../KeySpaceTest.dev';
import { A } from 'ts-toolbelt';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { KeySpace } from '../KeySpace';

it('updates an existing item', async () => {
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

	const updateableString = randomString();

	const result = await updateItem(NoGsiKeySpace, item, {
		returnValues: ReturnValue.NONE,
		updateExpression: 'SET updateableString = :string',
		expressionAttributeValues: {
			':string': updateableString
		}
	});

	const resultTypeCheck: A.Equals<typeof result, undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	const { Item } = await DocumentClient.send(
		new GetCommand({
			TableName: TABLE_NAME,
			Key: NoGsiKeySpace.keyOf(item)
		})
	);

	expect(Item!.updateableString).toBe(updateableString);
});

it('returns all new values', async () => {
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

	const updateableString = randomString();

	const result = await updateItem(NoGsiKeySpace, item, {
		returnValues: ReturnValue.ALL_NEW,
		updateExpression: 'SET updateableString = :string',
		expressionAttributeValues: {
			':string': updateableString
		}
	});

	const resultTypeCheck: A.Equals<typeof result, KeySpace.GetAttributes<typeof NoGsiKeySpace>> = 1;

	expect(resultTypeCheck).toBe(1);

	const updatedItem = {
		...item,
		updateableString
	};

	expect(result).toStrictEqual(updatedItem);
});

it('returns all old values', async () => {
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

	const updateableString = randomString();

	const result = await updateItem(NoGsiKeySpace, item, {
		returnValues: ReturnValue.ALL_OLD,
		updateExpression: 'SET updateableString = :string',
		expressionAttributeValues: {
			':string': updateableString
		}
	});

	const resultTypeCheck: A.Equals<typeof result, KeySpace.GetAttributes<typeof NoGsiKeySpace>> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(item);
});

it('returns updated new values', async () => {
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

	const updateableString = randomString();

	const result = await updateItem(NoGsiKeySpace, item, {
		returnValues: ReturnValue.UPDATED_NEW,
		updateExpression: 'SET updateableString = :string',
		expressionAttributeValues: {
			':string': updateableString
		}
	});

	const resultTypeCheck: A.Equals<typeof result, Partial<KeySpace.GetAttributes<typeof NoGsiKeySpace>> | undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	const updatedItem = {
		updateableString
	};

	expect(result).toStrictEqual(updatedItem);
});

it('returns updated old values', async () => {
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

	const updateableString = randomString();

	const result = await updateItem(NoGsiKeySpace, item, {
		returnValues: ReturnValue.UPDATED_OLD,
		updateExpression: 'SET updateableString = :string',
		expressionAttributeValues: {
			':string': updateableString
		}
	});

	const resultTypeCheck: A.Equals<typeof result, Partial<KeySpace.GetAttributes<typeof NoGsiKeySpace>> | undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toBeUndefined();
});
