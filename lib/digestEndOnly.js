"use strict";

module.exports = function digestEndOnly () {

	const firstEndAt = this._searchTags(this.endWith);

	// no end tag detected
	if (-1 >= firstEndAt) {
		this.digesting = false;
	}

	// first end tag detected
	else {

		const endSize = "object" === typeof this.endWith && this.endWith instanceof Buffer ? this.endWith.length : 1;

		this.emit("fullFrame", null !== this.escapeWith ?
			this._removeEscapeTag(this.frame.slice(0, firstEndAt + endSize)) :
			Buffer.from(this.frame.slice(0, firstEndAt + endSize))
		);

		this.push(
			null !== this.escapeWith ?
				this._removeEscapeTag(this.frame.slice(0, firstEndAt)) :
				Buffer.from(this.frame.slice(0, firstEndAt))
		);

		this.frame = Buffer.from(this.frame.slice(firstEndAt + endSize, this.frame.length));

		const nextEndAt = this._searchTags(this.endWith, 1);

		// second full frame detected
		if (-1 < nextEndAt) {
			this._digest();
		}
		else {
			this.digesting = false;
		}

	}

};
