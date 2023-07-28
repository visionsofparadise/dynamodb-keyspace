import { CfnOutput, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { serviceName } from './App';
import { DynamoDBKeySpaceStack } from './Stack';

export class DynamoDBKeySpaceStage extends Stage {
	public readonly tableName: CfnOutput;
	public readonly scanTableName: CfnOutput;
	public readonly resetTableName: CfnOutput;

	constructor(scope: Construct, id: string, props: StageProps & { stage: string }) {
		super(scope, id, props);

		const deploymentName = `${serviceName}-${props.stage}`;

		const stack = new DynamoDBKeySpaceStack(this, `${deploymentName}-stack`, {
			stage: props.stage,
			deploymentName,
			env: {
				region: process.env.CDK_DEFAULT_REGION,
				account: process.env.CDK_DEFAULT_ACCOUNT
			}
		});

		this.tableName = stack.tableName;
		this.scanTableName = stack.scanTableName;
		this.resetTableName = stack.resetTableName;
	}
}
