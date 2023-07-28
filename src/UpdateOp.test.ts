import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ManyGsiKeySpace, NoGsiKeySpace, TestItem } from './KeySpaceTest.dev';
import { DocumentClient, TABLE_NAME } from './TableTest.dev';
import { dkOp, DkOp } from './UpdateOp';
import { updateQuickItem } from './method/updateQuick';
import { randomString, randomNumber } from './util/utils';

it('instanceof works with abstract', () => {
	const o1 = dkOp.Value('x');

	expect((o1 as any) instanceof DkOp).toBe(true);
});

it('updates a value as a whole', async () => {
	const string = randomString();
	const number = randomNumber();

	const item: TestItem = {
		string,
		number,
		deep: {
			deep: {
				deep: {
					string
				}
			}
		}
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: TABLE_NAME,
			Item: NoGsiKeySpace.withIndexKeys(item)
		})
	);

	const updatedTestString = randomString();

	await updateQuickItem(ManyGsiKeySpace, item, {
		deep: {
			deep: dkOp.Value({
				deep: {
					string: updatedTestString
				}
			})
		}
	});

	const { Item } = await DocumentClient.send(
		new GetCommand({
			TableName: TABLE_NAME,
			Key: ManyGsiKeySpace.keyOf(item)
		})
	);

	expect(Item!.deep.deep.deep.string).toBe(updatedTestString);
});

it('increments a value', async () => {
	const string = randomString();
	const number = randomNumber();

	const item: TestItem = {
		string,
		number,
		deep: {
			deep: {
				deep: {
					string
				}
			}
		}
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: TABLE_NAME,
			Item: NoGsiKeySpace.withIndexKeys(item)
		})
	);

	await updateQuickItem(ManyGsiKeySpace, item, {
		number: dkOp.Add(1)
	});

	const { Item } = await DocumentClient.send(
		new GetCommand({
			TableName: TABLE_NAME,
			Key: ManyGsiKeySpace.keyOf(item)
		})
	);

	expect(Item!.number).toBe(item.number + 1);
});

it('drecrements a value', async () => {
	const string = randomString();
	const number = randomNumber();

	const item = {
		string,
		number,
		deep: {
			deep: {
				deep: {
					string
				}
			}
		}
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: TABLE_NAME,
			Item: NoGsiKeySpace.withIndexKeys(item)
		})
	);

	await updateQuickItem(ManyGsiKeySpace, item, {
		number: dkOp.Minus(1)
	});

	const { Item } = await DocumentClient.send(
		new GetCommand({
			TableName: TABLE_NAME,
			Key: ManyGsiKeySpace.keyOf(item)
		})
	);

	expect(Item!.number).toBe(item.number - 1);
});

it('appends list at head', async () => {
	const string = randomString();
	const number = randomNumber();

	const item = {
		string,
		number,
		list: ['test'],
		deep: {
			deep: {
				deep: {
					string
				}
			}
		}
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: TABLE_NAME,
			Item: NoGsiKeySpace.withIndexKeys(item)
		})
	);

	await updateQuickItem(ManyGsiKeySpace, item, {
		list: dkOp.ListAppend(['test2'], 'head')
	});

	const { Item } = await DocumentClient.send(
		new GetCommand({
			TableName: TABLE_NAME,
			Key: ManyGsiKeySpace.keyOf(item)
		})
	);

	expect(Item!.list.length).toBe(2);
	expect(Item!.list[0]).toBe('test2');
});

it('appends list at tail', async () => {
	const string = randomString();
	const number = randomNumber();

	const item = {
		string,
		number,
		list: ['test'],
		deep: {
			deep: {
				deep: {
					string
				}
			}
		}
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: TABLE_NAME,
			Item: NoGsiKeySpace.withIndexKeys(item)
		})
	);

	await updateQuickItem(ManyGsiKeySpace, item, {
		list: dkOp.ListAppend(['test2'], 'tail')
	});

	const { Item } = await DocumentClient.send(
		new GetCommand({
			TableName: TABLE_NAME,
			Key: ManyGsiKeySpace.keyOf(item)
		})
	);

	expect(Item!.list.length).toBe(2);
	expect(Item!.list[1]).toBe('test2');
});
