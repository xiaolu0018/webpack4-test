const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

// const buildFolder = 'F:\\test-web';
module.exports = (env, argv) => {
  const buildFolder = 'dist';
  const production = argv.mode === 'production';
  const productionSourceMap = true;
  const productionGzip = production;//gzip

  const webpackConfig = {
    entry: {
      index: "./src/index.js",
      login: "./src/js/login.js",
    },
    output: {
      filename: 'js/[name].js',
      path: path.resolve(__dirname, buildFolder),
      libraryTarget: 'umd'
    },
    /*
      externd jq for cdn
     */
    externals: {
      jquery: 'jQuery',
    },
    devtool: productionSourceMap ? 'source-map' : false,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@static': path.resolve(__dirname, 'static')
      }
    },
    module: {
      rules: [{
        test: /\.(css|sass|scss)$/,
        use: [
          production ? MiniCssExtractPlugin.loader : 'style-loader',
          "css-loader",
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [
                require('autoprefixer')
              ],
              sourceMap: true
            }
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'sass-resources-loader',
            options: {
              // resources: './path/to/resources.scss',
              resources: ['./src/css/varable.scss', './src/css/mixins.scss']
            },
          },
        ],
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 20000,
          name: 'img/[name].[hash:7].[ext]'
        }
      }]
    },
    plugins: [
      new CleanWebpackPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new MiniCssExtractPlugin({
        ignoreOrder: true,
        filename: 'css/[name].[contenthash].css',
      }),
      new HtmlWebpackPlugin({
        filename: 'game.html',
        template: 'public/index.html',
        favicon: './public/favicon.png',
        inject: true,
        chunks: ['index'],
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true
        },
      }),
      new HtmlWebpackPlugin({
        filename: 'login.html',
        template: 'public/login.html',
        favicon: './public/favicon.png',
        inject: true,
        chunks: ['login'],
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true
        },
      }),
      new webpack.HashedModuleIdsPlugin(),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new CopyWebpackPlugin([
        {
          from: path.resolve(__dirname, 'public'),
          to: path.resolve(__dirname, buildFolder),
          ignore: ['.*', '*.html']
        }
      ])
    ],
    optimization: {
      runtimeChunk: {
        name: 'manifest'
      },
      minimizer: [
        /* webpack4 TerserPlugin替换UglifyJsPlugin */
        new TerserPlugin({
          cache: true,
          parallel: true,
          sourceMap: productionSourceMap,
          terserOptions: {
            warnings: false
          }
        }),
        // new UglifyJsPlugin({
        //   cache: true,
        //   parallel: true,
        //   sourceMap: productionSourceMap,
        //   uglifyOptions: {
        //     warnings: false
        //   }
        // }),
        new OptimizeCSSPlugin({
          cssProcessorOptions: productionSourceMap
            ? { safe: true, map: { inline: false } }
            : { safe: true }
        }),
      ],
      splitChunks: {
        chunks: 'async',
        minSize: 30000,
        minChunks: 1,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        name: false,
        cacheGroups: {
          common: {
            name: "common",
            chunks: "all",
            minSize: 1,
            priority: 0
          },
          vendor: {
            name: 'vendor',
            chunks: 'initial',
            priority: -10,
            reuseExistingChunk: false,
            test: /node_modules\/(.*)\.js/
          },
          styles: {
            name: 'styles',
            test: /\.(scss|css)$/,
            chunks: 'all',
            minChunks: 1,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      }
    },
    performance: { //解决webpack打包警告
      hints: "error", // 枚举
      maxAssetSize: 30000000, // 整数类型（以字节为单位）
      maxEntrypointSize: 50000000, // 整数类型（以字节为单位）
      assetFilter: function (assetFilename) {
        // 提供资源文件名的断言函数
        return assetFilename.endsWith('.css') || assetFilename.endsWith('.js');
      }
    },
    watch: true,
    watchOptions: {
      aggregateTimeout: 600,
      ignored: /node_modules/,
      poll: 1000
    },
    devServer: {
      contentBase: path.join(__dirname, 'public'),
      port: 8020, // 本地服务器端口号
      hot: true, // 热重载
      open: true,
      https: true,//https
      overlay: true, // 如果代码出错，会在浏览器页面弹出“浮动层
      stats: "errors-only",
      // proxy: {
      //   // 跨域代理转发
      //   "/comments": {
      //     target: "https://m.weibo.cn",
      //     changeOrigin: true,
      //     logLevel: "debug",
      //     headers: {
      //       Cookie: ""
      //     }
      //   }
      // },
      historyApiFallback: {
        // HTML5 history模式
        rewrites: [
          { from: /^\/login$/, to: "/login.html" },
          { from: /^\/$/, to: "/game.html" }
        ]
      }
    },
  };

  if (productionGzip) {
    const CompressionWebpackPlugin = require('compression-webpack-plugin')
    webpackConfig.plugins.push(
      new CompressionWebpackPlugin({
        filename: '[path].gz[query]',
        algorithm: 'gzip',
        test: new RegExp('\\.(js|css)$'),
        threshold: 10240,
        minRatio: 0.8
      })
    )
  }

  return webpackConfig
};