import { A } from 'ts-toolbelt';
import { TestItem, ManyGsiKeySpace, NoGsiNeverParamKeySpace, NoGsiNeverParamsKeySpace } from './KeySpaceTest.dev';
import { KeySpace } from './KeySpace';

const string = 'test';
const number = 1;

const testItem: KeySpace.GetAttributes<typeof ManyGsiKeySpace> = {
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

type ManyGsiKeySpaceIndexKeys = {
	pk: string;
	sk: string;
	gsi0Pk: string;
	gsi0Sk: string;
	gsi1Pk: number;
	gsi1Sk: number | undefined;
	gsi2Pk: string;
	gsi2Sk: number;
	gsi3Pk: number;
	gsi3Sk: string | undefined;
	gsi4Pk: string;
	gsi5Pk: number;
};

it('returns indexes', () => {
	const check: A.Equals<
		(typeof ManyGsiKeySpace)['indexes'],
		Array<'primaryIndex' | 'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5'>
	> = 1;

	expect(check).toBe(1);

	expect(ManyGsiKeySpace.indexes).toStrictEqual(['primaryIndex', 'gsi0', 'gsi1', 'gsi2', 'gsi3', 'gsi4', 'gsi5']);
});

it('returns index key keys', () => {
	const check: A.Equals<
		(typeof ManyGsiKeySpace)['attributeKeys'],
		Array<
			| 'pk'
			| 'sk'
			| 'gsi0Pk'
			| 'gsi0Sk'
			| 'gsi1Pk'
			| 'gsi1Sk'
			| 'gsi2Pk'
			| 'gsi2Sk'
			| 'gsi3Pk'
			| 'gsi3Sk'
			| 'gsi4Pk'
			| 'gsi5Pk'
		>
	> = 1;

	ManyGsiKeySpace.indexAttributeKeys('gsi0');

	expect(check).toBe(1);

	expect(ManyGsiKeySpace.attributeKeys).toStrictEqual([
		'pk',
		'sk',
		'gsi0Pk',
		'gsi0Sk',
		'gsi1Pk',
		'gsi1Sk',
		'gsi2Pk',
		'gsi2Sk',
		'gsi3Pk',
		'gsi3Sk',
		'gsi4Pk',
		'gsi5Pk'
	]);
});

it('generates primary index key', () => {
	const paramCheck: A.Equals<Parameters<(typeof ManyGsiKeySpace)['keyOf']>[0], Pick<TestItem, 'string' | 'number'>> = 1;

	expect(paramCheck).toBe(1);

	const primaryIndexKey = ManyGsiKeySpace.keyOf({
		string,
		number
	});

	const check: A.Equals<typeof primaryIndexKey, { pk: string; sk: string }> = 1;

	expect(check).toBe(1);

	expect(primaryIndexKey.pk).toBe('test');
	expect(primaryIndexKey.sk).toBe('1');
	expect(Object.keys(primaryIndexKey).length).toBe(2);
});

it('generates secondary index key', () => {
	const secondaryIndexKey = ManyGsiKeySpace.indexKeyOf('gsi0', {
		number,
		string
	});

	const check: A.Equals<typeof secondaryIndexKey, { gsi0Pk: string; gsi0Sk: string }> = 1;

	expect(check).toBe(1);

	expect(secondaryIndexKey.gsi0Pk).toBe('1');
	expect(secondaryIndexKey.gsi0Sk).toBe('test');
	expect(Object.keys(secondaryIndexKey).length).toBe(2);
});

it('generates index keys', () => {
	const indexKeys = ManyGsiKeySpace.indexKeysOf({
		number,
		string
	});

	const check: A.Equals<typeof indexKeys, ManyGsiKeySpaceIndexKeys> = 1;

	expect(check).toBe(1);

	expect(indexKeys.pk).toBe('test');
	expect(indexKeys.sk).toBe('1');
	expect(indexKeys.gsi0Pk).toBe('1');
	expect(indexKeys.gsi0Sk).toBe('test');
	expect(Object.keys(indexKeys).length).toBe(12);
});

it('returns testItem with index keys', () => {
	const withIndexKeys = ManyGsiKeySpace.withIndexKeys(testItem);

	const check: A.Equals<typeof withIndexKeys, TestItem & ManyGsiKeySpaceIndexKeys> = 1;

	expect(check).toBe(1);

	expect(Object.keys(withIndexKeys).length).toBe(15);
});

it('omits index keys', () => {
	const testItemWithKeys = ManyGsiKeySpace.withIndexKeys(testItem);

	const omitIndexKeys = ManyGsiKeySpace.omitIndexKeys(testItemWithKeys);

	const check: A.Equals<typeof omitIndexKeys, TestItem> = 1;

	expect(check).toBe(1);

	expect(Object.keys(omitIndexKeys).length).toBe(3);
});

it('combines params without never', () => {
	const check: A.Equals<Parameters<typeof NoGsiNeverParamKeySpace.keyOf>[0], { string: string }> = 1;

	expect(check).toBe(1);
});

it('combines params without never', () => {
	const check: A.Equals<Parameters<typeof NoGsiNeverParamsKeySpace.keyOf>[0], never> = 1;

	expect(check).toBe(1);
});
