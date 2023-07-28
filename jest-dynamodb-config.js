module.exports = {
	hostname: "127.0.0.1",
	tables: [
		{
			TableName: `test`,
			KeySchema: [
				{ AttributeName: 'pk', KeyType: 'HASH' },
				{ AttributeName: 'sk', KeyType: 'RANGE' }
			],
			AttributeDefinitions: [
				{ AttributeName: 'pk', AttributeType: 'S' },
				{ AttributeName: 'sk', AttributeType: 'S' },
				{ AttributeName: 'gsi0Pk', AttributeType: 'S' },
				{ AttributeName: 'gsi0Sk', AttributeType: 'S' },
				{ AttributeName: 'gsi1Pk', AttributeType: 'N' },
				{ AttributeName: 'gsi1Sk', AttributeType: 'N' },
				{ AttributeName: 'gsi2Pk', AttributeType: 'S' },
				{ AttributeName: 'gsi2Sk', AttributeType: 'N' },
				{ AttributeName: 'gsi3Pk', AttributeType: 'N' },
				{ AttributeName: 'gsi3Sk', AttributeType: 'S' },
				{ AttributeName: 'gsi4Pk', AttributeType: 'S' },
				{ AttributeName: 'gsi5Pk', AttributeType: 'N' }
			],
			ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
			GlobalSecondaryIndexes: [
				{
					IndexName: 'gsi0',
					KeySchema: [
						{ AttributeName: 'gsi0Pk', KeyType: 'HASH' },
						{ AttributeName: 'gsi0Sk', KeyType: 'RANGE' }
					],
					Projection: {
						ProjectionType: 'ALL'
					},
					ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
				},
				{
					IndexName: 'gsi1',
					KeySchema: [
						{ AttributeName: 'gsi1Pk', KeyType: 'HASH' },
						{ AttributeName: 'gsi1Sk', KeyType: 'RANGE' }
					],
					Projection: {
						ProjectionType: 'KEYS_ONLY'
					},
					ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
				},
				{
					IndexName: 'gsi2',
					KeySchema: [
						{ AttributeName: 'gsi2Pk', KeyType: 'HASH' },
						{ AttributeName: 'gsi2Sk', KeyType: 'RANGE' }
					],
					Projection: {
						ProjectionType: 'INCLUDE',
						NonKeyAttributes: ['string']
					},
					ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
				},
				{
					IndexName: 'gsi3',
					KeySchema: [
						{ AttributeName: 'gsi3Pk', KeyType: 'HASH' },
						{ AttributeName: 'gsi3Sk', KeyType: 'RANGE' }
					],
					Projection: {
						ProjectionType: 'ALL'
					},
					ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
				},
				{
					IndexName: 'gsi4',
					KeySchema: [{ AttributeName: 'gsi4Pk', KeyType: 'HASH' }],
					Projection: {
						ProjectionType: 'ALL'
					},
					ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
				},
				{
					IndexName: 'gsi5',
					KeySchema: [{ AttributeName: 'gsi5Pk', KeyType: 'HASH' }],
					Projection: {
						ProjectionType: 'ALL'
					},
					ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
				}
			]
		},
		{
			TableName: `scanTest`,
			KeySchema: [
				{ AttributeName: 'pk', KeyType: 'HASH' },
				{ AttributeName: 'sk', KeyType: 'RANGE' }
			],
			AttributeDefinitions: [
				{ AttributeName: 'pk', AttributeType: 'S' },
				{ AttributeName: 'sk', AttributeType: 'S' },
			],
			ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
		},
		{
			TableName: `resetTest`,
			KeySchema: [
				{ AttributeName: 'pk', KeyType: 'HASH' },
				{ AttributeName: 'sk', KeyType: 'RANGE' }
			],
			AttributeDefinitions: [
				{ AttributeName: 'pk', AttributeType: 'S' },
				{ AttributeName: 'sk', AttributeType: 'S' },
			],
			ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
		}
	]
};
