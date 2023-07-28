import { NoGsiKeySpace } from '../KeySpaceTest.dev';
import { getItem } from './get';
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
			Item: NoGsiKeySpace.withIndexKeys(item)
		})
	);

	const result = await getItem(NoGsiKeySpace, item);

	const resultTypeCheck: A.Equals<typeof result, KeySpace.GetAttributes<typeof NoGsiKeySpace>> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(item);
});
