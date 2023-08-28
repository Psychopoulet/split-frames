/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { Transform } from "node:stream";
export declare type tTagObject = {
    [key: string]: tTag;
};
export declare type tControlBits = "none" | "end+1" | "end+2";
export declare type tTag = number | Buffer | Array<number> | Array<Buffer>;
export interface iSearchedBits {
    "start": number;
    "end": number;
}
export interface iOptions {
    "startWith"?: tTag;
    "startTimeout"?: number;
    "endWith"?: tTag;
    "escapeWith"?: tTag;
    "escaped"?: Array<number>;
    "specifics"?: tTagObject;
    "controlBits"?: tControlBits;
}
export interface iConf extends iOptions {
    "escaped": Array<number>;
    "specifics": tTagObject;
    "controlBits": tControlBits;
}
export default class SplitFrames extends Transform {
    protected _frame: Buffer;
    protected _digesting: boolean;
    protected _timeoutDigest: NodeJS.Timeout | null;
    protected _startWith: iConf["startWith"];
    protected _startTimeout: iConf["startTimeout"];
    protected _endWith: iConf["endWith"];
    protected _escapeWith: iConf["escapeWith"];
    protected _escaped: iConf["escaped"];
    protected _specifics: iConf["specifics"];
    protected _controlBits: iConf["controlBits"];
    protected _digester: (enc?: BufferEncoding) => void;
    constructor(options?: iOptions);
    _transform(chunk: Buffer, enc: BufferEncoding, cb: (err?: Error | null, data?: any) => void): void;
    protected _chooseDigester(): (enc?: BufferEncoding) => void;
    protected _digest(enc?: BufferEncoding): void;
    private _digestNoStartNoEnd;
    private _digestStartOnly;
    private _digestEndOnly;
    private _extractSpecifics;
    private _digestStartAndEnd;
    private _searchFirstTag;
    private _searchFirstNumberTag;
    private _searchFirstBufferOrArrayTag;
    private _searchFirstStart;
    private _searchFirstEnd;
    private _searchTags;
    private _searchNumberTags;
    private _searchBufferOrArrayTags;
}
