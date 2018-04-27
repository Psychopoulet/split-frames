/*
	eslint no-extra-parens: 0, no-implicit-globals: 0
*/

"use strict";

// private

	// methods

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

module.exports = _searchEscapedTags;
