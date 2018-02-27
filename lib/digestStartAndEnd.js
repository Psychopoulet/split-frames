/*
	eslint complexity: 0, no-extra-parens: 0, no-unmodified-loop-condition:0
*/

"use strict";

module.exports = function digestStartAndEnd () {

	if (null !== this.ack) {

		const firstStartFoundAt = this._searchTags(this.start);

		const size = "object" === typeof this.ack && this.ack instanceof Buffer ? this.ack.length : 1;

		for (
			let foundAt = this._searchTags(this.ack), i = 0;
			-1 < foundAt && (-1 >= firstStartFoundAt || foundAt < firstStartFoundAt - i);
			foundAt = this._searchTags(this.ack), i += size
		) {

			this.emit("ack");

			this.frame = Buffer.from(Buffer.concat([
				this.frame.slice(0, foundAt),
				this.frame.slice(foundAt + size, this.frame.length)
			]));

		}

	}

	if (null !== this.nak) {

		const firstStartFoundAt = this._searchTags(this.start);

		const size = "object" === typeof this.nak && this.nak instanceof Buffer ? this.nak.length : 1;

		for (
			let foundAt = this._searchTags(this.nak), i = 0;
			-1 < foundAt && (-1 >= firstStartFoundAt || foundAt < firstStartFoundAt - i);
			foundAt = this._searchTags(this.nak), i += size
		) {

			this.emit("nak");

			this.frame = Buffer.from(Buffer.concat([
				this.frame.slice(0, foundAt),
				this.frame.slice(foundAt + size, this.frame.length)
			]));

		}

	}

	if (null !== this.wak) {

		const firstStartFoundAt = this._searchTags(this.start);

		const size = "object" === typeof this.wak && this.wak instanceof Buffer ? this.wak.length : 1;

		for (
			let foundAt = this._searchTags(this.wak), i = 0;
			-1 < foundAt && (-1 >= firstStartFoundAt || foundAt < firstStartFoundAt - i);
			foundAt = this._searchTags(this.wak), i += size
		) {

			this.emit("wak");

			this.frame = Buffer.from(Buffer.concat([
				this.frame.slice(0, foundAt),
				this.frame.slice(foundAt + size, this.frame.length)
			]));

		}

	}

	const firstStartFoundAt = this._searchTags(this.start);

	// no start tag detected
	if (-1 >= firstStartFoundAt) {

		this.frame = Buffer.from([]);
		this.digesting = false;

	}

	// start tag detected
	else {

		const endAt = this._searchTags(this.end, firstStartFoundAt + 1);

		// end tag not detected
		if (-1 >= endAt) {

			// remove useless bits
			if (0 < firstStartFoundAt) {
				this.frame = Buffer.from(this.frame.slice(firstStartFoundAt, this.frame.length));
			}

			this.digesting = false;

		}

		// end tag detected
		else {

			const startSize = "object" === typeof this.start && this.start instanceof Buffer ? this.start.length : 1;
			const endSize = "object" === typeof this.end && this.end instanceof Buffer ? this.end.length : 1;

			this.push(
				null !== this.escapeWith ?
					this._removeEscapeTag(this.frame.slice(firstStartFoundAt + startSize, endAt)) :
					Buffer.from(this.frame.slice(firstStartFoundAt + startSize, endAt))
			);

			this.frame = Buffer.from(this.frame.slice(endAt + endSize, this.frame.length));

			// start frame detected
			if (
				(null !== this.ack && -1 < this._searchTags(this.ack)) ||
				(null !== this.nak && -1 < this._searchTags(this.nak)) ||
				(null !== this.wak && -1 < this._searchTags(this.wak)) ||
				-1 < this._searchTags(this.start)
			) {
				this._digest();
			}
			else {
				this.digesting = false;
			}

		}

	}

};
