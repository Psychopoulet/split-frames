"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// module
exports.default = (tags) => {
    let result = true;
    if ("number" !== typeof tags && "object" !== typeof tags) {
        result = false;
    }
    else if ("object" === typeof tags && tags instanceof Array) {
        for (let i = 0; i < tags.length; ++i) {
            if ("number" !== typeof tags[i] && "object" !== typeof tags[i] && !(tags[i] instanceof Buffer)) {
                result = false;
                break;
            }
        }
    }
    return result;
};
