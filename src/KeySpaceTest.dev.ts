import { ManyGsiTable } from './TableTest.dev';

export interface TestItem {
	string: string;
	number: number;
	updateableString?: string;
	list?: Array<string>;
	deep?: {
		deep: {
			deep: {
				string: string;
			};
		};
	};
	createdAt?: number;
	updatedAt?: number;
}

export const ManyGsiKeySpace = new ManyGsiTable.KeySpace<
	TestItem,
	'gsi0' | 'gsi1' | 'gsi2' | 'gsi3' | 'gsi4' | 'gsi5'
>().configure({
	indexValueHandlers: {
		primaryIndex: {
			pk: (params: Pick<TestItem, 'string'>) => params.string,
			sk: (params: Pick<TestItem, 'number'>) => `${params.number}`
		},
		gsi0: {
			gsi0Pk: (params: Pick<TestItem, 'number'>) => `${params.number}`,
			gsi0Sk: (params: Pick<TestItem, 'string'>) => params.string
		},
		gsi1: {
			gsi1Pk: (params: Pick<TestItem, 'number'>) => params.number,
			gsi1Sk: (params: Pick<TestItem, 'number'>) => params.number
		},
		gsi2: {
			gsi2Pk: (params: Pick<TestItem, 'string'>) => params.string,
			gsi2Sk: (params: Pick<TestItem, 'number'>) => params.number
		},
		gsi3: {
			gsi3Pk: (params: Pick<TestItem, 'number'>) => params.number,
			gsi3Sk: (params: Pick<TestItem, 'string'>) => params.string
		},
		gsi4: {
			gsi4Pk: (params: Pick<TestItem, 'string'>) => params.string
		},
		gsi5: {
			gsi5Pk: (params: Pick<TestItem, 'number'>) => params.number
		}
	}
});

export const NoGsiKeySpace = new ManyGsiTable.KeySpace<TestItem>().configure({
	indexValueHandlers: {
		primaryIndex: {
			pk: (params: Pick<TestItem, 'string'>) => params.string,
			sk: (params: Pick<TestItem, 'number'>) => `${params.number}`
		}
	}
});

export const NoGsiNeverParamKeySpace = new ManyGsiTable.KeySpace<TestItem>().configure({
	indexValueHandlers: {
		primaryIndex: {
			pk: () => `test`,
			sk: (params: Pick<TestItem, 'string'>) => params.string
		}
	}
});

export const NoGsiNeverParamsKeySpace = new ManyGsiTable.KeySpace<TestItem>().configure({
	indexValueHandlers: {
		primaryIndex: {
			pk: () => `test`,
			sk: () => `test`
		}
	}
});
