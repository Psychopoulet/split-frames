"use strict";

module.exports = function digestNoStartNoEnd () {

	if (null !== this.ack) {

		const size = "object" === typeof this.ack && this.ack instanceof Buffer ? this.ack.length : 1;

		for (let foundAt = this._searchTags(this.ack); -1 < foundAt; foundAt = this._searchTags(this.ack)) {

			this.emit("ack");

			this.frame = Buffer.from(Buffer.concat([
				this.frame.slice(0, foundAt),
				this.frame.slice(foundAt + size, this.frame.length)
			]));

		}

	}

	if (null !== this.nak) {

		const size = "object" === typeof this.nak && this.nak instanceof Buffer ? this.nak.length : 1;

		for (let foundAt = this._searchTags(this.nak); -1 < foundAt; foundAt = this._searchTags(this.nak)) {

			this.emit("nak");

			this.frame = Buffer.from(Buffer.concat([
				this.frame.slice(0, foundAt),
				this.frame.slice(foundAt + size, this.frame.length)
			]));

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
