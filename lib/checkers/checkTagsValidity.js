"use strict";

module.exports = (tags) => {

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

};
