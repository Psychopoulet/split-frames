"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// deps
// natives
const node_stream_1 = require("node:stream");
// locals
const initData_1 = __importDefault(require("./checkers/initData"));
;
;
;
// module
class SplitFrames extends node_stream_1.Transform {
    // constructor
    constructor(options) {
        super();
        this._frame = Buffer.from([]);
        this._digesting = false;
        this._timeoutDigest = null;
        // from params
        const validatedOptions = (0, initData_1.default)(options);
        this._startWith = validatedOptions.startWith;
        this._startTimeout = validatedOptions.startTimeout;
        this._endWith = validatedOptions.endWith;
        this._escapeWith = validatedOptions.escapeWith;
        this._escaped = validatedOptions.escaped;
        this._specifics = validatedOptions.specifics;
        this._controlBits = validatedOptions.controlBits;
        // dynamic digester
        this._digester = this._chooseDigester();
    }
    // methods
    // public
    _transform(chunk, enc, cb) {
        if (chunk.length) {
            this._frame = Buffer.concat([this._frame, chunk]);
            if (!this._digesting) {
                this._digest(enc);
            }
        }
        return cb();
    }
    // protected
    _chooseDigester() {
        let digester = undefined;
        if (undefined === this._startWith && undefined === this._endWith) {
            digester = this._digestNoStartNoEnd;
        }
        else if (undefined !== this._startWith && undefined === this._endWith) {
            digester = this._digestStartOnly;
        }
        else if (undefined === this._startWith && undefined !== this._endWith) {
            digester = this._digestEndOnly;
        }
        else {
            digester = this._digestStartAndEnd;
        }
        return digester;
    }
    _digest(enc) {
        if (!this._frame.length) {
            this._digesting = false;
        }
        else {
            this._digesting = true;
            try {
                this._digester(enc);
            }
            catch (e) {
                this.emit("error", e);
            }
        }
    }
    // private
    // digesters
    _digestNoStartNoEnd() {
        const KEYS = Object.keys(this._specifics);
        if (KEYS.length) {
            KEYS.forEach((key) => {
                const size = "object" === typeof this._specifics[key] && this._specifics[key] instanceof Buffer ? this._specifics[key].length : 1;
                for (let foundAt = this._searchTags(this._specifics[key]); -1 < foundAt; foundAt = this._searchTags(this._specifics[key])) {
                    this.emit(key);
                    this._frame = Buffer.from(Buffer.concat([
                        this._frame.slice(0, foundAt),
                        this._frame.slice(foundAt + size, this._frame.length)
                    ]));
                }
            });
        }
        this.push(Buffer.from(this._frame));
        this._frame = Buffer.from([]);
        this._digesting = false;
    }
    _digestStartOnly(enc) {
        if (this._timeoutDigest) {
            clearTimeout(this._timeoutDigest);
            this._timeoutDigest = null;
        }
        const firstStart = this._searchFirstStart();
        // no start tag detected
        if (!firstStart) {
            this._frame = Buffer.from([]);
            this._digesting = false;
        }
        // first start tag detected
        else {
            const nextStartAt = this._searchTags(this._startWith, firstStart.end);
            // second start tag not detected
            if (-1 >= nextStartAt) {
                // remove useless bits
                this._frame = 0 < firstStart.start ? Buffer.from(this._frame.slice(firstStart.start, this._frame.length)) : this._frame;
                this._digesting = false;
                this._timeoutDigest = setTimeout(() => {
                    clearTimeout(this._timeoutDigest);
                    this._timeoutDigest = null;
                    this.push(Buffer.from(this._frame.slice(firstStart.start, this._frame.length)));
                    this._frame = Buffer.from([]);
                    this._digesting = false;
                }, this._startTimeout);
            }
            // second start tag detected
            else {
                // extract first frame
                this.push(Buffer.from(this._frame.slice(firstStart.start, nextStartAt)));
                // remove extracted frame from main one
                this._frame = Buffer.from(this._frame.slice(nextStartAt, this._frame.length));
                // second full frame detected (force minimal data length)
                if (-1 < this._searchTags(this._startWith, 1)) {
                    this._digest(enc);
                }
                else {
                    this._digesting = false;
                }
            }
        }
    }
    _digestEndOnly(enc) {
        this._extractSpecifics();
        const firstEnd = this._searchFirstEnd();
        // no end tag detected
        if (!firstEnd) {
            this._digesting = false;
        }
        // first end tag detected
        else {
            // extract first frame
            this.push(Buffer.from(this._frame.slice(0, firstEnd.end)));
            // remove extracted frame from main one
            this._frame = Buffer.from(this._frame.slice(firstEnd.end, this._frame.length));
            // second full frame detected
            if (-1 < this._searchTags(this._endWith)) {
                this._digest(enc);
            }
            else {
                this._digesting = false;
            }
        }
    }
    _extractSpecifics() {
        let found = false;
        Object.keys(this._specifics).forEach((key) => {
            if (0 === this._frame.indexOf(this._specifics[key])) {
                found = true;
                const size = "object" === typeof this._specifics[key] && this._specifics[key] instanceof Buffer ?
                    this._specifics[key].length : 1;
                this.emit(key);
                this._frame = Buffer.from(this._frame.slice(size, this._frame.length));
            }
        });
        if (found) {
            this._extractSpecifics();
        }
    }
    _digestStartAndEnd(enc) {
        const KEYS = Object.keys(this._specifics);
        if (KEYS.length) {
            KEYS.forEach((key) => {
                const firstStart = this._searchFirstStart();
                const size = "object" === typeof this._specifics[key] && this._specifics[key] instanceof Buffer ? this._specifics[key].length : 1;
                for (let foundAt = this._searchTags(this._specifics[key]), i = 0; -1 < foundAt && (!firstStart || foundAt < firstStart.start - i); foundAt = this._searchTags(this._specifics[key]), i += size) {
                    this.emit(key);
                    this._frame = Buffer.from(Buffer.concat([
                        this._frame.slice(0, foundAt),
                        this._frame.slice(foundAt + size, this._frame.length)
                    ]));
                }
            });
        }
        const firstStart = this._searchFirstStart();
        // no start tag detected
        if (!firstStart) {
            this._frame = Buffer.from([]);
            this._digesting = false;
        }
        // start tag detected
        else {
            const firstEnd = this._searchFirstEnd();
            // end tag not detected
            if (!firstEnd) {
                // remove useless bits
                this._frame = 0 < firstStart.start ? Buffer.from(this._frame.slice(firstStart.start, this._frame.length)) : this._frame;
                this._digesting = false;
            }
            // end tag detected
            else {
                this.push(Buffer.from(this._frame.slice(firstStart.start, firstEnd.end)));
                // remove extracted frame from main one
                this._frame = Buffer.from(this._frame.slice(firstEnd.end, this._frame.length));
                // search specifics
                let foundSpecific = false;
                for (let i = 0; i < KEYS.length && !foundSpecific; ++i) {
                    if (-1 < this._searchTags(this._specifics[KEYS[i]])) {
                        foundSpecific = true;
                        break;
                    }
                }
                // specific detected or second start detected (force minimal data length)
                if (foundSpecific || -1 < this._searchTags(this._startWith, 1)) {
                    this._digest(enc);
                }
                else {
                    this._digesting = false;
                }
            }
        }
    }
    // search tag
    _searchFirstTag(tag, beginAt = 0) {
        let startAt = -1;
        let endAt = -1;
        // number
        if ("number" === typeof tag) {
            const find = this._searchFirstNumberTag(tag, beginAt);
            startAt = find.start;
            endAt = find.end;
        }
        // Buffer | Array
        else if ("object" === typeof tag) {
            const find = this._searchFirstBufferOrArrayTag(tag, beginAt);
            startAt = find.start;
            endAt = find.end;
        }
        // not found
        if (-1 >= startAt || -1 >= endAt) {
            return undefined;
        }
        // escaped
        else if (0 < startAt &&
            // must be a number to be escaped
            1 === endAt - startAt &&
            this._escaped.includes(this._frame[startAt]) && this._frame[startAt - 1] === this._escapeWith) {
            // escaper not escaped
            if (!this._escaped.includes(this._escapeWith) || 1 >= startAt || this._frame[startAt - 2] !== this._escapeWith) {
                return this._searchFirstTag(tag, endAt + 1);
            }
            else {
                return {
                    "start": startAt,
                    "end": endAt
                };
            }
        }
        // not escaped
        else {
            return {
                "start": startAt,
                "end": endAt
            };
        }
    }
    _searchFirstNumberTag(tag, beginAt) {
        const startAt = this._frame.indexOf(tag, beginAt);
        return {
            "start": startAt,
            "end": startAt + 1
        };
    }
    _searchFirstBufferOrArrayTag(tag, beginAt) {
        let startAt = -1;
        let endAt = -1;
        // Buffer
        if (tag instanceof Buffer) {
            startAt = this._frame.indexOf(tag, beginAt);
            endAt = startAt + tag.length;
        }
        // Array
        else if (tag instanceof Array) {
            for (let i = 0; i < tag.length; ++i) {
                // number | Buffer
                if ("number" === typeof tag[i] ||
                    ("object" === typeof tag[i] && tag[i] instanceof Buffer)) {
                    const _startAt = this._frame.indexOf(tag[i], beginAt);
                    if (-1 < _startAt && (-1 >= startAt || _startAt < startAt)) {
                        startAt = _startAt;
                        endAt = startAt + ("number" === typeof tag[i] ? 1 : tag[i].length);
                    }
                }
            }
        }
        return {
            "start": startAt,
            "end": endAt
        };
    }
    _searchFirstStart() {
        return this._searchFirstTag(this._startWith);
    }
    _searchFirstEnd() {
        const firstTag = this._searchFirstTag(this._endWith);
        if (firstTag) {
            if ("end+1" === this._controlBits) {
                firstTag.end += 1;
            }
            else if ("end+2" === this._controlBits) {
                firstTag.end += 2;
            }
            // end tag detected but without valid control bits length
            if (firstTag.end > this._frame.length) {
                return undefined;
            }
        }
        return firstTag;
    }
    _searchTags(tags, beginAt = 0) {
        // number
        if ("number" === typeof tags) {
            return this._searchNumberTags(tags, beginAt);
        }
        // Buffer | Array
        else if ("object" === typeof tags) {
            return this._searchBufferOrArrayTags(tags, beginAt);
        }
        return -1;
    }
    _searchNumberTags(tags, beginAt) {
        const foundAt = this._frame.indexOf(tags, beginAt);
        // escaped
        if (0 < foundAt &&
            this._escaped.includes(this._frame[foundAt]) &&
            this._frame[foundAt - 1] === this._escapeWith) {
            // escaper not escaped
            if (!this._escaped.includes(this._escapeWith) || 1 >= foundAt || this._frame[foundAt - 2] !== this._escapeWith) {
                return this._searchTags(tags, foundAt + 1);
            }
        }
        return foundAt;
    }
    _searchBufferOrArrayTags(tags, beginAt) {
        // Buffer
        if (tags instanceof Buffer) {
            return this._frame.indexOf(tags, beginAt);
        }
        // Array
        else if (tags instanceof Array) {
            let foundAt = -1;
            let type = "undefined";
            for (let i = 0; i < tags.length; ++i) {
                // number | Buffer
                if ("number" === typeof tags[i] || ("object" === typeof tags[i] && tags[i] instanceof Buffer)) {
                    const _foundAt = this._frame.indexOf(tags[i], beginAt);
                    if (-1 < _foundAt && (-1 >= foundAt || _foundAt < foundAt)) {
                        foundAt = _foundAt;
                        type = typeof tags[i];
                    }
                }
            }
            // escaped
            if ("number" === type && 0 < foundAt &&
                this._escaped.includes(this._frame[foundAt]) &&
                this._frame[foundAt - 1] === this._escapeWith) {
                // escaper not escaped
                if (!this._escaped.includes(this._escapeWith) || 1 >= foundAt || this._frame[foundAt - 2] !== this._escapeWith) {
                    foundAt = this._searchTags(tags, foundAt + 1);
                }
            }
            return foundAt;
        }
        return -1;
    }
}
exports.default = SplitFrames;
;
