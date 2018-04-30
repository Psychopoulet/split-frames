/// <reference types="node" />

declare module "split-frames" {

	type iTag = number|Buffer|Array<number>;

	class Splitter extends require("stream").Transform {

		protected _startWith: iTag;
		protected _endWith: iTag;
		protected _escapeWith: iTag;
		protected _escaped: Array<iTag>;
		protected _specifics: Array<iTag>;
		protected _frame: Buffer;
		protected _digesting: boolean;
		protected _digester: () => void;

		constructor(software: string, args?: Array<string>, options?: object);

		protected _searchTags(tag: iTag): number;
		protected _removeEscapeTag(chunk: Buffer): Buffer;
		protected _digest(): void;
		protected _transform(chunk: Buffer, enc?: string, cb?: () => void): void;

	}

	export = Splitter;

}