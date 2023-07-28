import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { createHash } from 'crypto';

type Log = (message: unknown) => void;

export interface ILogger {
	warn: Log;
	error: Log;
	info: Log;
	log: Log;
}

export const zipObject = <K extends PropertyKey, V>(keys: K[], values: V[]) => {
	return Object.fromEntries(keys.map((k, i) => [k, values[i]])) as { [P in K]: V };
};

export const hash = (values: Array<any>, size: number = 21) => {
	const hash = createHash('sha256');

	for (const value of values) {
		hash.update(value);
	}

	const hashValue = hash.end().read();

	return (hashValue.toString('base64url') as string).split('-').join('').split('_').join('').slice(0, size) || '';
};

export const randomNumber = () => Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
export const randomString = (size?: number) => hash([randomNumber().toString()], size);

export const run = <T>(fn: () => T): T => fn();

export const arrayOfLength = (length: number) =>
	Array.apply(null, Array(Math.max(Math.round(length), 0))).map(() => {});

export type GenericAttributes = Record<string, NativeAttributeValue>;

export type Remap<T> = T extends object
	? {
			[K in keyof T]: K extends keyof T ? T[K] : never;
	  }
	: never;
