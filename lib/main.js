
"use strict";

// module

module.exports = class SplitFrames extends require("stream").Transform {

	constructor (options) {

		super(options);

		this.frame = Buffer.from([]);
		this.digesting = false;

		if ("object" !== typeof options) {

			this.start = null;
			this.end = null;
			this.escapeWith = null;
			this.escaped = [];

		}
		else {

			this.start = options.start ? options.start : null;
			this.end = options.end ? options.end : null;
			this.escapeWith = options.escapeWith ? options.escapeWith : null;
			this.escaped = options.escaped ? options.escaped : [];

		}

	}

	_digest () {

		if (!this.frame.length) {
			this.digesting = false;
		}
		else if (!this.digesting) {

			this.digesting = true;

			try {

				(0, console).log("_digest", this.frame);

				let startAt = 0;
				let endAt = this.frame.length;

				if (this.start) {

					(0, console).log("start wanted");

					if (this.frame.includes(this.start)) {

						(0, console).log("start detected");

						startAt = this.frame.indexOf(this.start);

						(0, console).log("start at", startAt);

						// @TODO : escaped start
						// if (startAt && this.escapeWith && this.escaped.includes(this.start)) {
						// }

					}
					else {

						(0, console).log("no start detected");

						startAt = this.frame.length;

					}

				}

				if (startAt < endAt) {

					if (this.end && this.frame.includes(this.end)) {

						endAt = this.frame.indexOf(this.end) + 1;

						// @TODO : escaped end
						// if (endAt && this.escapeWith && this.escaped.includes(this.end)) {
						// }

					}
					else if (startAt) {

						(0, console).log("nextStartAt detected");

						const nextStartAt = this.frame.indexOf(this.start, startAt + 1);

						(0, console).log("nextStartAt detected", nextStartAt);

						endAt = startAt < nextStartAt ? nextStartAt : endAt;

						// @TODO : escaped end
						// if (endAt && this.escapeWith && this.escaped.includes(this.end)) {
						// }

					}

					// @TODO : remove escaped characters
					// if (this.escapeWith && this.escaped.includes(this.end)) {
					// }

				}

				if (startAt < endAt) {

					(0, console).log("from", startAt, "to", endAt, Buffer.from(this.frame.slice(startAt, endAt)));

					this.push(Buffer.from(this.frame.slice(startAt, endAt)));

					this.frame = Buffer.from(this.frame.slice(endAt, this.frame.length));

				}
				else if (startAt === endAt) {

					(0, console).log("no proper frame");

					this.frame = Buffer.from([]);

				}

				(0, console).log("rest", this.frame);

				if (!this.frame.length) {
					this.digesting = false;
				}
				else {
					this._digest();
				}

			}
			catch (e) {
				this.emit("error", e);
			}

		}

	}

	_transform (chunk, enc, cb) {

		(0, console).log("_transform", chunk);

		this.frame = chunk.length ? Buffer.concat([ this.frame, chunk ]) : this.frame;
		this._digest();

		cb();

	}

};
