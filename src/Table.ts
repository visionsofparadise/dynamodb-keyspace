import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { U, A } from 'ts-toolbelt';
import { DkClient, DkClientConfig } from './Client';
import { GenericAttributes, Remap } from './util/utils';
import { KeySpace } from './KeySpace';

export const primaryIndex = 'primaryIndex' as const;

export type PrimaryIndex = typeof primaryIndex;

export namespace Table {
	export type GetIndexAttributeKeyMap<T extends Table> = {
		[x in T['indexes'][number]]:
			| T['config']['indexes'][x]['hash']['key']
			| Exclude<
					T['config']['indexes'][x]['sort'] extends IndexAttributeConfig
						? T['config']['indexes'][x]['sort']['key']
						: never,
					never
			  >;
	};

	export type GetIndexAttributeKeys<
		T extends Table,
		Index extends T['indexes'][number] = T['indexes'][number]
	> = Table.GetIndexAttributeKeyMap<T>[Index];

	export type GetIndexHashKeyMap<T extends Table> = {
		[x in T['indexes'][number]]: T['config']['indexes'][x]['hash']['key'];
	};

	export type GetIndexHashKey<
		T extends Table,
		Index extends T['indexes'][number] = T['indexes'][number]
	> = Table.GetIndexHashKeyMap<T>[Index];

	export type GetIndexKeyMap<T extends Table> = {
		[x in T['indexes'][number]]: {
			[y in T['config']['indexes'][x]['hash']['key']]: IndexAttributeValueToType<
				T['config']['indexes'][x]['hash']['value']
			>;
		} & (T['config']['indexes'][x]['sort'] extends IndexAttributeConfig
			? {
					[y in T['config']['indexes'][x]['sort']['key']]: IndexAttributeValueToType<
						T['config']['indexes'][x]['sort']['value']
					>;
			  }
			: {});
	};

	export type GetIndexKey<
		T extends Table,
		Index extends T['indexes'][number] | never | undefined = T['indexes'][number]
	> = Remap<U.IntersectOf<Table.GetIndexKeyMap<T>[Exclude<Index, never | undefined>]>>;

	export type GetIndexCursorKey<
		T extends Table,
		Index extends T['secondaryIndexes'][number] | never | undefined
	> = Remap<A.Cast<Table.GetIndexKey<T, T['primaryIndex'] | Index>, Table.GetIndexKey<T, T['primaryIndex']>>>;

	export type GetAttributes<T extends Table> = Remap<
		T['secondaryIndexes'][number] extends string
			? Table.GetIndexKeyMap<T>[T['primaryIndex']] &
					Partial<U.IntersectOf<Table.GetIndexKeyMap<T>[T['secondaryIndexes'][number]]>>
			: Table.GetIndexKeyMap<T>[T['primaryIndex']]
	>;
}

export type IndexAttributeValue = 'string' | 'string?' | 'number' | 'number?';

export type IndexAttributeValueToType<T extends IndexAttributeValue = 'string'> = T extends 'string'
	? string
	: T extends 'string?'
	? string | undefined
	: T extends 'number'
	? number
	: T extends 'number?'
	? number | undefined
	: never;

export interface IndexAttributeConfig<
	Key extends string = string,
	Value extends IndexAttributeValue = IndexAttributeValue
> {
	key: Key;
	value: Value;
}

export interface PrimaryIndexConfig<
	HashKey extends string = string,
	HashValue extends IndexAttributeValue = IndexAttributeValue,
	SortKey extends string = string,
	SortValue extends IndexAttributeValue = IndexAttributeValue
> {
	hash: IndexAttributeConfig<HashKey, Extract<HashValue, 'string' | 'number'>>;
	sort?: IndexAttributeConfig<SortKey, SortValue>;
}

export type IndexProjection<Attributes extends string> = never | never[] | Attributes[];

export interface SecondaryIndexConfig<
	HashKey extends string = string,
	HashValue extends IndexAttributeValue = IndexAttributeValue,
	SortKey extends string = string,
	SortValue extends IndexAttributeValue = IndexAttributeValue,
	ProjectionKeys extends string = string,
	Projection extends IndexProjection<ProjectionKeys> = IndexProjection<ProjectionKeys>
> extends PrimaryIndexConfig<HashKey, HashValue, SortKey, SortValue> {
	projection?: Projection;
}

export interface TableConfig<
	AttributeKey extends string = string,
	AttributeValue extends IndexAttributeValue = IndexAttributeValue,
	ProjectionKeys extends string = string,
	Projection extends IndexProjection<ProjectionKeys> = IndexProjection<ProjectionKeys>
> extends Partial<DkClientConfig> {
	client: DynamoDBDocumentClient;
	name: string;
	indexes: Record<PrimaryIndex, PrimaryIndexConfig<AttributeKey, AttributeValue, AttributeKey, AttributeValue>> &
		Record<
			Exclude<string, PrimaryIndex>,
			SecondaryIndexConfig<AttributeKey, AttributeValue, AttributeKey, AttributeValue, ProjectionKeys, Projection>
		>;
}

export class Table<
	AttributeKey extends string = any,
	AttributeValue extends IndexAttributeValue = any,
	ProjectionKeys extends string = any,
	Projection extends IndexProjection<ProjectionKeys> = any,
	Config extends TableConfig<AttributeKey, AttributeValue, ProjectionKeys, Projection> = TableConfig<
		AttributeKey,
		AttributeValue,
		ProjectionKeys,
		Projection
	>
> {
	client: DynamoDBDocumentClient;
	dkClient: DkClient;

	tableName: string;

	constructor(public config: Config) {
		this.client = config.client;
		this.dkClient = new DkClient(config.client);

		this.dkClient.setDefaults(this.config.defaults);
		this.dkClient.setMiddleware(this.config.middleware);

		this.tableName = this.config.name;
	}

	configure<
		ConfigAttributeKey extends string,
		ConfigAttributeValue extends IndexAttributeValue,
		ConfigProjectionKeys extends string,
		ConfigProjection extends IndexProjection<ConfigProjectionKeys>,
		ConfigConfig extends TableConfig<ConfigAttributeKey, ConfigAttributeValue, ConfigProjectionKeys, ConfigProjection>
	>(
		config: ConfigConfig
	): Table<ConfigAttributeKey, ConfigAttributeValue, ConfigProjectionKeys, ConfigProjection, ConfigConfig> {
		return new Table<ConfigAttributeKey, ConfigAttributeValue, ConfigProjectionKeys, ConfigProjection, ConfigConfig>(
			config
		);
	}

	get KeySpace() {
		const ParentTable = new Table<AttributeKey, AttributeValue, ProjectionKeys, Projection, Config>(this.config);

		return class TableKeySpace<
			Attributes extends GenericAttributes = GenericAttributes,
			SecondaryIndex extends (typeof ParentTable)['secondaryIndexes'][number] | never = never
		> extends KeySpace<typeof ParentTable, Attributes, SecondaryIndex> {
			constructor() {
				super(ParentTable, {} as any);
			}
		};
	}

	get indexes(): Array<string & keyof Config['indexes']> {
		return Object.keys(this.config.indexes);
	}

	get primaryIndex(): PrimaryIndex {
		return primaryIndex;
	}

	get secondaryIndexes(): Array<string & Exclude<this['indexes'][number], this['primaryIndex']>> {
		return this.indexes.filter(
			(index): index is Exclude<this['indexes'][number], this['primaryIndex']> => index !== this.primaryIndex
		);
	}

	indexAttributeKeys = <Index extends this['indexes'][number]>(
		index: Index
	): Array<Table.GetIndexAttributeKeys<this, Index>> => {
		const indexConfig = this.config.indexes[index];

		return indexConfig.sort ? [indexConfig.hash.key, indexConfig.sort.key] : [indexConfig.hash.key];
	};

	get attributeKeys(): Array<Table.GetIndexAttributeKeys<this, this['indexes'][number]>> {
		return this.indexes.flatMap(index => this.indexAttributeKeys(index));
	}

	pickPrimaryIndexKey = <T extends Partial<Table.GetAttributes<this>>>(
		object: T
	): Table.GetIndexKey<this, this['primaryIndex']> => {
		return Object.fromEntries(this.indexAttributeKeys(this.primaryIndex).map(key => [key, object[key]]));
	};

	omitIndexKeys<T extends Partial<Table.GetAttributes<this>>>(object: T): Omit<T, AttributeKey> {
		const clone = { ...object };

		this.attributeKeys.forEach(key => {
			if (key in clone) delete clone[key];
		});

		return clone;
	}
}
