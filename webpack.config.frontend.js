let path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const CleanWebpackPlugin = require('clean-webpack-plugin');
// const WebpackShellPlugin = require('webpack-shell-plugin');

const editorConfig = {
    mode: 'development',
    target: 'web',
    entry: {
        editor: './src/editor/index.js',
        projects: './src/projectManager/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'build/public/'),
        filename: './static/signals-[name]-bundle.js'
    },
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './build'
    },
    module: {
        rules: [{
            test: /(\.jsx?)$/,
            exclude: /node_modules/,
            use: {
                loader: "babel-loader" // transpiles to a widely supported version of js
            }
        }, {
            test: /\.scss$/,
            use: [
                "style-loader", // creates style nodes from JS strings
                "css-loader", // translates CSS into CommonJS
                "sass-loader" // compiles Sass to CSS, using Node Sass by default
            ]
        }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/editor/index.html",
            filename: "editor.html",
            chunks: ["editor"],
            inject: false // injecting happens on the server
        }), new HtmlWebpackPlugin({
            template: "./src/projectManager/index.html",
            filename: "projects.html",
            chunks: ["projects"],
            inject: false // injecting happens on the server
        })
    ]
}

module.exports = editorConfig