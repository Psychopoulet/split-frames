"use strict";

module.exports = function digestEndOnly () {

	const firstEndAt = this._searchTags(this.end);

	// no end tag detected
	if (-1 >= firstEndAt) {
		this.digesting = false;
	}

	// first end tag detected
	else {

		const endSize = "object" === typeof this.end && this.end instanceof Buffer ? this.end.length : 1;

		this.push(
			null !== this.escapeWith ?
				this._removeEscapeTag(this.frame.slice(0, firstEndAt)) :
				Buffer.from(this.frame.slice(0, firstEndAt))
		);

		this.frame = Buffer.from(this.frame.slice(firstEndAt + endSize, this.frame.length));

		const nextEndAt = this._searchTags(this.end, 1);

		// second full frame detected
		if (-1 < nextEndAt) {
			this._digest();
		}
		else {
			this.digesting = false;
		}

	}

};
