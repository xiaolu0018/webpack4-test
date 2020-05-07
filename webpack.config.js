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
  const productionSourceMap = !production;
  const productionGzip = production;//gzip

  const webpackConfig = {
    entry: {
      index: "./src/index.js",
      login: "./src/js/login.js",
    },
    output: {
      filename: 'js/[name].[hash].js',
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
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 90000,
          name: 'fonts/[name].[hash:7].[ext]'
        }
      }]
    },
    plugins: [
      new CleanWebpackPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new MiniCssExtractPlugin({
        ignoreOrder: true,
        filename: 'css/[name].[contenthash].css',
        chunkFilename: "css/[name].[contenthash].css" // 非入口文件，如公共css
      }),
      new HtmlWebpackPlugin({
        filename: 'index.html',
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
        chunks: 'all',
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        name: false,
        cacheGroups: {
          vendors: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 0,
            reuseExistingChunk: true,
            minSize:3000
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
    watch: !production,
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
          { from: /^\/$/, to: "/index.html" }
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
  if (production) {
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
    webpackConfig.plugins.push(new BundleAnalyzerPlugin())
  }
  return webpackConfig
};
