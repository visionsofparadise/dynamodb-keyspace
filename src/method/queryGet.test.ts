import { ManyGsiKeySpace } from '../KeySpaceTest.dev';
import { queryGetItem } from './queryGet';
import { DocumentClient, TABLE_NAME } from '../TableTest.dev';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomNumber, randomString } from '../util/utils';
import { A } from 'ts-toolbelt';
import { KeySpace } from '../KeySpace';

it('gets a put item', async () => {
	const string = randomString();
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

	const result = await queryGetItem(ManyGsiKeySpace, 'gsi0', item);

	const resultTypeCheck: A.Equals<typeof result, KeySpace.GetAttributes<typeof ManyGsiKeySpace>> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(item);
});

it('throws on not found', async () => {
	const string = randomString();
	const number = randomNumber();

	const item = {
		string,
		number
	};

	await queryGetItem(ManyGsiKeySpace, 'gsi0', item).catch(error => expect(error).toBeDefined());
});
