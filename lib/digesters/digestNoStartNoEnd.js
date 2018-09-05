/*
	eslint no-invalid-this: 0
*/

"use strict";

module.exports = function digestNoStartNoEnd () {

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

};
