/// <reference types="node" />

declare module "split-frames" {

	type ControlBits = "none" | "end+1" | "end+2";
	type Tag = number | Buffer | Array<number>;

	interface SearchedBits {
		"start": number;
		"end": number;
	}

	class Splitter extends require("stream").Transform {

		protected _controlBits: ControlBits;
		protected _startWith: Tag;
		protected _endWith: Tag;
		protected _escapeWith: Tag;
		protected _escaped: Array<Tag>;
		protected _specifics: Array<Tag>;
		protected _frame: Buffer;
		protected _digesting: boolean;
		protected _digester: () => void;

		protected _searchFirstStart(): SearchedBits;
		protected _searchFirstEnd(): SearchedBits;
		protected _searchTags(tag: Tag): number;
		protected _digest(): void;
		protected _transform(chunk: Buffer, enc?: string, cb?: () => void): void;

	}

	export = Splitter;

}
