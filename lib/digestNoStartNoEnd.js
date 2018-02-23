"use strict";

module.exports = function digestNoStartNoEnd () {

	if (null !== this.ack || null !== this.nak) {

		let tags = [];

		if (null !== this.ack) {

			if ("number" === typeof this.ack) {
				tags.push(this.ack);
			}
			else {
				tags = tags.concat(this.ack);
			}

		}

		if (null !== this.nak) {

			if ("number" === typeof this.nak) {
				tags.push(this.nak);
			}
			else {
				tags = tags.concat(this.nak);
			}

		}

		while (-1 < this._searchTags(tags)) {
			this._digestAcknowledgement(null !== this.escapeWith);
		}

	}

	this.push(
		null !== this.escapeWith ?
			this._removeEscapeTag(this.frame) :
			Buffer.from(this.frame)
	);

	this.frame = Buffer.from([]);

	this.digesting = false;

};
