// types & interfaces

    // locals
    import type { tTag } from "../SplitFrames.js";

// module

export default function checkTagsValidity (tags: tTag): boolean {

    let result: boolean = true;

        if ("number" !== typeof tags && "object" !== typeof tags) {
            result = false;
        }
        else if ("object" === typeof tags && tags instanceof Array) {

            for (const tag of tags) {

                if ("number" !== typeof tag) {

                    if ("object" !== typeof tag || !(tag instanceof Buffer)) {
                        result = false; break;
                    }

                }

            }

        }

    return result;

}
