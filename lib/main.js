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

// consts

	const ALLOWED_OPTIONS = [ "startWith", "endWith", "escapeWith", "escaped", "specifics" ];

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
		* @param {number|Buffer|Array} startWith : startWith tags
		* @param {number|Buffer|Array} endWith : endWith tags
		* @param {number|Buffer|Array} specificTag : specific tag
		* @returns {bool} Tags compatibility
		*/
		function _checkTagsCompatibility (startWith, endWith, specificTag) {

			return !(
				null !== specificTag &&
				((null !== startWith && null === endWith) || (null === startWith && null !== endWith))
			);

		}

		/**
		* Init options data for the constructor
		* @param {undefined|object} options : options
		* @returns {object} Initialized options data
		*/
		function _initData (options) {

			const result = {
				"startWith": null,
				"endWith": null,
				"escapeWith": null,
				"escaped": [],
				"specifics": {}
			};

				if ("undefined" !== typeof options) {

					if ("object" !== typeof options) {
						throw new TypeError("parameter sended is not an object");
					}
					else {

						Object.keys(options).forEach((key) => {

							if (!ALLOWED_OPTIONS.includes(key)) {
								throw new Error("\"" + key + "\" option sended is not in [" + ALLOWED_OPTIONS.join(", ") + "]");
							}

						});

						if ("undefined" !== typeof options.startWith && !_checkTagsValidity(options.startWith)) {
							throw new TypeError("startWith parameter sended is not a number, Buffer, or an Array of numbers");
						}
						else if ("undefined" !== typeof options.endWith && !_checkTagsValidity(options.endWith)) {
							throw new TypeError("endWith parameter sended is not a number, Buffer, or an Array of numbers");
						}

						else if ("undefined" !== typeof options.escapeWith && "number" !== typeof options.escapeWith) {
							throw new TypeError("escapeWith parameter sended is not a number");
						}

						else if ("undefined" !== typeof options.specifics && "object" !== typeof options.specifics) {
							throw new TypeError("escapeWith parameter sended is not an object");
						}

						else {

							result.startWith = "undefined" !== typeof options.startWith ? options.startWith : null;
							result.endWith = "undefined" !== typeof options.endWith ? options.endWith : null;

							result.escapeWith = "undefined" !== typeof options.escapeWith ? options.escapeWith : null;
							result.escaped = "undefined" !== typeof options.escaped ? options.escaped : [];

							if ("object" === typeof options.specifics) {

								Object.keys(options.specifics).forEach((key) => {

									if ("undefined" !== typeof options.specifics[key]) {

										if (!_checkTagsValidity(options.specifics[key])) {

											throw new Error(
												"\"" + options.specifics[key] + "\" specifics option" +
												" sended is not a number, or an Array of numbers"
											);

										}
										else if (!_checkTagsCompatibility(result.startWith, result.endWith, options.specifics[key])) {

											throw new Error(
												"if you want use \"" + options.specifics[key] + "\" specifics option" +
												", you have to use both \"startWith\" AND \"endWith\" tags (... or none)"
											);

										}

									}

								});

							}

							result.specifics = "undefined" !== typeof options.specifics ? options.specifics : {};

						}

					}

				}

			return result;

		}

		/**
		* Test tags compatibility
		* @param {number|Array} startWith : startWith tags
		* @param {number|Array} endWith : endWith tags
		* @returns {function} digester
		*/
		function _chooseDigester (startWith, endWith) {

			let digester = null;

				if (null === startWith && null === endWith) {
					digester = digestNoStartNoEnd;
				}
				else if (null !== startWith && null === endWith) {
					digester = digestStartOnly;
				}
				else if (null === startWith && null !== endWith) {
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
		* @param {number} beginAt : search tag position
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
		* @param {number} beginAt : search tag position
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

		this.startWith = validatedOptions.startWith;
		this.endWith = validatedOptions.endWith;

		this.escapeWith = validatedOptions.escapeWith;
		this.escaped = validatedOptions.escaped;

		this.specifics = validatedOptions.specifics;

		this.frame = Buffer.from([]);
		this.digesting = false;

		this.digester = _chooseDigester(this.startWith, this.endWith);

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
