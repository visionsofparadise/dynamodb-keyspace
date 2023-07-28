#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DynamoDBKeySpacePipelineStack } from './Pipeline';

export const serviceName = 'dynamodb-keyspace';

const app = new cdk.App();

new DynamoDBKeySpacePipelineStack(app, 'DynamoDBKeySpacePipelineStack', {
	env: {
		region: process.env.CDK_DEFAULT_REGION,
		account: process.env.CDK_DEFAULT_ACCOUNT
	}
});
