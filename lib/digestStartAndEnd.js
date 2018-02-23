"use strict";

module.exports = function digestStartAndEnd () {

	(0, console).log("digestStartAndEnd", this.start, this.end, this.frame);

	const startAt = this._searchTags(this.start);

	// no start tag detected
	if (-1 >= startAt) {

		this.frame = Buffer.from([]);
		this.digesting = false;

	}

	// start tag detected
	else {

		const endAt = this._searchTags(this.end, startAt + 1);

		// end tag not detected
		if (-1 >= endAt) {

			// remove useless bits
			if (0 < startAt) {
				this.frame = Buffer.from(this.frame.slice(startAt, this.frame.length));
			}

			this.digesting = false;

		}

		// end tag detected
		else {

			const startSize = "object" === typeof this.start && this.start instanceof Buffer ? this.start.length : 1;
			const endSize = "object" === typeof this.end && this.end instanceof Buffer ? this.end.length : 1;

			this.push(
				null !== this.escapeWith ?
					this._removeEscapeTag(this.frame.slice(startAt + startSize, endAt)) :
					Buffer.from(this.frame.slice(startAt + startSize, endAt))
			);

			this.frame = Buffer.from(this.frame.slice(endAt + endSize, this.frame.length));

			const nextStartAt = this._searchTags(this.end, 1);

			// start frame detected
			if (-1 < nextStartAt) {
				this._digest();
			}
			else {
				this.digesting = false;
			}

		}

		}

};
