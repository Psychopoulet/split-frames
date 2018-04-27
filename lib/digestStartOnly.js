/*
	eslint no-invalid-this: 0
*/

"use strict";

module.exports = function digestStartOnly () {

	const firstStartAt = this._searchTags(this._startWith);

	// no start tag detected
	if (-1 >= firstStartAt) {

		this._frame = Buffer.from([]);
		this._digesting = false;

	}

	// first start tag detected
	else {

		let nextStartAt = this._searchTags(this._startWith, firstStartAt + 1);

		// second start tag not detected
		if (-1 >= nextStartAt) {

			// remove useless bits
			this._frame = 0 < firstStartAt ? Buffer.from(this._frame.slice(firstStartAt, this._frame.length)) : this._frame;

			this._digesting = false;

		}

		// second start tag detected
		else {

			const startSize = "object" === typeof this._startWith && this._startWith instanceof Buffer ? this._startWith.length : 1;

			this.emit("fullFrame", null !== this._escapeWith ?
				this._removeEscapeTag(this._frame.slice(firstStartAt, nextStartAt)) :
				Buffer.from(this._frame.slice(firstStartAt, nextStartAt))
			);

			this.push(
				null !== this._escapeWith ?
					this._removeEscapeTag(this._frame.slice(firstStartAt + startSize, nextStartAt)) :
					Buffer.from(this._frame.slice(firstStartAt + startSize, nextStartAt))
			);

			this._frame = Buffer.from(this._frame.slice(nextStartAt, this._frame.length));

			nextStartAt = this._searchTags(this._startWith, 1);

			// second full frame detected
			if (-1 < nextStartAt) {
				this._digest();
			}
			else {
				this._digesting = false;
			}

		}

	}

};
