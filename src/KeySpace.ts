import { PrimaryIndex, Table, primaryIndex } from './Table';
import { GenericAttributes, Remap } from './util/utils';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { U } from 'ts-toolbelt';
import { appendMiddleware } from './Middleware';
import { DkClient, DkClientConfig } from './Client';

export namespace KeySpace {
	export type GetKeyParams<K extends KeySpace, Index extends K['indexes'][number]> = Remap<
		Exclude<GetIndexKeyValueParamsMap<K>[Index], undefined | never>
	>;

	export type GetIndexAttributeKeys<
		K extends KeySpace,
		Index extends K['indexes'][number] = K['indexes'][number]
	> = Table.GetIndexAttributeKeyMap<K['Table']>[Index];

	export type GetIndexKeyMap<K extends KeySpace> = {
		[x in K['indexes'][number]]: Table.GetIndexKeyMap<K['Table']>[x];
	};

	export type GetIndexKey<K extends KeySpace, Index extends K['indexes'][number]> = Remap<
		U.IntersectOf<KeySpace.GetIndexKeyMap<K>[Index]>
	>;

	export type GetAttributes<K extends KeySpace> = Parameters<K['indexKeysOf']>[0];

	export type GetAttributesAndKeys<K extends KeySpace> = GetAttributes<K> &
		KeySpace.GetIndexKey<K, K['indexes'][number]>;

	export type GetIndexValueParamsMap<K extends KeySpace> = {
		[x in K['indexes'][number]]: {
			[y in keyof K['indexValueHandlers'][x]]: Exclude<Parameters<K['indexValueHandlers'][x][y]>[0], undefined | never>;
		};
	};

	export type GetIndexKeyValueParamsMap<K extends KeySpace> = {
		[x in K['indexes'][number]]: U.IntersectOf<GetIndexValueParamsMap<K>[x][keyof GetIndexValueParamsMap<K>[x]]>;
	};

	export type GetIndexKeyValueParams<K extends KeySpace, Index extends K['indexes'][number]> = Remap<
		GetIndexKeyValueParamsMap<K>[Index]
	>;

	export type GetIndexHashKeyValueParamsMap<K extends KeySpace> = {
		[x in K['indexes'][number]]: GetIndexValueParamsMap<K>[x][Table.GetIndexHashKey<K['Table'], x>];
	};
}

export type IndexValueHandlersType<
	ParentTable extends Table = Table,
	Attributes extends GenericAttributes = GenericAttributes,
	SecondaryIndex extends ParentTable['secondaryIndexes'][number] | never = never
> = {
	[x in string & Exclude<PrimaryIndex | SecondaryIndex, never>]: {
		[y in keyof Table.GetIndexKey<ParentTable, x>]: (params: Attributes) => Table.GetIndexKey<ParentTable, x>[y];
	};
};

export interface KeySpaceConfig<
	ParentTable extends Table = Table,
	Attributes extends GenericAttributes = GenericAttributes,
	SecondaryIndex extends ParentTable['secondaryIndexes'][number] | never = never,
	IndexValueHandlers extends IndexValueHandlersType<ParentTable, Attributes, SecondaryIndex> = any
> extends Partial<DkClientConfig> {
	indexValueHandlers: IndexValueHandlers;
}

export class KeySpace<
	ParentTable extends Table = any,
	Attributes extends GenericAttributes = GenericAttributes,
	SecondaryIndex extends ParentTable['secondaryIndexes'][number] | never = any,
	IndexValueHandlers extends IndexValueHandlersType<ParentTable, Attributes, SecondaryIndex> = any
> {
	client: DynamoDBDocumentClient;
	dkClient: DkClient;

	tableName: string;

	indexValueHandlers: IndexValueHandlers;

	constructor(
		public Table: ParentTable,
		public config: KeySpaceConfig<ParentTable, Attributes, SecondaryIndex, IndexValueHandlers>
	) {
		this.client = config.client || Table.client;
		this.dkClient = Table.dkClient;

		this.dkClient.setClient(config.client);
		this.dkClient.setDefaults({ ...this.dkClient.defaults, ...config.defaults });
		this.dkClient.setMiddleware(appendMiddleware(this.dkClient.middleware, config.middleware || []));
		this.dkClient.setLogger(config.logger);

		this.tableName = Table.config.name;
		this.indexValueHandlers = config.indexValueHandlers;
	}

	configure<ConfigIndexValueHandlers extends IndexValueHandlersType<ParentTable, Attributes, SecondaryIndex> = any>(
		config: KeySpaceConfig<ParentTable, Attributes, SecondaryIndex, ConfigIndexValueHandlers>
	): KeySpace<ParentTable, Attributes, SecondaryIndex, ConfigIndexValueHandlers> {
		return new KeySpace<ParentTable, Attributes, SecondaryIndex, ConfigIndexValueHandlers>(this.Table, config);
	}

	get indexes(): Array<this['Table']['primaryIndex'] | Exclude<SecondaryIndex, never>> {
		return Object.keys(this.indexValueHandlers).filter(
			(index): index is this['Table']['primaryIndex'] | Exclude<SecondaryIndex, never> =>
				this.Table.indexes.includes(index)
		);
	}

	get primaryIndex(): this['Table']['primaryIndex'] {
		return this.Table.primaryIndex;
	}

	get secondaryIndexes(): Array<Exclude<this['indexes'][number], this['primaryIndex']>> {
		return this.indexes.filter(
			(index): index is Exclude<this['indexes'][number], this['primaryIndex']> => index !== this.primaryIndex
		);
	}

	indexAttributeKeys = <Index extends this['indexes'][number]>(
		index: Index
	): Array<Table.GetIndexAttributeKeys<this['Table'], Index>> => {
		const indexConfig = this.Table.config.indexes[index];

		return indexConfig.sort ? [indexConfig.hash.key, indexConfig.sort.key] : [indexConfig.hash.key];
	};

	get attributeKeys(): Array<KeySpace.GetIndexAttributeKeys<this, this['indexes'][number]>> {
		return this.indexes.flatMap(index => this.indexAttributeKeys(index));
	}

	indexAttributeValue<
		Index extends this['indexes'][number],
		Key extends keyof this['config']['indexValueHandlers'][Index]
	>(
		index: Index,
		key: Key,
		params: Parameters<this['config']['indexValueHandlers'][Index][Key]>[0]
	): ReturnType<this['config']['indexValueHandlers'][Index][Key]> {
		return this.indexValueHandlers[index][key](params) as ReturnType<this['config']['indexValueHandlers'][Index][Key]>;
	}

	keyOf(
		params: KeySpace.GetIndexKeyValueParams<this, this['primaryIndex']>
	): KeySpace.GetIndexKey<this, this['primaryIndex']> {
		return this.indexKeyOf(primaryIndex, params);
	}

	indexKeyOf<Index extends this['indexes'][number]>(
		index: Index,
		params: KeySpace.GetIndexKeyValueParams<this, Index>
	): KeySpace.GetIndexKey<this, Index> {
		const keys = this.indexAttributeKeys(index);

		return Object.fromEntries(keys.map(key => [key, this.indexAttributeValue(index, key, params as any)]));
	}

	indexKeysOf(item: Attributes): KeySpace.GetIndexKey<this, this['indexes'][number]> {
		return this.indexes.reduce(
			(currentIndexKeys, index) => ({
				...currentIndexKeys,
				...this.indexKeyOf(index, item as KeySpace.GetIndexKeyValueParams<this, typeof index>)
			}),
			{}
		) as KeySpace.GetIndexKey<this, this['indexes'][number]>;
	}

	withIndexKeys(item: Attributes): KeySpace.GetAttributesAndKeys<this> {
		return { ...item, ...this.indexKeysOf(item) };
	}

	omitIndexKeys(item: KeySpace.GetAttributesAndKeys<this>): Attributes {
		const clone = { ...item };

		this.attributeKeys.forEach(key => {
			if (key in clone) delete clone[key];
		});

		return clone;
	}

	assertAttributesAndKeys: (item: GenericAttributes) => asserts item is KeySpace.GetAttributesAndKeys<this> = _ => {};
}
