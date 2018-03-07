"use strict";

module.exports = function digestNoStartNoEnd () {

	const KEYS = Object.keys(this.specifics);

	if (KEYS.length) {

		KEYS.forEach((key) => {

			const size = "object" === typeof this.specifics[key] && this.specifics[key] instanceof Buffer ? this.specifics[key].length : 1;

			for (let foundAt = this._searchTags(this.specifics[key]); -1 < foundAt; foundAt = this._searchTags(this.specifics[key])) {

				this.emit(key);

				this.frame = Buffer.from(Buffer.concat([
					this.frame.slice(0, foundAt),
					this.frame.slice(foundAt + size, this.frame.length)
				]));

			}

		});

	}

	this.push(
		null !== this.escapeWith ?
			this._removeEscapeTag(this.frame) :
			Buffer.from(this.frame)
	);

	this.frame = Buffer.from([]);

	this.digesting = false;

};
