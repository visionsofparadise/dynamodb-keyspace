import { DocumentClient, ManyGsiTable, TABLE_NAME } from '../TableTest.dev';
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

it('gets hashKey params for primary index on no index defined and index', async () => {
	interface TestItem2 {
		string1: string;
		number1: number;
		string2: string;
		number2: number;
	}

	const DifferentParamsKeySpace = new ManyGsiTable.KeySpace<TestItem2, 'gsi0' | 'gsi1'>().configure({
		indexValueHandlers: {
			primaryIndex: {
				pk: (params: Pick<TestItem2, 'string1'>) => params.string1,
				sk: (params: Pick<TestItem2, 'number1'>) => `${params.number1}`
			},
			gsi0: {
				gsi0Pk: (params: Pick<TestItem2, 'number2'>) => `${params.number2}`,
				gsi0Sk: (params: Pick<TestItem2, 'string2'>) => params.string2
			},
			gsi1: {
				gsi1Pk: () => 1,
				gsi1Sk: () => 1
			}
		}
	});

	const string1 = randomString();
	const number2 = randomNumber();

	await queryQuickItems(DifferentParamsKeySpace, {
		hashKeyParams: { string1 }
	});

	await queryQuickItems(DifferentParamsKeySpace, {
		index: 'gsi0' as const,
		hashKeyParams: { number2 }
	});

	await queryQuickItems(DifferentParamsKeySpace, {
		index: 'gsi1' as const,
		hashKeyParams: undefined
	});

	expect(true).toBe(true);
});
