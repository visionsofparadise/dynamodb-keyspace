import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Table, BillingMode, AttributeType, ProjectionType } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DynamoDBKeySpaceStack extends Stack {
	public readonly tableName: CfnOutput;
	public readonly scanTableName: CfnOutput;
	public readonly resetTableName: CfnOutput;

	constructor(scope: Construct, id: string, props: StackProps & { stage: string; deploymentName: string }) {
		super(scope, id, props);

		const database = new Table(this, 'database', {
			tableName: `${props.deploymentName}-database`,
			billingMode: BillingMode.PAY_PER_REQUEST,
			removalPolicy: RemovalPolicy.DESTROY,
			partitionKey: { name: 'pk', type: AttributeType.STRING },
			sortKey: { name: 'sk', type: AttributeType.STRING }
		});

		database.addGlobalSecondaryIndex({
			indexName: `gsi0`,
			partitionKey: { name: `gsi0Pk`, type: AttributeType.STRING },
			sortKey: { name: `gsi0Sk`, type: AttributeType.STRING },
			projectionType: ProjectionType.ALL
		});

		database.addGlobalSecondaryIndex({
			indexName: `gsi1`,
			partitionKey: { name: `gsi1Pk`, type: AttributeType.NUMBER },
			sortKey: { name: `gsi1Sk`, type: AttributeType.NUMBER },
			projectionType: ProjectionType.ALL
		});

		database.addGlobalSecondaryIndex({
			indexName: `gsi2`,
			partitionKey: { name: `gsi2Pk`, type: AttributeType.STRING },
			sortKey: { name: `gsi2Sk`, type: AttributeType.NUMBER },
			projectionType: ProjectionType.ALL
		});

		database.addGlobalSecondaryIndex({
			indexName: `gsi3`,
			partitionKey: { name: `gsi3Pk`, type: AttributeType.NUMBER },
			sortKey: { name: `gsi3Sk`, type: AttributeType.STRING },
			projectionType: ProjectionType.ALL
		});

		database.addGlobalSecondaryIndex({
			indexName: `gsi4`,
			partitionKey: { name: `gsi4Pk`, type: AttributeType.STRING },
			projectionType: ProjectionType.ALL
		});

		database.addGlobalSecondaryIndex({
			indexName: `gsi5`,
			partitionKey: { name: `gsi5Pk`, type: AttributeType.NUMBER },
			projectionType: ProjectionType.ALL
		});

		this.tableName = new CfnOutput(this, `${props.deploymentName}-tableName`, {
			value: database.tableName,
			exportName: `${props.deploymentName}-tableName`
		});

		const scanDatabase = new Table(this, 'scanDatabase', {
			tableName: `${props.deploymentName}-scan-database`,
			billingMode: BillingMode.PAY_PER_REQUEST,
			removalPolicy: RemovalPolicy.DESTROY,
			partitionKey: { name: 'pk', type: AttributeType.STRING },
			sortKey: { name: 'sk', type: AttributeType.STRING }
		});

		this.scanTableName = new CfnOutput(this, `${props.deploymentName}-scanTableName`, {
			value: scanDatabase.tableName,
			exportName: `${props.deploymentName}-scanTableName`
		});

		const resetDatabase = new Table(this, 'resetDatabase', {
			tableName: `${props.deploymentName}-reset-database`,
			billingMode: BillingMode.PAY_PER_REQUEST,
			removalPolicy: RemovalPolicy.DESTROY,
			partitionKey: { name: 'pk', type: AttributeType.STRING },
			sortKey: { name: 'sk', type: AttributeType.STRING }
		});

		this.resetTableName = new CfnOutput(this, `${props.deploymentName}-resetTableName`, {
			value: resetDatabase.tableName,
			exportName: `${props.deploymentName}-resetTableName`
		});
	}
}
