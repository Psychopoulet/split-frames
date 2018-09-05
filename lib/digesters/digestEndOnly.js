/*
	eslint no-invalid-this: 0
*/

"use strict";

module.exports = function digestEndOnly () {

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
			this._digest();
		}
		else {
			this._digesting = false;
		}

	}

};
