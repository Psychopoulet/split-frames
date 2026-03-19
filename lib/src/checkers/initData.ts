// deps

    // locals
    import checkTagsValidity from "./checkTagsValidity";

// types & interfaces

    // locals
    import type { iOptions, iConf, tControlBits, tTagObject } from "../SplitFrames.js";

// consts

    const ALLOWED_CONTROL_BITS_OPTIONS: tControlBits[] = [
        "none",
        "end+1",
        "end+2"
    ];

// module

export default function initData (options?: iOptions): iConf {

    if ("undefined" === typeof options) {

        return {
            "startTimeout": 200,
            "escaped": [],
            "specifics": {},
            "controlBits": "none"
        };

    }

    if ("object" !== typeof options) {
        throw new TypeError("parameter is not an object");
    }

        else if ("undefined" !== typeof options.startWith && !checkTagsValidity(options.startWith)) {
            throw new TypeError("startWith parameter is not a number, Buffer, or an Array of numbers");
        }
        else if ("undefined" !== typeof options.startTimeout && "number" !== typeof options.startTimeout) {
            throw new TypeError("startTimeout parameter is not a number");
        }
        else if ("undefined" !== typeof options.endWith && !checkTagsValidity(options.endWith)) {
            throw new TypeError("endWith parameter is not a number, Buffer, or an Array of numbers");
        }

        else if ("undefined" !== typeof options.escapeWith && "number" !== typeof options.escapeWith) {
            throw new TypeError("escapeWith parameter is not a number");
        }

        else if ("undefined" !== typeof options.escaped) {

            if (!checkTagsValidity(options.escaped)) {
                throw new TypeError("escaped parameter is not a number, Buffer, or an Array of numbers");
            }

            if (Array.isArray(options.escaped)) {

                for (let i = 0; i < options.escaped.length; ++i) {

                    if ("number" !== typeof options.escaped[i]) {
                        throw new TypeError("escaped parameter n°" + i + " is not a number");
                    }

                }

            }

        }

        else if ("undefined" !== typeof options.specifics && "object" !== typeof options.specifics) {
            throw new TypeError("specifics parameter is not an object");
        }

        else if ("undefined" !== typeof options.controlBits && "string" !== typeof options.controlBits) {
            throw new TypeError("controlBits parameter is not a string");
        }

            else if ("undefined" !== typeof options.controlBits && !ALLOWED_CONTROL_BITS_OPTIONS.includes(options.controlBits)) {
                throw new Error("controlBits option is not in [ \"" + ALLOWED_CONTROL_BITS_OPTIONS.join("\", \"") + "\" ]");
            }

    const result: iConf = {
        "startTimeout": options.startTimeout ?? 200,
        "escaped": options.escaped ?? [],
        "specifics": options.specifics ?? {},
        "controlBits": options.controlBits ?? "none"
    };

        if ("undefined" !== typeof options.startWith) {
            result.startWith = options.startWith;
        }

        if ("undefined" !== typeof options.endWith) {
            result.endWith = options.endWith;
        }

        if ("undefined" !== typeof options.escapeWith) {
            result.escapeWith = options.escapeWith;
        }

        if ("object" === typeof options.specifics) {

            const specifics: tTagObject = options.specifics;

            Object.keys(specifics).forEach((key: string): void => {

                if ("undefined" !== typeof specifics[key]) {

                    if (!checkTagsValidity(specifics[key])) {

                        throw new Error(
                            "\"" + String(specifics[key]) + "\" specifics option"
                            + " is not a number, or an Array of numbers"
                        );

                    }
                    else if ("undefined" !== typeof result.startWith
                        && "undefined" === typeof result.endWith
                    ) {

                        throw new Error(
                            "If you want to use \"" + String(specifics[key]) + "\" specific option,"
                            + " you have to use \"endWith\" option"
                        );

                    }

                }

            });

        }

    return result;

}
