export type AllSchema<ObjectType, ValueType> = ObjectType extends string
	? ValueType
	: ObjectType extends Map<unknown, unknown>
	? ValueType
	: ObjectType extends Set<unknown>
	? ValueType
	: ObjectType extends ReadonlyMap<unknown, unknown>
	? ValueType
	: ObjectType extends ReadonlySet<unknown>
	? ValueType
	: ObjectType extends readonly unknown[]
	? ValueType
	: ObjectType extends unknown[]
	? ValueType
	: ObjectType extends Date
	? ValueType
	: ObjectType extends Function
	? ValueType
	: ObjectType extends RegExp
	? ValueType
	: ObjectType extends object
	? ValueType | SchemaObject<ObjectType, ValueType>
	: ValueType;

type SchemaObject<ObjectType extends object, K> = {
	[KeyType in keyof ObjectType]: AllSchema<ObjectType[KeyType], K> | K;
};
