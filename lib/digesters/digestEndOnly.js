/*
	eslint no-invalid-this: 0
*/

"use strict";

module.exports = function digestEndOnly () {

	const firstEndAt = this._searchTags(this._endWith);

	// no end tag detected
	if (-1 >= firstEndAt) {
		this._digesting = false;
	}

	// first end tag detected
	else {

		const endSize = "object" === typeof this._endWith && this._endWith instanceof Buffer ? this._endWith.length : 1;

		this.push(
			null !== this._escapeWith ?
				this._removeEscapeTag(this._frame.slice(0, firstEndAt)) :
				Buffer.from(this._frame.slice(0, firstEndAt))
		);

		this._frame = Buffer.from(this._frame.slice(firstEndAt + endSize, this._frame.length));

		const nextEndAt = this._searchTags(this._endWith, 1);

		// second full frame detected
		if (-1 < nextEndAt) {
			this._digest();
		}
		else {
			this._digesting = false;
		}

	}

};
