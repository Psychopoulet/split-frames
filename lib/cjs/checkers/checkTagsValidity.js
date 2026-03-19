"use strict";
// types & interfaces
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = checkTagsValidity;
// module
function checkTagsValidity(tags) {
    let result = true;
    if ("number" !== typeof tags && "object" !== typeof tags) {
        result = false;
    }
    else if ("object" === typeof tags && tags instanceof Array) {
        for (const tag of tags) {
            if ("number" !== typeof tag) {
                if ("object" !== typeof tag || !(tag instanceof Buffer)) {
                    result = false;
                    break;
                }
            }
        }
    }
    return result;
}
