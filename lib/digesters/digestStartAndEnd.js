/*
	eslint no-unmodified-loop-condition:0, no-invalid-this: 0
*/

"use strict";

module.exports = function digestStartAndEnd () {

	const KEYS = Object.keys(this._specifics);

	if (KEYS.length) {

		KEYS.forEach((key) => {

			const firstStart = this._searchFirstStart();

			const size = "object" === typeof this._specifics[key] && this._specifics[key] instanceof Buffer ? this._specifics[key].length : 1;

			for (
				let foundAt = this._searchTags(this._specifics[key]), i = 0;
				-1 < foundAt && (!firstStart || foundAt < firstStart.start - i);
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

	const firstStart = this._searchFirstStart();

	// no start tag detected
	if (!firstStart) {

		this._frame = Buffer.from([]);
		this._digesting = false;

	}

	// start tag detected
	else {

		const firstEnd = this._searchFirstEnd();

		// end tag not detected
		if (!firstEnd) {

			// remove useless bits
			if (0 < firstStart.start) {
				this._frame = Buffer.from(this._frame.slice(firstStart.start, this._frame.length));
			}

			this._digesting = false;

		}

		// end tag detected
		else {

			this.push(Buffer.from(this._frame.slice(firstStart.start, firstEnd.end)));

			// remove extracted frame from main one
			this._frame = Buffer.from(this._frame.slice(firstEnd.end, this._frame.length));

			// search specifics
			let foundSpecific = false;
			for (let i = 0; i < KEYS.length && !foundSpecific; ++i) {

				if (-1 < this._searchTags(this._specifics[KEYS[i]])) {
					foundSpecific = true; break;
				}

			}

			// specific detected or second start detected (force minimal data length)
			if (foundSpecific || -1 < this._searchTags(this._startWith, 1)) {
				this._digest();
			}
			else {
				this._digesting = false;
			}

		}

	}

};
