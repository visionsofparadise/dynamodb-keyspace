import dayjs from 'dayjs';
import { randomNumber, randomString } from './util/utils';
import { createItem } from './method/create';
import { getItem } from './method/get';
import { updateQuickItem } from './method/updateQuick';
import { dkSetAttributeOnWriteMiddleware } from './util/setAttributeOnWriteMiddleware';
import { DocumentClient, TABLE_NAME } from './TableTest.dev';
import { Table } from './Table';
import { TestItem } from './KeySpaceTest.dev';

const MiddlewareTable = new Table({
	client: DocumentClient,
	name: TABLE_NAME,
	indexes: {
		primaryIndex: {
			hash: {
				key: 'pk',
				value: 'string'
			},
			sort: {
				key: 'sk',
				value: 'string'
			}
		}
	},
	middleware: dkSetAttributeOnWriteMiddleware('updatedAt', () => dayjs().valueOf())
});

it('implements updatedAt attribute with middleware', async () => {
	const MiddlewareKeySpace = new MiddlewareTable.KeySpace<TestItem>().configure({
		indexValueHandlers: {
			primaryIndex: {
				pk: (params: Pick<TestItem, 'string'>) => params.string,
				sk: (params: Pick<TestItem, 'number'>) => `${params.number}`
			}
		}
	});

	const testItem: TestItem = {
		number: randomNumber(),
		string: randomString()
	};

	await createItem(MiddlewareKeySpace, testItem);

	const item = await getItem(MiddlewareKeySpace, testItem);

	expect(item.updatedAt).toBeDefined();

	await updateQuickItem(MiddlewareKeySpace, testItem, {
		updateableString: randomString()
	});

	const item2 = await getItem(MiddlewareKeySpace, testItem);

	expect(item2.updatedAt! > item.updatedAt!).toBe(true);
});
