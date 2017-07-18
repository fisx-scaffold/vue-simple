/**
 * @file 本地 web server 配置文件，更多信息见如下链接：
 *       https://github.com/ecomfe/edp-webserver
 *       https://github.com/wuhy/autoresponse
 *       https://github.com/wuhy/watchreload
 *
 *       TIP:
 *       1) 以发布目录进行调试查看，同时支持修改浏览器自动刷新命令：
 *          fisx release -wL
 *          fisx server start --release
 * @author ${#author#}
 */

/* global redirect:false */
/* global content:false */
/* global empty:false */
/* global home:false */
/* global autoless:false */
/* global html2js:false */
/* global file:false */
/* global less:false */
/* global stylus:false */
/* global livereload:false */
/* global php:false */
/* global proxyNoneExists:false */
/* global requireConfigInjector:false */
/* global cjs2amd:false */
/* global autoresponse:false */
/* global vueProcessor:false */
/* global babelProcessor:false */
/* global envifyProcessor:false */

exports.port = 8848;
exports.directoryIndexes = true;
exports.documentRoot = __dirname;

exports.getLocations = function () {
    var vueLoader = require('fisx-vue-loader');
    var stylusParser = require('stylus');

    var babelHandlers = babelProcessor({
        // sourceMap: false,
        // requireCss: {
        //     inline: true
        // }
    });
    var vueHandlers = vueProcessor({
        parser: {
            babel: require('babel-core'),
            stylus: [
                stylusParser,
                require('./tool/stylus')()
            ]
        },
        vue: {
            // sourceMap: false,
            script: {
                lang: 'babel'
            }
        },
        vueLoader: vueLoader
    });

    var requireInjector = requireConfigInjector();

    var customHandlers = fis.serveRelease ? [vueHandlers.hotReloadApi] : [
        vueHandlers.vuePkg,
        vueHandlers.hotReloadApi,
        babelHandlers.babelHelper,
        vueHandlers.vue,
        babelHandlers.babel
    ];

    return [].concat(
        {
            location: /\/$/,
            handler: [
                home('index.html'),
                requireInjector
            ]
        },
        {
            location: /\.less($|\?)/,
            handler: [
                file(),
                less()
            ]
        },
        {
            location: /\.styl($|\?)/,
            handler: [
                file(),
                stylus(
                    require('./tool/stylus')(stylusParser, true)
                )
            ]
        },

        customHandlers,

        {
            path: /\/dep\/.*\.js$/,
            handler: [
                file(),
                envifyProcessor,
                cjs2amd.create({
                    resolveRequire: true
                })
            ]
        },

        // 添加 mock 处理器
        autoresponse('edp', {
            logLevel: 'debug',
            root: __dirname,
            handlers: requireInjector,
            post: true,
            get: {
                match: function (reqPathName) { // mock all `/xx/xx` path
                    if (reqPathName.indexOf('socket.io') !== -1) {
                        return false;
                    }
                    return !/\.\w+(\?.*)?$/.test(reqPathName);
                },
                mock: function (reqURL) {
                    var path = reqURL.pathname.replace(/^\/+/, '') || 'index';
                    return path + '.js';
                }
            }
        }),

        {
            location: /^.*$/,
            handler: [
                file(),
                requireInjector,
                proxyNoneExists()
            ]
        }
    );
};

exports.injectRes = function (res) {
    for (var key in res) {
        if (res.hasOwnProperty(key)) {
            global[key] = res[key];
        }
    }
};

// disable watchreload setting false
exports.watchreload = {
    hmr: true,
    logLevel: 'debug',
    fileTypes: {
        script: 'js,vue'
    } // ,
    // files: [
    //     'src/**/*',
    //     'templates/**/*.tpl'
    // ]
};
