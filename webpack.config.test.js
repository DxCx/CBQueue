var webpack = require('webpack');
var path = require('path');
var fs = require('fs');

/* small hack to build map of node modules used for excluding from webpack */
var nodeModules = {};
fs.readdirSync('node_modules')
.filter(function (x) {
	return ['.bin'].indexOf(x) === -1;
})
.forEach(function (mod) {
	nodeModules[mod] = 'commonjs ' + mod;
});

/* helper function to get into build directory */
var libPath = function(name) {
	if ( null === name ) {
		return path.join(__dirname, 'build');
	}

	return path.join(__dirname, 'build', name);
}

module.exports = {
	entry: './test/test.ts',
	target: 'node',
	output: {
		filename: libPath('test.js')
	},
	resolve: {
		extensions: ['', '.ts', '.js']
	},
	module: {
		loaders: [{ test: /\.ts$/, loader: 'ts-loader' }]
	},
	externals: nodeModules,
	ts: {
		compiler: 'typescript',
		configFileName: 'tsconfig.test.json'
	}
}
