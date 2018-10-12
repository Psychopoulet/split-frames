/*
	eslint no-invalid-this: 0, no-implicit-globals: 0
*/

"use strict";

// private

	// method

		/**
		* Extract specific tags
		* @param {SplitFrames} self : pointer
		* @returns {void}
		*/
		function _extractSpecifics (self) {

			let found = false;

				Object.keys(self._specifics).forEach((key) => {

					if (0 === self._frame.indexOf(self._specifics[key])) {

						found = true;

						const size = "object" === typeof self._specifics[key] && self._specifics[key] instanceof Buffer ?
							self._specifics[key].length : 1;

						self.emit(key);

						self._frame = Buffer.from(Buffer.concat([
							self._frame.slice(0, size),
							self._frame.slice(size, self._frame.length)
						]));

					}

				});

			if (found) {
				_extractSpecifics(self);
			}

		}

module.exports = function digestEndOnly () {

	const firstEnd = this._searchFirstEnd();

	// no end tag detected
	if (!firstEnd) {
		this._digesting = false;
	}

	// first end tag detected
	else {

		_extractSpecifics(this);

		// extract first frame
		this.push(Buffer.from(this._frame.slice(0, firstEnd.end)));

		// remove extracted frame from main one
		this._frame = Buffer.from(this._frame.slice(firstEnd.end, this._frame.length));

		// second full frame detected
		if (-1 < this._searchTags(this._endWith)) {
			this._digest();
		}
		else {
			this._digesting = false;
		}

	}

};
