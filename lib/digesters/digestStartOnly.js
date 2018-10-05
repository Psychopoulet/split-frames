/*
	eslint no-invalid-this: 0
*/

"use strict";

module.exports = function digestStartOnly () {

	if (this._timeoutDigest) {
		clearTimeout(this._timeoutDigest);
		this._timeoutDigest = null;
	}

	const firstStart = this._searchFirstStart();

	// no start tag detected
	if (!firstStart) {

		this._frame = Buffer.from([]);
		this._digesting = false;

	}

	// first start tag detected
	else {

		const nextStartAt = this._searchTags(this._startWith, firstStart.end);

		// second start tag not detected
		if (-1 >= nextStartAt) {

			// remove useless bits
			this._frame = 0 < firstStart.start ? Buffer.from(this._frame.slice(firstStart.start, this._frame.length)) : this._frame;
			this._digesting = false;

			this._timeoutDigest = setTimeout(() => {

				clearTimeout(this._timeoutDigest);
				this._timeoutDigest = null;

				this.push(Buffer.from(this._frame.slice(firstStart.start, this._frame.length)));

				this._frame = Buffer.from([]);
				this._digesting = false;

			}, this._startTimeout);

		}

		// second start tag detected
		else {

			// extract first frame
			this.push(Buffer.from(this._frame.slice(firstStart.start, nextStartAt)));

			// remove extracted frame from main one
			this._frame = Buffer.from(this._frame.slice(nextStartAt, this._frame.length));

			// second full frame detected (force minimal data length)
			if (-1 < this._searchTags(this._startWith, 1)) {
				this._digest();
			}
			else {
				this._digesting = false;
			}

		}

	}

};
