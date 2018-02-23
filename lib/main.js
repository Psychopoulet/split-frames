/*
	eslint no-implicit-globals: 0, no-extra-parens: 0, complexity: [ "error", { "max": 25 } ]
*/

"use strict";

// deps

	const { join } = require("path");

	const digestNoStartNoEnd = require(join(__dirname, "digestNoStartNoEnd.js"));
	const digestStartOnly = require(join(__dirname, "digestStartOnly.js"));
	const digestEndOnly = require(join(__dirname, "digestEndOnly.js"));
	const digestStartAndEnd = require(join(__dirname, "digestStartAndEnd.js"));

// private

	// methods

		/**
		* Test tags validity
		* @param {number|Array} tags : tags checked
		* @returns {bool} Tags validity
		*/
		function _checkTagsValidity (tags) {

			let result = true;

				if (
					"number" !== typeof tags && "object" !== typeof tags && !(tags instanceof Array || tags instanceof Buffer)
				) {
					result = false;
				}
				else if ("object" === typeof tags && tags instanceof Array) {

					for (let i = 0; i < tags.length; ++i) {

						if ("number" !== typeof tags[i]) {
							result = false; break;
						}

					}

				}

			return result;

		}

		/**
		* Test tags compatibility
		* @param {number|Array} start : start tags
		* @param {number|Array} end : end tags
		* @param {number|Array} ack : ack tags
		* @param {number|Array} nak : nak tags
		* @returns {bool} Tags compatibility
		*/
		function _checkTagsCompatibility (start, end, ack, nak) {

			let result = true;

				if (
					((null !== start && null === end) || (null === start && null !== end)) &&
					(null !== ack || null !== nak)
				) {
					result = false;
				}

			return result;

		}

		/**
		* Init options data for the constructor
		* @param {undefined|object} options : options
		* @returns {object} Initialized options data
		*/
		function _initData (options) {

			const result = {
				"start": null,
				"end": null,
				"ack": null,
				"nak": null,
				"escapeWith": null,
				"escaped": []
			};

				if ("undefined" !== typeof options) {

					if ("object" !== typeof options) {
						throw new Error("parameter sended is not an object");
					}

					else if ("undefined" !== typeof options.start && !_checkTagsValidity(options.start)) {
						throw new Error("start parameter sended is not a number, or an Array of numbers");
					}

					else if ("undefined" !== typeof options.end && !_checkTagsValidity(options.end)) {
						throw new Error("end parameter sended is not a number, or an Array of numbers");
					}
					else if ("undefined" !== typeof options.ack && !_checkTagsValidity(options.ack)) {
						throw new Error("ack parameter sended is not a number, or an Array of numbers");
					}

					else if ("undefined" !== typeof options.nak && !_checkTagsValidity(options.nak)) {
						throw new Error("nak parameter sended is not a number, or an Array of numbers");
					}
					else if ("undefined" !== typeof options.escapeWith && "number" !== typeof options.escapeWith) {
						throw new Error("escapeWith parameter sended is not a number");
					}

					else {

						result.start = "undefined" !== typeof options.start ? options.start : null;
						result.end = "undefined" !== typeof options.end ? options.end : null;
						result.ack = "undefined" !== typeof options.ack ? options.ack : null;
						result.nak = "undefined" !== typeof options.nak ? options.nak : null;

						result.escapeWith = "undefined" !== typeof options.escapeWith ? options.escapeWith : null;
						result.escaped = "undefined" !== typeof options.escaped ? options.escaped : [];

					}

				}

				if (!_checkTagsCompatibility(result.start, result.end, result.ack, result.nak)) {
					throw new Error("if you want use \"ack\" or \"nak\" tags, you have to use both \"start\" AND \"end\" tags (... or none)");
				}

			return result;

		}

		/**
		* Test tags compatibility
		* @param {number|Array} start : start tags
		* @param {number|Array} end : end tags
		* @returns {function} digester
		*/
		function _chooseDigester (start, end) {

			let digester = null;

				if (null === start && null === end) {
					digester = digestNoStartNoEnd;
				}
				else if (null !== start && null === end) {
					digester = digestStartOnly;
				}
				else if (null === start && null !== end) {
					digester = digestEndOnly;
				}
				else {
					digester = digestStartAndEnd;
				}

			return digester;

		}

		/**
		* Test tags validity
		* @param {Buffer} chunk : frame where to search the tags
		* @param {number|Array} tags : tags checked
		* @param {number} beginAt : search start position
		* @returns {integer} First tag position
		*/
		function _searchUnescapedTags (chunk, tags, beginAt = 0) {

			let foundAt = -1;

				// number|Buffer
				if ("number" === typeof tags || ("object" === typeof tags && tags instanceof Buffer)) {
					foundAt = chunk.indexOf(tags, beginAt);
				}

				// Array
				else if ("object" === typeof tags && tags instanceof Array) {

					for (let i = 0; i < tags.length; ++i) {

						const _foundAt = chunk.indexOf(tags[i], beginAt);

						if (-1 < _foundAt && (-1 >= foundAt || foundAt > _foundAt)) {
							foundAt = _foundAt;
						}

					}

				}

			return foundAt;

		}

		/**
		* Test tags validity
		* @param {Buffer} chunk : frame where to search the tags
		* @param {number|Array} tags : tags checked
		* @param {number} escapeWith : escape bit
		* @param {number} beginAt : search start position
		* @returns {integer} First tag position
		*/
		function _searchEscapedTags (chunk, tags, escapeWith, beginAt = 0) {

			let foundAt = -1;

				if ("number" === typeof tags || ("object" === typeof tags && tags instanceof Buffer)) {
					foundAt = chunk.indexOf(tags, beginAt);
				}
				else {

					for (let i = 0; i < tags.length; ++i) {

						const _foundAt = chunk.indexOf(tags[i], beginAt);

						if (-1 < _foundAt && (-1 >= foundAt || foundAt > _foundAt)) {
							foundAt = _foundAt;
						}

					}

				}

				// escaped
				if (0 < foundAt && chunk[foundAt - 1] === escapeWith) {
					foundAt = _searchEscapedTags(chunk, tags, escapeWith, foundAt + 1);
				}

			return foundAt;

		}

// module

module.exports = class SplitFrames extends require("stream").Transform {

	constructor (options) {

		super(options);

		const validatedOptions = _initData(options);

		this.start = validatedOptions.start;
		this.end = validatedOptions.end;

		this.ack = validatedOptions.ack;
		this.nak = validatedOptions.nak;

		this.escapeWith = validatedOptions.escapeWith;
		this.escaped = validatedOptions.escaped;

		this.frame = Buffer.from([]);
		this.digesting = false;

		this.digester = _chooseDigester(this.start, this.end);

	}

	_searchTags (tag, beginAt = 0) {

		// if not concerned by escape
		if (
			null === this.escapeWith ||
			("number" === typeof tag && !this.escaped.includes(tag)) ||
			("object" === typeof tag && tag instanceof Array && !tag.filter((_tag) => {
				return this.escaped.includes(_tag);
			}).length)
		) {

			return _searchUnescapedTags(this.frame, tag, beginAt);

		}

		// if concerned by escape
		else {

			return _searchEscapedTags(this.frame, tag, this.escapeWith, beginAt);

		}

	}

	_removeEscapeTag (msg) {

		const content = [];

			for (let i = 0; i < msg.length; ++i) {

				// end of message or not escaper
				if (i === msg.length - 1 || this.escapeWith !== msg[i]) {
					content.push(msg[i]);
				}

				// escaper with escaped character
				else if (this.escaped.includes(msg[i + 1])) {
					content.push(msg[i + 1]); ++i;
				}

				// escaper without escaped character
				else {
					content.push(msg[i]);
				}

			}

		return Buffer.from(content);

	}

	_digestAcknowledgement () {

		if (null !== this.ack) {

			const firstAckAt = this._searchTags(this.ack);

			// first ack tag detected
			if (-1 < firstAckAt) {

				const ackSize = "object" === typeof this.ack && this.ack instanceof Buffer ? this.ack.length : 1;

				this.emit("ack");

				this.frame = Buffer.from(Buffer.concat([
					this.frame.slice(0, firstAckAt),
					this.frame.slice(firstAckAt + ackSize, this.frame.length)
				]));

			}

		}

		if (null !== this.nak) {

			const firstNakAt = this._searchTags(this.nak);

			// first nak tag detected
			if (-1 < firstNakAt) {

				const nakSize = "object" === typeof this.nak && this.nak instanceof Buffer ? this.nak.length : 1;

				this.emit("nak");

				this.frame = Buffer.from(Buffer.concat([
					this.frame.slice(0, firstNakAt),
					this.frame.slice(firstNakAt + nakSize, this.frame.length)
				]));

			}

		}

	}

	_digest () {

		if (!this.frame.length) {
			this.digesting = false;
		}
		else {

			this.digesting = true;

			try {
				this.digester();
			}
			catch (e) {
				this.emit("error", e);
			}

		}

	}

	_transform (chunk, enc, cb) {

		this.frame = chunk.length ? Buffer.concat([ this.frame, chunk ]) : this.frame;

		if (!this.digesting) {
			this._digest();
		}

		cb();

	}

};
