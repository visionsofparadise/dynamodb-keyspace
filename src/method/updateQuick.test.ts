import { DocumentClient, TABLE_NAME } from '../TableTest.dev';
import { updateQuickItem } from './updateQuick';
import { randomNumber, randomString } from '../util/utils';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { TestItem, NoGsiKeySpace } from '../KeySpaceTest.dev';
import { A } from 'ts-toolbelt';
import { dkOp } from '../UpdateOp';

it('updates an existing item', async () => {
	const string = randomString();
	const number = randomNumber();

	const item = {
		string: string,
		number: number,
		deep: {
			deep: {
				deep: {
					string: string
				}
			}
		},
		list: []
	};

	await DocumentClient.send(
		new PutCommand({
			TableName: TABLE_NAME,
			Item: NoGsiKeySpace.withIndexKeys(item)
		})
	);

	const updatedString = randomString();
	const updatedList = [randomString()];

	const result = await updateQuickItem(NoGsiKeySpace, item, {
		number: dkOp.Add(1),
		deep: {
			deep: {
				deep: dkOp.Value({
					string: updatedString
				})
			}
		},
		list: dkOp.ListAppend(updatedList)
	});

	const resultTypeCheck: A.Equals<typeof result, TestItem> = 1;

	expect(resultTypeCheck).toBe(1);

	const { Item } = await DocumentClient.send(
		new GetCommand({
			TableName: TABLE_NAME,
			Key: NoGsiKeySpace.keyOf(item)
		})
	);

	expect(Item!.number).toBe(item.number + 1);
	expect(Item!.deep.deep.deep.string).toBe(updatedString);
	expect(Item!.list.length).toBe(1);
	expect(Item!.list[0]).toBe(updatedList[0]);
});
