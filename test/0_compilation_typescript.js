
"use strict";

// deps

	// natives
	const { exec } = require("node:child_process");
	const { join } = require("node:path");
	const { unlink } = require("node:fs/promises");
	const { lstat } = require("node:fs");

// consts

	const MAX_TIMEOUT = 10000;

// tests

describe("compilation typescript", () => {

	const compilationTarget = join(__dirname, "typescript", "compilation.js");

	before(() => {

		return new Promise((resolve) => {

			lstat(compilationTarget, (err, stats) => {
				return resolve(Boolean(!err && stats.isFile()));
			});

		}).then((exists) => {
			return exists ? unlink(compilationTarget) : Promise.resolve();
		});

	});

	after(() => {

		return new Promise((resolve, reject) => {

			lstat(compilationTarget, (err, stats) => {
				return resolve(Boolean(!err && stats.isFile()));
			});

		}).then((exists) => {
			return exists ? unlink(compilationTarget) : Promise.resolve();
		});

	});

	it("should compile typescript file", (done) => {

		exec("tsc " + join(__dirname, "typescript", "compilation.ts"), {
			"cwd": join(__dirname, ".."),
			"windowsHide": true
		}, (err) => {
			return err ? done(err) : done();
		});

	}).timeout(MAX_TIMEOUT);

});
