/*
	eslint no-implicit-globals: 0, no-extra-parens: 0, complexity: [ "error", { "max": 25 } ]
*/

"use strict";

// deps

	const { join } = require("path");

	const _initData = require(join(__dirname, "checkers", "initData.js"));

	let _digestNoStartNoEnd = null;
	let _digestStartOnly = null;
	let _digestEndOnly = null;
	let _digestStartAndEnd = null;

// private

	// methods

		/**
		* Test tags compatibility
		* @param {number|Array} startWith : startWith tags
		* @param {number|Array} endWith : endWith tags
		* @returns {function} digester
		*/
		function _chooseDigester (startWith, endWith) {

			let digester = null;

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

			return digester;

		}

// module

module.exports = class SplitFrames extends require("stream").Transform {

	constructor (options) {

		super(options);

		const validatedOptions = _initData(options);

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

	_searchTags (tags, beginAt = 0) {

		// number
		if ("number" === typeof tags) {

			const foundAt = this._frame.indexOf(tags, beginAt);

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
				else {
					return foundAt;
				}

			}
			else {
				return foundAt;
			}

		}

		// Buffer | Array
		else if ("object" === typeof tags) {

			// Buffer
			if (tags instanceof Buffer) {
				return this._frame.indexOf(tags, beginAt);
			}

			// Array
			else if (tags instanceof Array) {

				let foundAt = -1;
				let type = "";

					for (let i = 0; i < tags.length; ++i) {

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
							foundAt = this._searchTags(tags, foundAt + 1);
						}

					}

				return foundAt;

			}

		}

		return -1;

	}

	_searchFirstTag (tag, beginAt = 0) {

		let startAt = -1;
		let endAt = -1;

			// number
			if ("number" === typeof tag) {

				startAt = this._frame.indexOf(tag, beginAt);
				endAt = startAt + 1;

			}

			// Buffer | Array
			else if ("object" === typeof tag) {

				// Buffer
				if (tag instanceof Buffer) {

					startAt = this._frame.indexOf(tag, beginAt);
					endAt = startAt + tag.length;

				}

				// Array
				else if (tag instanceof Array) {

					for (let i = 0; i < tag.length; ++i) {

						// number | Buffer
						if ("number" === typeof tag[i] ||
							("object" === typeof tag[i] && tag[i] instanceof Buffer)
						) {

							const _startAt = this._frame.indexOf(tag[i], beginAt);

							if (-1 < _startAt && (-1 >= startAt || _startAt < startAt)) {
								startAt = _startAt;
								endAt = startAt + ("number" === typeof tag[i] ? 1 : tag[i].length);
							}

						}

					}

				}

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

	_searchFirstStart () {
		return this._searchFirstTag(this._startWith);
	}

	_searchFirstEnd () {

		const firstTag = this._searchFirstTag(this._endWith);

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

	_digest () {

		if (!this._frame.length) {
			this._digesting = false;
		}
		else {

			this._digesting = true;

			try {
				this._digester();
			}
			catch (e) {
				this.emit("error", e);
			}

		}

	}

	_transform (chunk, enc, cb) {

		if (chunk.length) {

			this._frame = Buffer.concat([ this._frame, chunk ]);

			if (!this._digesting) {
				this._digest();
			}

		}

		cb();

	}

};
