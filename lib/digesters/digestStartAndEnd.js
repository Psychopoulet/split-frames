/*
	eslint no-unmodified-loop-condition:0, no-invalid-this: 0
*/

"use strict";

module.exports = function digestStartAndEnd () {

	const KEYS = Object.keys(this._specifics);

	if (KEYS.length) {

		KEYS.forEach((key) => {

			const firstStartFoundAt = this._searchTags(this._startWith);

			const size = "object" === typeof this._specifics[key] && this._specifics[key] instanceof Buffer ? this._specifics[key].length : 1;

			for (
				let foundAt = this._searchTags(this._specifics[key]), i = 0;
				-1 < foundAt && (-1 >= firstStartFoundAt || foundAt < firstStartFoundAt - i);
				foundAt = this._searchTags(this._specifics[key]), i += size
			) {

				this.emit(key);

				this._frame = Buffer.from(Buffer.concat([
					this._frame.slice(0, foundAt),
					this._frame.slice(foundAt + size, this._frame.length)
				]));

			}

		});

	}

	const firstStartFoundAt = this._searchTags(this._startWith);

	// no start tag detected
	if (-1 >= firstStartFoundAt) {

		this._frame = Buffer.from([]);
		this._digesting = false;

	}

	// start tag detected
	else {

		const endAt = this._searchTags(this._endWith, firstStartFoundAt + 1);

		// end tag not detected
		if (-1 >= endAt) {

			// remove useless bits
			if (0 < firstStartFoundAt) {
				this._frame = Buffer.from(this._frame.slice(firstStartFoundAt, this._frame.length));
			}

			this._digesting = false;

		}

		// end tag detected
		else {

			const startSize = "object" === typeof this._startWith && this._startWith instanceof Buffer ? this._startWith.length : 1;
			const endSize = "object" === typeof this._endWith && this._endWith instanceof Buffer ? this._endWith.length : 1;

			this.push(Buffer.from(this._frame.slice(firstStartFoundAt + startSize, endAt)));

			this._frame = Buffer.from(this._frame.slice(endAt + endSize, this._frame.length));

			let foundSpecific = false;
			for (let i = 0; i < KEYS.length && !foundSpecific; ++i) {

				if (-1 < this._searchTags(this._specifics[KEYS[i]])) {
					foundSpecific = true; break;
				}

			}

			// start frame detected
			if (foundSpecific || -1 < this._searchTags(this._startWith)) {
				this._digest();
			}
			else {
				this._digesting = false;
			}

		}

	}

};
