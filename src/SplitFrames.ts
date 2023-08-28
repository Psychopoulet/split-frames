"use strict";

// deps

	// natives
	import { Transform } from "node:stream";

	// locals

	import initData from "./checkers/initData";

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

// module

export default class SplitFrames extends Transform {

	// attributes

		// protected

			protected _frame: Buffer;
			protected _digesting: boolean;
			protected _timeoutDigest: NodeJS.Timeout | null;

			// from params

			protected _startWith: iConf["startWith"];
			protected _startTimeout: iConf["startTimeout"];
			protected _endWith: iConf["endWith"];

			protected _escapeWith: iConf["escapeWith"];
			protected _escaped: iConf["escaped"];

			protected _specifics: iConf["specifics"];
			protected _controlBits: iConf["controlBits"];

			// dynamic digester
			protected _digester: (enc?: BufferEncoding) => void;

	// constructor

	constructor (options?: iOptions) {

		super();

		this._frame = Buffer.from([]);
		this._digesting = false;
		this._timeoutDigest = null;

		// from params

		const validatedOptions: iConf = initData(options);

		this._startWith = validatedOptions.startWith;
		this._startTimeout = validatedOptions.startTimeout;
		this._endWith = validatedOptions.endWith;

		this._escapeWith = validatedOptions.escapeWith;
		this._escaped = validatedOptions.escaped;

		this._specifics = validatedOptions.specifics;
		this._controlBits = validatedOptions.controlBits;

		// dynamic digester
		this._digester = this._chooseDigester();

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

			protected _chooseDigester (): (enc?: BufferEncoding) => void {

				let digester: (() => void) | undefined = undefined;

					if (undefined === this._startWith && undefined === this._endWith) {
						digester = this._digestNoStartNoEnd;
					}
					else if (undefined !== this._startWith && undefined === this._endWith) {
						digester = this._digestStartOnly;
					}
					else if (undefined === this._startWith && undefined !== this._endWith) {
						digester = this._digestEndOnly;
					}
					else {
						digester = this._digestStartAndEnd;
					}

				return digester as (enc?: BufferEncoding) => void;

			}

			protected _digest (enc?: BufferEncoding): void {

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

		// private

			// digesters

				private _digestNoStartNoEnd (): void {

					const KEYS: Array<string> = Object.keys(this._specifics);

					if (KEYS.length) {

						KEYS.forEach((key: string): void => {

							const size: number = "object" === typeof this._specifics[key] && this._specifics[key] instanceof Buffer ? (this._specifics[key] as Buffer).length : 1;

							for (let foundAt: number = this._searchTags(this._specifics[key]); -1 < foundAt; foundAt = this._searchTags(this._specifics[key])) {

								this.emit(key);

								this._frame = Buffer.from(Buffer.concat([
									this._frame.slice(0, foundAt),
									this._frame.slice(foundAt + size, this._frame.length)
								]));

							}

						});

					}

					this.push(Buffer.from(this._frame));

					this._frame = Buffer.from([]);

					this._digesting = false;

				}

				private _digestStartOnly (enc?: BufferEncoding): void {

					if (this._timeoutDigest) {
						clearTimeout(this._timeoutDigest);
						this._timeoutDigest = null;
					}

					const firstStart: iSearchedBits | undefined = this._searchFirstStart();

					// no start tag detected
					if (!firstStart) {

						this._frame = Buffer.from([]);
						this._digesting = false;

					}

					// first start tag detected
					else {

						const nextStartAt: number = this._searchTags(this._startWith as tTag, firstStart.end);

						// second start tag not detected
						if (-1 >= nextStartAt) {

							// remove useless bits
							this._frame = 0 < firstStart.start ? Buffer.from(this._frame.slice(firstStart.start, this._frame.length)) : this._frame;
							this._digesting = false;

							this._timeoutDigest = setTimeout((): void => {

								clearTimeout(this._timeoutDigest as NodeJS.Timeout);
								this._timeoutDigest = null;

								this.push(Buffer.from(this._frame.slice(firstStart.start, this._frame.length)));

								this._frame = Buffer.from([]);
								this._digesting = false;

							}, this._startTimeout);

						}

						// second start tag detected
						else {

							// extract first frame
							this.push(Buffer.from(this._frame.slice(firstStart.start, nextStartAt)));

							// remove extracted frame from main one
							this._frame = Buffer.from(this._frame.slice(nextStartAt, this._frame.length));

							// second full frame detected (force minimal data length)
							if (-1 < this._searchTags(this._startWith as tTag, 1)) {
								this._digest(enc);
							}
							else {
								this._digesting = false;
							}

						}

					}

				}

				private _digestEndOnly (enc?: BufferEncoding): void {

					this._extractSpecifics();

					const firstEnd: iSearchedBits | undefined = this._searchFirstEnd();

					// no end tag detected
					if (!firstEnd) {
						this._digesting = false;
					}

					// first end tag detected
					else {

						// extract first frame
						this.push(Buffer.from(this._frame.slice(0, firstEnd.end)));

						// remove extracted frame from main one
						this._frame = Buffer.from(this._frame.slice(firstEnd.end, this._frame.length));

						// second full frame detected
						if (-1 < this._searchTags(this._endWith as tTag)) {
							this._digest(enc);
						}
						else {
							this._digesting = false;
						}

					}

				}

					private _extractSpecifics (): void {

						let found: boolean = false;

							Object.keys(this._specifics).forEach((key: string): void => {

								if (0 === this._frame.indexOf(this._specifics[key] as number)) {

									found = true;

									const size: number = "object" === typeof this._specifics[key] && this._specifics[key] instanceof Buffer ?
									(this._specifics[key] as Buffer).length : 1;

									this.emit(key);

									this._frame = Buffer.from(this._frame.slice(size, this._frame.length));

								}

							});

						if (found) {
							this._extractSpecifics();
						}

					}

				private _digestStartAndEnd (enc?: BufferEncoding): void {

					const KEYS: Array<string> = Object.keys(this._specifics);

					if (KEYS.length) {

						KEYS.forEach((key: string): void => {

							const firstStart: iSearchedBits | undefined = this._searchFirstStart();

							const size: number = "object" === typeof this._specifics[key] && this._specifics[key] instanceof Buffer ? (this._specifics[key] as Buffer).length : 1;

							for (
								let foundAt: number = this._searchTags(this._specifics[key]), i = 0;
								-1 < foundAt && (!firstStart || foundAt < firstStart.start - i);
								foundAt = this._searchTags(this._specifics[key]), i += size
							) {

								this.emit(key);

								this._frame = Buffer.from(Buffer.concat([
									this._frame.slice(0, foundAt),
									this._frame.slice(foundAt + size, this._frame.length)
								]));

							}

						});

					}

					const firstStart: iSearchedBits | undefined = this._searchFirstStart();

					// no start tag detected
					if (!firstStart) {

						this._frame = Buffer.from([]);
						this._digesting = false;

					}

					// start tag detected
					else {

						const firstEnd: iSearchedBits | undefined = this._searchFirstEnd();

						// end tag not detected
						if (!firstEnd) {

							// remove useless bits
							this._frame = 0 < firstStart.start ? Buffer.from(this._frame.slice(firstStart.start, this._frame.length)) : this._frame;
							this._digesting = false;

						}

						// end tag detected
						else {

							this.push(Buffer.from(this._frame.slice(firstStart.start, firstEnd.end)));

							// remove extracted frame from main one
							this._frame = Buffer.from(this._frame.slice(firstEnd.end, this._frame.length));

							// search specifics
							let foundSpecific: boolean = false;
							for (let i: number = 0; i < KEYS.length && !foundSpecific; ++i) {

								if (-1 < this._searchTags(this._specifics[KEYS[i]])) {
									foundSpecific = true; break;
								}

							}

							// specific detected or second start detected (force minimal data length)
							if (foundSpecific || -1 < this._searchTags(this._startWith as tTag, 1)) {
								this._digest(enc);
							}
							else {
								this._digesting = false;
							}

						}

					}

				}

			// search tag

				private _searchFirstTag (tag: tTag | undefined, beginAt: number = 0): iSearchedBits | undefined {

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
						return undefined;
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

					private _searchFirstNumberTag (tag: number, beginAt: number): iSearchedBits {

						const startAt: number = this._frame.indexOf(tag, beginAt);

						return {
							"start": startAt,
							"end": startAt + 1
						};

					}

					private _searchFirstBufferOrArrayTag (tag: Buffer | Array<Buffer | number>, beginAt: number): iSearchedBits {

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

				private _searchFirstStart (): iSearchedBits | undefined {
					return this._searchFirstTag(this._startWith);
				}

				private _searchFirstEnd (): iSearchedBits | undefined {

					const firstTag: iSearchedBits | undefined = this._searchFirstTag(this._endWith);

						if (firstTag) {

							if ("end+1" === this._controlBits) {
								firstTag.end += 1;
							}
							else if ("end+2" === this._controlBits) {
								firstTag.end += 2;
							}

							// end tag detected but without valid control bits length
							if (firstTag.end > this._frame.length) {
								return undefined;
							}

						}

					return firstTag;

				}

				private _searchTags (tags: tTag, beginAt: number = 0): number {

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

					private _searchNumberTags (tags: number, beginAt: number): number {

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

					private _searchBufferOrArrayTags (tags: Buffer | Array<Buffer | number>, beginAt: number): number {

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
