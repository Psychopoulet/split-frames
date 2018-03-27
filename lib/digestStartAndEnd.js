/*
	eslint complexity: 0, no-extra-parens: 0, no-unmodified-loop-condition:0
*/

"use strict";

module.exports = function digestStartAndEnd () {

	const KEYS = Object.keys(this.specifics);

	if (KEYS.length) {

		KEYS.forEach((key) => {

			const firstStartFoundAt = this._searchTags(this.startWith);

			const size = "object" === typeof this.specifics[key] && this.specifics[key] instanceof Buffer ? this.specifics[key].length : 1;

			for (
				let foundAt = this._searchTags(this.specifics[key]), i = 0;
				-1 < foundAt && (-1 >= firstStartFoundAt || foundAt < firstStartFoundAt - i);
				foundAt = this._searchTags(this.specifics[key]), i += size
			) {

				this.emit(key);

				this.frame = Buffer.from(Buffer.concat([
					this.frame.slice(0, foundAt),
					this.frame.slice(foundAt + size, this.frame.length)
				]));

			}

		});

	}

	const firstStartFoundAt = this._searchTags(this.startWith);

	// no start tag detected
	if (-1 >= firstStartFoundAt) {

		this.frame = Buffer.from([]);
		this.digesting = false;

	}

	// start tag detected
	else {

		const endAt = this._searchTags(this.endWith, firstStartFoundAt + 1);

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

			const startSize = "object" === typeof this.startWith && this.startWith instanceof Buffer ? this.startWith.length : 1;
			const endSize = "object" === typeof this.endWith && this.endWith instanceof Buffer ? this.endWith.length : 1;

			this.push(
				null !== this.escapeWith ?
					this._removeEscapeTag(this.frame.slice(firstStartFoundAt + startSize, endAt)) :
					Buffer.from(this.frame.slice(firstStartFoundAt + startSize, endAt))
			);

			this.frame = Buffer.from(this.frame.slice(endAt + endSize, this.frame.length));

			let foundSpecific = false;
			for (let i = 0; i < KEYS.length && !foundSpecific; ++i) {

				if (-1 < this._searchTags(this.specifics[KEYS[i]])) {
					foundSpecific = true; break;
				}

			}

			// start frame detected
			if (foundSpecific || -1 < this._searchTags(this.startWith)) {
				this._digest();
			}
			else {
				this.digesting = false;
			}

		}

	}

};
