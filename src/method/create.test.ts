import { createItem } from './create';
import { NoGsiKeySpace } from '../KeySpaceTest.dev';
import { randomNumber, randomString } from '../util/utils';
import { DocumentClient, TABLE_NAME } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

it('creates new item', async () => {
	const item = {
		string: randomString(),
		number: randomNumber()
	};

	const result = await createItem(NoGsiKeySpace, item);

	expect(result).toBeUndefined();
});

it('throws if item exists', async () => {
	const item = {
		string: randomString(),
		number: randomNumber()
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: TABLE_NAME,
			Item: NoGsiKeySpace.withIndexKeys(item)
		})
	);

	await createItem(NoGsiKeySpace, item).catch(error => expect(error).toBeDefined());
});

it('creates new item with different sort key', async () => {
	const item = {
		string: randomString(),
		number: randomNumber()
	};

	await createItem(NoGsiKeySpace, item);

	const item2 = {
		string: item.string,
		number: randomNumber()
	};

	const result = await createItem(NoGsiKeySpace, item2);

	expect(result).toBeUndefined();
});
