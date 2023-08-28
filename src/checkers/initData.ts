"use strict";

// deps

	// locals
	import checkTagsValidity from "./checkTagsValidity";

// types & interfaces

	// locals
	import { iOptions, iConf, tControlBits, tTagObject } from "../SplitFrames.js";

// consts

	const ALLOWED_CONTROL_BITS_OPTIONS: Array<tControlBits> = [ "none", "end+1", "end+2" ];

// module

export default function initData (options?: iOptions): iConf {

	const result: iConf = {
		"startWith": undefined,
		"startTimeout": 200,
		"endWith": undefined,
		"escapeWith": undefined,
		"escaped": [],
		"specifics": {},
		"controlBits": "none"
	};

		if ("undefined" !== typeof options) {

			if ("object" !== typeof options) {
				throw new TypeError("parameter sended is not an object");
			}

			else if ("undefined" !== typeof options.startWith && !checkTagsValidity(options.startWith)) {
				throw new TypeError("startWith parameter sended is not a number, Buffer, or an Array of numbers");
			}
			else if ("undefined" !== typeof options.startTimeout && "number" !== typeof options.startTimeout) {
				throw new TypeError("startTimeout parameter sended is not a number");
			}
			else if ("undefined" !== typeof options.endWith && !checkTagsValidity(options.endWith)) {
				throw new TypeError("endWith parameter sended is not a number, Buffer, or an Array of numbers");
			}

			else if ("undefined" !== typeof options.escapeWith && "number" !== typeof options.escapeWith) {
				throw new TypeError("escapeWith parameter sended is not a number");
			}

			else if ("undefined" !== typeof options.specifics && "object" !== typeof options.specifics) {
				throw new TypeError("escapeWith parameter sended is not an object");
			}

			else if ("undefined" !== typeof options.controlBits && "string" !== typeof options.controlBits) {
				throw new TypeError("controlBits parameter sended is not a string");
			}

				else if ("undefined" !== typeof options.controlBits && !ALLOWED_CONTROL_BITS_OPTIONS.includes(options.controlBits)) {
					throw new Error("controlBits option sended is not in [ \"" + ALLOWED_CONTROL_BITS_OPTIONS.join("\", \"") + "\" ]");
				}

			else {

				result.startWith = "undefined" !== typeof options.startWith ? options.startWith : undefined;
				result.endWith = "undefined" !== typeof options.endWith ? options.endWith : undefined;

				if ("undefined" !== typeof options.startTimeout) {
					result.startTimeout = options.startTimeout;
				}

				result.escapeWith = "undefined" !== typeof options.escapeWith ? options.escapeWith : undefined;

				if ("undefined" !== typeof options.escaped) {
					result.escaped = options.escaped;
				}

				for (let i = 0; i < result.escaped.length; ++i) {

					if ("number" !== typeof result.escaped[i]) {
						throw new TypeError("escaped parameter n°" + i + " sended is not a number");
					}

				}

				if ("object" === typeof options.specifics) {

					const specifics: tTagObject = options.specifics;

					Object.keys(specifics).forEach((key: string): void => {

						if ("undefined" !== typeof specifics[key]) {

							if (!checkTagsValidity(specifics[key])) {

								throw new Error(
									"\"" + specifics[key] + "\" specifics option" +
									" sended is not a number, or an Array of numbers"
								);

							}
							else if (
								undefined !== specifics[key] &&
								undefined !== result.startWith && undefined === result.endWith
							) {

								throw new Error(
									"If you want to use \"" + specifics[key] + "\" specific option," +
									" you have to use \"endWith\" option"
								);

							}

						}

					});

				}

				result.specifics = "undefined" !== typeof options.specifics ? options.specifics : {};
				result.controlBits = "undefined" !== typeof options.controlBits ? options.controlBits : "none";

			}

		}

	return result;

};
