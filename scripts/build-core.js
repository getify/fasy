#!/usr/bin/env node

var fs = require("fs"),
	path = require("path"),
	util = require("util"),
	{ execFile } = require("child_process"),

	ugly = require("terser"),

	execFileAsync = util.promisify(execFile),
	packageJSON,
	copyrightHeader,
	version,
	year = (new Date()).getFullYear(),
	builds,

	ROOT_DIR = path.join(__dirname,".."),
	SRC_DIR = path.join(ROOT_DIR,"src"),
	DIST_DIR = path.join(ROOT_DIR,"dist"),

	result
;

console.log("*** Building Fasy ***");

(async function main(){
	try {
		// try to make the dist directory, if needed
		try {
			fs.mkdirSync(DIST_DIR,0o755);
		}
		catch (err) { }

		// run moduloze CLI on the src/ tree
		await execFileAsync(
			path.join(ROOT_DIR,"node_modules",".bin","mz"),
			[ "-rube" ]
		);

		// read package.json
		packageJSON = JSON.parse(
			fs.readFileSync(
				path.join(ROOT_DIR,"package.json"),
				{ encoding: "utf8", }
			)
		);
		// read version number from package.json
		version = packageJSON.version;
		// read copyright-header text, render with version and year
		copyrightHeader = fs.readFileSync(
			path.join(SRC_DIR,"copyright-header.txt"),
			{ encoding: "utf8", }
		).replace(/`/g,"");
		copyrightHeader = Function("version","year",`return \`${copyrightHeader}\`;`)( version, year );

		// read dist/* files
		var umdFiles = (
			fs.readdirSync(path.join(DIST_DIR,"umd"))
		).map(file => path.join(DIST_DIR,"umd",file));
		var esmFiles = (
			fs.readdirSync(path.join(DIST_DIR,"esm"))
		).map(file => path.join(DIST_DIR,"esm",file));
		var files = [ ...umdFiles, ...esmFiles ];

		// minify dist/* files
		for (let file of files) {
			let contents = fs.readFileSync(file,{ encoding: "utf8" });

			let result = await ugly.minify(contents,{
				mangle: {
					keep_fnames: true,
				},
				compress: {
					keep_fnames: true,
				},
				output: {
					comments: /^!/,
				},
			});
			if (!(result && result.code)) {
				if (result.error) throw result.error;
				else throw result;
			}
			// append copyright-header text
			result = `${copyrightHeader}${result.code}`;
			// write dist/ file
			fs.writeFileSync(file,result,{ encoding: "utf8", });
		}

		console.log("Complete.");
	}
	catch (err) {
		console.error(err);
		process.exit(1);
	}
})();
