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
		KeyConditionExpression: 'pk = :pk',
		ExpressionAttributeValues: {
			':pk': string
		}
	});

	const itemsTypeCheck: A.Equals<(typeof result)['Items'], Array<TestItem>> = 1;

	expect(itemsTypeCheck).toBe(1);

	expect(result.Items.length).toBe(10);
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
		KeyConditionExpression: 'pk = :pk',
		ExpressionAttributeValues: {
			':pk': string
		},
		Limit: 6,
		PageLimit: 3,
		AutoPage: true
	});

	expect(result.Items.length).toBe(6);
	expect(result.LastEvaluatedKey).toBeDefined();
	expect(result.Count).toBe(6);
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
		KeyConditionExpression: 'pk = :pk',
		ExpressionAttributeValues: {
			':pk': string
		},
		PageLimit: 3,
		AutoPage: true
	});

	expect(result.Items.length).toBe(10);
	expect(result.LastEvaluatedKey).toBeUndefined();
	expect(result.Count).toBe(10);
});
