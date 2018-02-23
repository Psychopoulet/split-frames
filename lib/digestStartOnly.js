"use strict";

module.exports = function digestStartOnly () {

	const firstStartAt = this._searchTags(this.start);

	// no start tag detected
	if (-1 >= firstStartAt) {

		this.frame = Buffer.from([]);
		this.digesting = false;

	}

	// first start tag detected
	else {

		let nextStartAt = this._searchTags(this.start, firstStartAt + 1);

		// second start tag not detected
		if (-1 >= nextStartAt) {

			// remove useless bits
			if (0 < firstStartAt) {
				this.frame = Buffer.from(this.frame.slice(firstStartAt, this.frame.length));
			}

			this.digesting = false;

		}

		// second start tag detected
		else {

			const startSize = "object" === typeof this.start && this.start instanceof Buffer ? this.start.length : 1;

			this.push(
				null !== this.escapeWith ?
					this._removeEscapeTag(this.frame.slice(firstStartAt + startSize, nextStartAt)) :
					Buffer.from(this.frame.slice(firstStartAt + startSize, nextStartAt))
			);

			this.frame = Buffer.from(this.frame.slice(nextStartAt, this.frame.length));

			nextStartAt = this._searchTags(this.start, 1);

			// second full frame detected
			if (-1 < nextStartAt) {
				this._digest();
			}
			else {
				this.digesting = false;
			}

		}

	}

};
