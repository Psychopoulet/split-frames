
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

	const compilationSource = join(__dirname, "typescript", "compilation.cts");
	const compilationTarget = join(__dirname, "typescript", "compilation.cjs");

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

		return new Promise((resolve) => {

			lstat(compilationTarget, (err, stats) => {
				return resolve(Boolean(!err && stats.isFile()));
			});

		}).then((exists) => {
			return exists ? unlink(compilationTarget) : Promise.resolve();
		});

	});

	it("should compile typescript file", () => {

		return new Promise((resolve, reject) => {

			const args = [
				"npx tsc",
				compilationSource,
				"--target es6",
				"--module commonjs"
			];

			exec(args.join(" "), {
				"cwd": join(__dirname, ".."),
				"windowsHide": true
			}, (err) => {
				return err ? reject(err) : resolve();
			});

		});

	}).timeout(MAX_TIMEOUT);

	it("should exec compiled typescript file", (done) => {

		const args = [
			"node",
			compilationTarget
		];

		exec(args.join(" "), {
			"cwd": join(__dirname, ".."),
			"windowsHide": true
		}, (err) => {
			return err ? done(err) : done();
		});

	});

});
