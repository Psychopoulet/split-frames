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
		this._endWith = validatedOptions.endWith;

		this._escapeWith = validatedOptions.escapeWith;
		this._escaped = validatedOptions.escaped;

		this._specifics = validatedOptions.specifics;

		this._frame = Buffer.from([]);
		this._digesting = false;

		this._controlBits = validatedOptions.controlBits;

		this._digester = _chooseDigester(this._startWith, this._endWith);

	}

	_searchTags (tags, beginAt = 0) {

		let foundAt = -1;

			// number | Buffer
			if ("number" === typeof tags || ("object" === typeof tags && tags instanceof Buffer)) {
				foundAt = this._frame.indexOf(tags, beginAt);
			}

			// Array
			else if ("object" === typeof tags && tags instanceof Array) {

				for (let i = 0; i < tags.length; ++i) {

					const _foundAt = this._frame.indexOf(tags[i], beginAt);

					if (-1 < _foundAt && (-1 >= foundAt || foundAt > _foundAt)) {
						foundAt = _foundAt;
					}

				}

			}
			else {
				return -1;
			}

			// escaped
			if (this._escaped.includes(this._frame[foundAt]) && 0 < foundAt && this._frame[foundAt - 1] === this._escapeWith) {

				// escaper not escaped
				if (!this._escaped.includes(this._escapeWith) || 1 >= foundAt || this._frame[foundAt - 2] !== this._escapeWith) {
					foundAt = this._searchTags(tags, foundAt + 1);
				}

			}

		return foundAt;

	}

	_searchFirstStart () {

		const startAt = this._searchTags(this._startWith);

		// no start tag detected
		if (-1 >= startAt) {
			return null;
		}
		else {

			const endAt = startAt + ("object" === typeof this._startWith && this._startWith instanceof Buffer ? this._startWith.length : 1);

			// start tag detected but without valid start bit length
			if (endAt > this._frame.length) {
				return null;
			}
			else {

				return {
					"start": startAt,
					"end": endAt
				};

			}

		}

	}

	_searchFirstEnd () {

		const startAt = this._searchTags(this._endWith);

		// no end tag detected
		if (-1 >= startAt) {
			return null;
		}
		else {

			let endAt = startAt + ("object" === typeof this._endWith && this._endWith instanceof Buffer ? this._endWith.length : 1);

			// end tag detected but without valid end bit length
			if (endAt > this._frame.length) {
				return null;
			}
			else {

				switch (this._controlBits) {

					case "end+1":
						endAt += 1;
					break;

					case "end+2":
						endAt += 2;
					break;

					default:
						endAt += 0;
					break;

				}

				// end tag detected but without valid control bits length
				if (endAt > this._frame.length) {
					return null;
				}
				else {

					return {
						"start": startAt,
						"end": endAt
					};

				}

			}

		}

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
