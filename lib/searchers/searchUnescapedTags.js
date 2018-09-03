/*
	eslint no-extra-parens: 0
*/

"use strict";

module.exports = (chunk, tags, beginAt = 0) => {

	// number|Buffer
	if ("number" === typeof tags || ("object" === typeof tags && tags instanceof Buffer)) {
		return chunk.indexOf(tags, beginAt);
	}

	// Array
	else if ("object" === typeof tags && tags instanceof Array) {

		let foundAt = -1;

			for (let i = 0; i < tags.length; ++i) {

				const _foundAt = chunk.indexOf(tags[i], beginAt);

				if (-1 < _foundAt && (-1 >= foundAt || foundAt > _foundAt)) {
					foundAt = _foundAt;
				}

			}

		return foundAt;

	}
	else {
		return -1;
	}

};
