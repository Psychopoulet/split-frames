/*
	eslint complexity: [ "error", { "max": 30 } ]
*/

"use strict";

// deps

	const { join } = require("path");

	const _checkTagsValidity = require(join(__dirname, "checkTagsValidity.js"));
	const _checkTagsCompatibility = require(join(__dirname, "checkTagsCompatibility.js"));

// consts

	const ALLOWED_CONTROL_BITS_OPTIONS = [ "none", "end+1", "end+2" ];

// module

module.exports = (options) => {

	const result = {
		"startWith": null,
		"startTimeout": null,
		"endWith": null,
		"escapeWith": null,
		"escaped": [],
		"specifics": {},
		"controlBits": ""
	};

		if ("undefined" !== typeof options) {

			if ("object" !== typeof options) {
				throw new TypeError("parameter sended is not an object");
			}

			else if ("undefined" !== typeof options.startWith && !_checkTagsValidity(options.startWith)) {
				throw new TypeError("startWith parameter sended is not a number, Buffer, or an Array of numbers");
			}
			else if ("undefined" !== typeof options.startTimeout && "number" !== typeof options.startTimeout) {
				throw new TypeError("startTimeout parameter sended is not a number");
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

			else if ("undefined" !== typeof options.controlBits && "string" !== typeof options.controlBits) {
				throw new TypeError("controlBits parameter sended is not a string");
			}

				else if ("undefined" !== typeof options.controlBits && !ALLOWED_CONTROL_BITS_OPTIONS.includes(options.controlBits)) {
					throw new Error("controlBits option sended is not in [ \"" + ALLOWED_CONTROL_BITS_OPTIONS.join("\", \"") + "\" ]");
				}

			else {

				result.startWith = "undefined" !== typeof options.startWith ? options.startWith : null;
				result.startTimeout = "undefined" !== typeof options.startTimeout ? options.startTimeout : 200;
				result.endWith = "undefined" !== typeof options.endWith ? options.endWith : null;

				result.escapeWith = "undefined" !== typeof options.escapeWith ? options.escapeWith : null;
				result.escaped = "undefined" !== typeof options.escaped ? options.escaped : [];

				for (let i = 0; i < result.escaped.length; ++i) {

					if ("number" !== typeof result.escaped[i]) {
						throw new TypeError("escaped parameter n°" + i + " sended is not a number");
					}

				}

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
				result.controlBits = "undefined" !== typeof options.controlBits ? options.controlBits : "none";

			}

		}

	return result;

};
