import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Table } from './Table';

export const TABLE_NAME = process.env.DYNAMODB_TABLE || 'test';

export const Client =
	process.env.INTEGRATION_TEST === 'true'
		? new DynamoDB({})
		: new DynamoDB({
				endpoint: 'http://127.0.0.1:8000',
				region: 'local-env',
				credentials: {
					accessKeyId: 'fakeMyKeyId',
					secretAccessKey: 'fakeSecretAccessKey'
				}
		  });

export const DocumentClient = DynamoDBDocumentClient.from(Client);

export const NoGsiTable = new Table({
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
	}
});

export const ManyGsiTable = new Table({
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
		},
		gsi0: {
			hash: {
				key: 'gsi0Pk',
				value: 'string'
			},
			sort: {
				key: 'gsi0Sk',
				value: 'string'
			}
		},
		gsi1: {
			hash: {
				key: 'gsi1Pk',
				value: 'number'
			},
			sort: {
				key: 'gsi1Sk',
				value: 'number?'
			},
			projection: []
		},
		gsi2: {
			hash: {
				key: 'gsi2Pk',
				value: 'string'
			},
			sort: {
				key: 'gsi2Sk',
				value: 'number'
			},
			projection: ['string']
		},
		gsi3: {
			hash: {
				key: 'gsi3Pk',
				value: 'number'
			},
			sort: {
				key: 'gsi3Sk',
				value: 'string?'
			}
		},
		gsi4: {
			hash: {
				key: 'gsi4Pk',
				value: 'string'
			}
		},
		gsi5: {
			hash: {
				key: 'gsi5Pk',
				value: 'number'
			}
		}
	}
});
