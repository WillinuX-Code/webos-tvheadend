const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        polyfills: './src/polyfills.js',
        index: './src/index.tsx'
    },
    output: {
        asyncChunks: true,
        clean: true,
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'build')
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'public', 'index.html')
        }),
        new CopyPlugin({
            // copy appinfo and resources to build folder
            patterns: ['public/appinfo.json', 'public/splash.png', 'public/largeIcon.png', 'public/icon.png']
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'build')
        },
        port: 3000
    },
    module: {
        rules: [
            {
                test: /\.(m?js|jsx)$/,
                //exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: ['ts-loader']
            },
            {
                test: /\.(css)$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.less$/i,
                use: [
                    // compiles Less to CSS
                    'style-loader',
                    'css-loader',
                    'less-loader'
                ]
            }
        ]
    },
    // pass all js files through Babel
    resolve: {
        extensions: ['*', '.js', '.jsx', '.ts', '.tsx']
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    }
};
