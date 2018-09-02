/// <reference types="node" />

declare module "split-frames" {

	type ControlBits = "none" | "start-1" | "start-2" | "start+1" | "start+2" | "end-1" | "end-2" | "end+1" | "end+2";
	type iTag = number | Buffer | Array<number>;

	class Splitter extends require("stream").Transform {

		protected _controlBits: ControlBits;
		protected _startWith: iTag;
		protected _endWith: iTag;
		protected _escapeWith: iTag;
		protected _escaped: Array<iTag>;
		protected _specifics: Array<iTag>;
		protected _frame: Buffer;
		protected _digesting: boolean;
		protected _digester: () => void;

		protected _searchTags(tag: iTag): number;
		protected _removeEscapeTag(chunk: Buffer): Buffer;
		protected _digest(): void;
		protected _transform(chunk: Buffer, enc?: string, cb?: () => void): void;

	}

	export = Splitter;

}
