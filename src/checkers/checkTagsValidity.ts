"use strict";

// types & interfaces

	// locals
	import { tTag } from "../SplitFrames.js";

// module

export default (tags: tTag): boolean => {

	let result: boolean = true;

		if ("number" !== typeof tags && "object" !== typeof tags) {
			result = false;
		}
		else if ("object" === typeof tags && tags instanceof Array) {

			for (let i: number = 0; i < tags.length; ++i) {

				if ("number" !== typeof tags[i] && "object" !== typeof tags[i] && !(tags[i] instanceof Buffer)) {
					result = false; break;
				}

			}

		}

	return result;

};
