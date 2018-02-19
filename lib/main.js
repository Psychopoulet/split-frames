
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

		(0, console).log("constructor", "start", this.start, "end", this.end, "escapeWith", this.escapeWith);

	}

	_digest () {

		if (!this.frame.length) {
			this.digesting = false;
		}
		else {

			this.digesting = true;

			try {

				(0, console).log("_digest", this.frame);

				// neither start or end
				if (null === this.start && null === this.end) {

					(0, console).log("neither start or end");

					this.push(Buffer.from(this.frame.slice(0, this.frame.length)));
					this.frame = Buffer.from([]);

					this.digesting = false;

				}

				// only start
				else if (null !== this.start && null === this.end) {

					(0, console).log("only start");

					const firstStartAt = this.frame.indexOf(this.start);

					// no start tag detected
					if (-1 >= firstStartAt) {

						(0, console).log("no start tag detected");

						this.frame = Buffer.from([]);
						this.digesting = false;

					}

					// first start tag detected
					else {

						(0, console).log("first start tag detected at", firstStartAt);

						let nextStartAt = this.frame.indexOf(this.start, firstStartAt + 1);

						// second start tag not detected
						if (-1 >= nextStartAt) {

							(0, console).log("second start tag not detected");

							// remove useless bits
							if (0 < firstStartAt) {
								this.frame = Buffer.from(this.frame.slice(firstStartAt, this.frame.length));
							}

							this.digesting = false;

						}

						// second start tag detected
						else {

							(0, console).log("second start tag detected at", nextStartAt);

							this.push(Buffer.from(this.frame.slice(firstStartAt, nextStartAt)));
							this.frame = Buffer.from(this.frame.slice(nextStartAt, this.frame.length));

							nextStartAt = this.frame.indexOf(this.start, 1);

							// second full frame detected
							if (-1 < nextStartAt) {

								(0, console).log("second full frame detected");

								this._digest();

							}
							else {
								this.digesting = false;
							}

						}

					}

				}

				// only end
				else if (null === this.start && null !== this.end) {

					(0, console).log("only end");

					const firstEndAt = this.frame.indexOf(this.end);

					// no end tag detected
					if (-1 >= firstEndAt) {

						(0, console).log("no end tag detected");
						this.digesting = false;

					}

					// first end tag detected
					else {

						(0, console).log("first end tag detected at", firstEndAt);

						const endSize = "object" === typeof this.end && this.end instanceof Buffer ? this.end.length : 1;

						this.push(Buffer.from(this.frame.slice(0, firstEndAt + endSize)));
						this.frame = Buffer.from(this.frame.slice(firstEndAt + endSize, this.frame.length));

						const nextEndAt = this.frame.indexOf(this.end, 1);

						// second full frame detected
						if (-1 < nextEndAt) {

							(0, console).log("second full frame detected");

							this._digest();

						}
						else {
							this.digesting = false;
						}

					}

				}

				// start & end
				else {

					(0, console).log("start & end");

					// @TODO : with start AND end tag

				}

				// if (this.start) {

				// 	(0, console).log("start wanted");

				// 	if (this.frame.includes(this.start)) {

				// 		(0, console).log("start detected");

				// 		startAt = this.frame.indexOf(this.start);

				// 		(0, console).log("start at", startAt);

				// 		// @TODO : escaped start
				// 		// if (startAt && this.escapeWith && this.escaped.includes(this.start)) {
				// 		// }

				// 	}
				// 	else {

				// 		(0, console).log("no start detected");

				// 		startAt = this.frame.length;

				// 	}

				// }

				// if (startAt < endAt) {

				// 	if (this.end && this.frame.includes(this.end)) {

				// 		endAt = this.frame.indexOf(this.end) + 1;

				// 		// @TODO : escaped end
				// 		// if (endAt && this.escapeWith && this.escaped.includes(this.end)) {
				// 		// }

				// 	}
				// 	else if (startAt) {

				// 		(0, console).log("nextStartAt detected");

				// 		const nextStartAt = this.frame.indexOf(this.start, startAt + 1);

				// 		(0, console).log("nextStartAt detected", nextStartAt);

				// 		endAt = startAt < nextStartAt ? nextStartAt : endAt;

				// 		// @TODO : escaped end
				// 		// if (endAt && this.escapeWith && this.escaped.includes(this.end)) {
				// 		// }

				// 	}
				// 	else {
				// 		startAt = 0;
				// 		endAt = 0;
				// 	}

				// }

				// // @TODO : remove escaped characters
				// // if (this.escapeWith && this.escaped.includes(this.end)) {
				// // }

				// if (startAt < endAt) {

				// 	(0, console).log("from", startAt, "to", endAt, Buffer.from(this.frame.slice(startAt, endAt)));

				// 	this.push(Buffer.from(this.frame.slice(startAt, endAt)));

				// 	this.frame = Buffer.from(this.frame.slice(endAt, this.frame.length));

				// }
				// else if (startAt === endAt) {

				// 	(0, console).log("no proper frame");

				// 	(0, console).log(this.end);

				// 	if (!this.end) {
				// 		this.frame = Buffer.from([]);
				// 	}

				// }

				// (0, console).log("rest", this.frame);

				// if (!this.frame.length) {
				// 	this.digesting = false;
				// }
				// else {
				// 	this._digest();
				// }

			}
			catch (e) {
				this.emit("error", e);
			}

		}

	}

	_transform (chunk, enc, cb) {

		(0, console).log("_transform", chunk);

		this.frame = chunk.length ? Buffer.concat([ this.frame, chunk ]) : this.frame;

		if (!this.digesting) {
			this._digest();
		}

		cb();

	}

};
