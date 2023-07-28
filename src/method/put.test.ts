import { putItem } from './put';
import { NoGsiKeySpace } from '../KeySpaceTest.dev';
import { A } from 'ts-toolbelt';
import { randomNumber, randomString } from '../util/utils';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { KeySpace } from '../KeySpace';

it('puts new item', async () => {
	const item = {
		string: randomString(),
		number: randomNumber()
	};

	const result = await putItem(NoGsiKeySpace, item);

	const resultTypeCheck: A.Equals<typeof result, undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toBeUndefined();
});

it('puts over existing item', async () => {
	const item = {
		string: randomString(),
		number: randomNumber()
	};

	await putItem(NoGsiKeySpace, item);

	const result = await putItem(NoGsiKeySpace, item);

	const resultTypeCheck: A.Equals<typeof result, undefined> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toBeUndefined();
});

it('returns old values', async () => {
	const item = {
		string: randomString(),
		number: randomNumber()
	};

	await putItem(NoGsiKeySpace, item);

	const updatedItem = {
		...item,
		optionalString: randomString()
	};

	const result = await putItem(NoGsiKeySpace, updatedItem, {
		returnValues: ReturnValue.ALL_OLD
	});

	const resultTypeCheck: A.Equals<typeof result, KeySpace.GetAttributes<typeof NoGsiKeySpace>> = 1;

	expect(resultTypeCheck).toBe(1);

	expect(result).toStrictEqual(item);
});
