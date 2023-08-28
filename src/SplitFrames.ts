"use strict";

// deps

	// natives
	import { join } from "node:path";
	import { Transform } from "node:stream";

	// locals

	import initData from "./checkers/initData";

	let _digestNoStartNoEnd: (() => void) | null = null;
	let _digestStartOnly: (() => void) | null = null;
	let _digestEndOnly: (() => void) | null = null;
	let _digestStartAndEnd: (() => void) | null = null;

// types & interfaces

	// locals

		export type tTagObject = { [key:string]: tTag };

		export type tControlBits = "none" | "end+1" | "end+2";
		export type tTag = number | Buffer | Array<number> | Array<Buffer>;

		export interface iSearchedBits {
			"start": number;
			"end": number;
		};

		export interface iOptions {
			"startWith"?: tTag;
			"startTimeout"?: number;
			"endWith"?: tTag;
			"escapeWith"?: tTag;
			"escaped"?: Array<number>;
			"specifics"?: tTagObject;
			"controlBits"?: tControlBits;
		};

		export interface iConf extends iOptions {
			"escaped": Array<number>;
			"specifics": tTagObject;
			"controlBits": tControlBits;
		};

// private

	// methods

		function _chooseDigester (startWith: tTag | undefined, endWith: tTag | undefined): (enc: BufferEncoding) => void {

			let digester: (() => void) | null = null;

				if (null === startWith && null === endWith) {

					if (!_digestNoStartNoEnd) {
						_digestNoStartNoEnd = require(join(__dirname, "digesters", "digestNoStartNoEnd.js"));
					}

					digester = _digestNoStartNoEnd;

				}
				else if (null !== startWith && null === endWith) {

					if (!_digestStartOnly) {
						_digestStartOnly = require(join(__dirname, "digesters", "digestStartOnly.js"));
					}

					digester = _digestStartOnly;

				}
				else if (null === startWith && null !== endWith) {

					if (!_digestEndOnly) {
						_digestEndOnly = require(join(__dirname, "digesters", "digestEndOnly.js"));
					}

					digester = _digestEndOnly;

				}
				else {

					if (!_digestStartAndEnd) {
						_digestStartAndEnd = require(join(__dirname, "digesters", "digestStartAndEnd.js"));
					}

					digester = _digestStartAndEnd;

				}

			return digester as () => void;

		}

// module

export default class SplitFrames extends Transform {

	// attributes

		// protected

			protected _frame: Buffer;
			protected _digesting: boolean;

			// from params
			protected _startWith: iConf["startWith"];
			protected _startTimeout: iConf["startTimeout"];
			protected _endWith: iConf["endWith"];
			protected _escapeWith: iConf["escapeWith"];
			protected _escaped: iConf["escaped"];
			protected _specifics: iConf["specifics"];
			protected _controlBits: iConf["controlBits"];

			// dynamic digester
			protected _digester: (enc: BufferEncoding) => void;

	// constructor

	constructor (options?: iOptions) {

		super();

		const validatedOptions: iConf = initData(options);

		this._startWith = validatedOptions.startWith;
		this._startTimeout = validatedOptions.startTimeout;
		this._endWith = validatedOptions.endWith;

		this._escapeWith = validatedOptions.escapeWith;
		this._escaped = validatedOptions.escaped;

		this._specifics = validatedOptions.specifics;

		this._controlBits = validatedOptions.controlBits;

		this._frame = Buffer.from([]);
		this._digesting = false;

		this._digester = _chooseDigester(this._startWith, this._endWith);

	}

	// methods

		// public

			public _transform (chunk: Buffer, enc: BufferEncoding, cb: (err?: Error | null, data?: any) => void): void {

				if (chunk.length) {

					this._frame = Buffer.concat([ this._frame, chunk ]);

					if (!this._digesting) {
						this._digest(enc);
					}

				}

				return cb();

			}

		// protected

			protected _digest (enc: BufferEncoding): void {

				if (!this._frame.length) {
					this._digesting = false;
				}
				else {

					this._digesting = true;

					try {
						this._digester(enc);
					}
					catch (e) {
						this.emit("error", e);
					}

				}

			}

			protected _searchFirstTag (tag: tTag | undefined, beginAt: number = 0): iSearchedBits | null {

				let startAt: number = -1;
				let endAt: number = -1;

					// number
					if ("number" === typeof tag) {

						const find: iSearchedBits = this._searchFirstNumberTag(tag, beginAt);

						startAt = find.start;
						endAt = find.end;

					}

					// Buffer | Array
					else if ("object" === typeof tag) {

						const find = this._searchFirstBufferOrArrayTag(tag, beginAt);

						startAt = find.start;
						endAt = find.end;

					}

				// not found
				if (-1 >= startAt || -1 >= endAt) {
					return null;
				}

				// escaped
				else if (
					0 < startAt &&
					// must be a number to be escaped
					1 === endAt - startAt &&
					this._escaped.includes(this._frame[startAt]) && this._frame[startAt - 1] === this._escapeWith
				) {

					// escaper not escaped
					if (!this._escaped.includes(this._escapeWith) || 1 >= startAt || this._frame[startAt - 2] !== this._escapeWith) {
						return this._searchFirstTag(tag, endAt + 1);
					}
					else {

						return {
							"start": startAt,
							"end": endAt
						};

					}

				}

				// not escaped
				else {

					return {
						"start": startAt,
						"end": endAt
					};

				}

			}

				protected _searchFirstNumberTag (tag: number, beginAt: number): iSearchedBits {

					const startAt: number = this._frame.indexOf(tag, beginAt);

					return {
						"start": startAt,
						"end": startAt + 1
					};

				}

				protected _searchFirstBufferOrArrayTag (tag: Buffer | Array<Buffer | number>, beginAt: number): iSearchedBits {

					let startAt: number = -1;
					let endAt: number = -1;

						// Buffer
						if (tag instanceof Buffer) {

							startAt = this._frame.indexOf(tag, beginAt);
							endAt = startAt + tag.length;

						}

						// Array
						else if (tag instanceof Array) {

							for (let i: number = 0; i < tag.length; ++i) {

								// number | Buffer
								if ("number" === typeof tag[i] ||
									("object" === typeof tag[i] && tag[i] instanceof Buffer)
								) {

									const _startAt: number = this._frame.indexOf(tag[i], beginAt);

									if (-1 < _startAt && (-1 >= startAt || _startAt < startAt)) {
										startAt = _startAt;
										endAt = startAt + ("number" === typeof tag[i] ? 1 : (tag[i] as Buffer).length);
									}

								}

							}

						}

					return {
						"start": startAt,
						"end": endAt
					};

				}

			protected _searchFirstStart (): iSearchedBits | null {
				return this._searchFirstTag(this._startWith);
			}

			protected _searchFirstEnd (): iSearchedBits | null {

				const firstTag: iSearchedBits | null = this._searchFirstTag(this._endWith);

					if (firstTag) {

						if ("end+1" === this._controlBits) {
							firstTag.end += 1;
						}
						else if ("end+2" === this._controlBits) {
							firstTag.end += 2;
						}

						// end tag detected but without valid control bits length
						if (firstTag.end > this._frame.length) {
							return null;
						}

					}

				return firstTag;

			}

			protected _searchTags (tags: tTag, beginAt: number = 0): number {

				// number
				if ("number" === typeof tags) {
					return this._searchNumberTags(tags, beginAt);
				}

				// Buffer | Array
				else if ("object" === typeof tags) {
					return this._searchBufferOrArrayTags(tags, beginAt);
				}

				return -1;

			}

				protected _searchNumberTags (tags: number, beginAt: number): number {

					const foundAt: number = this._frame.indexOf(tags, beginAt);

					// escaped
					if (
						0 < foundAt &&
						this._escaped.includes(this._frame[foundAt]) &&
						this._frame[foundAt - 1] === this._escapeWith
					) {

						// escaper not escaped
						if (!this._escaped.includes(this._escapeWith) || 1 >= foundAt || this._frame[foundAt - 2] !== this._escapeWith) {
							return this._searchTags(tags, foundAt + 1);
						}

					}

					return foundAt;

				}

				// @TOTYPE
				protected _searchBufferOrArrayTags (tags: Buffer | Array<Buffer | number>, beginAt: number): number {

					// Buffer
					if (tags instanceof Buffer) {
						return this._frame.indexOf(tags, beginAt);
					}

					// Array
					else if (tags instanceof Array) {

						let foundAt: number = -1;
						let type: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" = "undefined";

							for (let i: number = 0; i < tags.length; ++i) {

								// number | Buffer
								if ("number" === typeof tags[i] || ("object" === typeof tags[i] && tags[i] instanceof Buffer)) {

									const _foundAt = this._frame.indexOf(tags[i], beginAt);

									if (-1 < _foundAt && (-1 >= foundAt || _foundAt < foundAt)) {
										foundAt = _foundAt;
										type = typeof tags[i];
									}

								}

							}

							// escaped
							if (
								"number" === type && 0 < foundAt &&
								this._escaped.includes(this._frame[foundAt]) &&
								this._frame[foundAt - 1] === this._escapeWith
							) {

								// escaper not escaped
								if (!this._escaped.includes(this._escapeWith) || 1 >= foundAt || this._frame[foundAt - 2] !== this._escapeWith) {
									foundAt = this._searchTags(tags as tTag, foundAt + 1);
								}

							}

						return foundAt;

					}

					return -1;

				}

};
