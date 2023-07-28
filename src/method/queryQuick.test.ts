import { DocumentClient, TABLE_NAME } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { queryQuickItems } from './queryQuick';
import { TestItem, ManyGsiKeySpace } from '../KeySpaceTest.dev';
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
				Item: ManyGsiKeySpace.withIndexKeys(item)
			})
		);
	}

	const result = await queryQuickItems(ManyGsiKeySpace, {
		hashKeyParams: { string }
	});

	const itemsTypeCheck: A.Equals<(typeof result)['items'], Array<TestItem>> = 1;

	expect(itemsTypeCheck).toBe(1);

	expect(result.items.length).toBe(10);
});

it('queries items with beginsWith on index key', async () => {
	const string = randomString();

	for (let i = 195; i < 205; i++) {
		const number = i;

		const item = {
			string,
			number
		};

		await DocumentClient.send(
			new PutCommand({
				TableName: TABLE_NAME,
				Item: ManyGsiKeySpace.withIndexKeys(item)
			})
		);
	}

	const result = await queryQuickItems(ManyGsiKeySpace, {
		index: 'gsi0' as const,
		hashKeyParams: { number: 200 },
		beginsWith: string
	});

	expect(result.items.length).toBe(1);
});

it('queries items with between on index key', async () => {
	const string = randomString();

	for (let i = 195; i < 205; i++) {
		const number = i;

		const item = {
			string,
			number
		};

		await DocumentClient.send(
			new PutCommand({
				TableName: TABLE_NAME,
				Item: ManyGsiKeySpace.withIndexKeys(item)
			})
		);
	}

	const result = await queryQuickItems(ManyGsiKeySpace, {
		index: 'gsi2' as const,
		hashKeyParams: { string },
		greaterThan: 198,
		lessThan: 204
	});

	expect(result.items.length).toBe(7);
});
