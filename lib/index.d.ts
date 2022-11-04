/// <reference types="node" />

declare module "split-frames" {

	type ControlBits = "none" | "end+1" | "end+2";
	type Tag = number | Buffer | Array<number>;

	interface SearchedBits {
		"start": number;
		"end": number;
	}

	interface iOptions {
		"startWith"?: Tag;
		"startTimeout"?: number;
		"endWith"?: Tag;
		"escapeWith"?: Tag;
		"escaped"?: Array<number>;
		"specifics"?: { [key:string]: Tag };
		"controlBits"?: ControlBits;
	}

	class Splitter extends require("stream").Transform {

		protected _frame: Buffer;
		protected _digesting: boolean;

		// from params
		protected _startWith: Tag;
		protected _startTimeout: number;
		protected _endWith: Tag;
		protected _escapeWith: number;
		protected _escaped: Array<number>;
		protected _specifics: object;
		protected _controlBits: ControlBits;

		// constructor

		constructor (params?: iOptions);

		// methods
		protected _searchFirstTag(tag: Tag, beginWith?: number): SearchedBits;
		protected _searchFirstStart(): SearchedBits;
		protected _searchFirstEnd(): SearchedBits;
		protected _searchTags(tag: Tag, beginWith?: number): number;
		protected _digest(): void;
		protected _digester(): void;
		protected _transform(chunk: Buffer, enc?: string, cb?: () => void): void;

	}

	export = Splitter;

}
