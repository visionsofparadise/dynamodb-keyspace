import { DocumentClient, TABLE_NAME } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { queryItems } from './query';
import { TestItem, NoGsiKeySpace } from '../KeySpaceTest.dev';
import { A } from 'ts-toolbelt';
import { randomNumber, randomString } from '../util/utils';

it('query returns list of items', async () => {
	const string = randomString();

	for (let i = 0; i < 10; i++) {
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
	}

	const result = await queryItems(NoGsiKeySpace, {
		keyConditionExpression: 'pk = :pk',
		expressionAttributeValues: {
			':pk': string
		}
	});

	const itemsTypeCheck: A.Equals<(typeof result)['items'], Array<TestItem>> = 1;

	expect(itemsTypeCheck).toBe(1);

	expect(result.items.length).toBe(10);
});

it('auto pages to total limit', async () => {
	const string = randomString();

	for (let i = 0; i < 10; i++) {
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
	}

	const result = await queryItems(NoGsiKeySpace, {
		keyConditionExpression: 'pk = :pk',
		expressionAttributeValues: {
			':pk': string
		},
		pageLimit: 3,
		totalLimit: 6,
		autoPage: true
	});

	expect(result.items.length).toBe(6);
	expect(result.cursorKey).toBeDefined();
	expect(result.count).toBe(6);
});

it('auto pages all items', async () => {
	const string = randomString();

	for (let i = 0; i < 10; i++) {
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
	}

	const result = await queryItems(NoGsiKeySpace, {
		keyConditionExpression: 'pk = :pk',
		expressionAttributeValues: {
			':pk': string
		},
		pageLimit: 3,
		autoPage: true
	});

	expect(result.items.length).toBe(10);
	expect(result.cursorKey).toBeUndefined();
	expect(result.count).toBe(10);
});
