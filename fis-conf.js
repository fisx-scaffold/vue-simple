/**
 * @file fisx 编译的配置文件
 * @author ${#author#}
 */

var pageFiles = ['index.html'];
var isProduction = fis.isProduction();

// 这样可以直接忽略未依赖的文件处理，最后只输出依赖的文件
fis.addIgnoreFiles([
    '/dep/**',
    '/dep/*'
]);

// 引用项目依赖定义的 stylus
var stylusOpts = require('./tool/stylus')();
var stylusParser = require('stylus');
fis.require('parser-stylus').parser = stylusParser;

// 初始化要编译的样式文件: 只处理页面引用的样式文件
fis.initProcessStyleFiles(pageFiles, stylusOpts);

// 启用相对路径
fis.match('index.html', {
    relative: true
}).match('*.js', {
    relative: true
}).match('*.css', {
    relative: true
});

// 启用 amd 模块编译
fis.hook('amd', {
    // 如果使用了动态渲染模板，模板入口模块解析需要自行实现，可以按如下提供
    // 方式直接基于正则提取
    // parseScript: function (content, info) {
    //     if (!info.isInline || !/\.tpl$/.test(info.subpath)) {
    //         return;
    //     }
    //     // 提取模板的异步模块信息
    //     return {
    //         asynDeps: fis.util.extractAsyncModuleIds(content)
    //     };
    // },
    // 声明动态模块 id：构建打包过程中动态创建的模块
    dynamic: [
        'babelHelpers'
    ],
    config: fis.getModuleConfig()
});

// 编译 vue 文件
var babel = require('babel-core');
var vueLoader = require('fisx-vue-loader');
vueLoader.registerParser({
    babel: babel,
    stylus: [stylusParser, stylusOpts]
});
fis.require('parser-vue').parser = vueLoader;
fis.match('/src/(**.vue)', {
    rExt: 'vue.js',
    isJsLike: true,
    relative: true,
    useMap: true,
    parser: fis.plugin('vue', {
        isProduction: true,
        sourceMap: false,
        script: {
            lang: 'babel',
            speed: true
        }
    }),
    preprocessor: [
        fis.plugin('babel'), // extract babel helper api
        fis.plugin('amd', {  // convert commonjs to amd
            // remove css require declaration in js module
            clearCssRequire: true
        })
    ]
});

// babel compile es2015
fis.require('parser-babel6').parser = babel;
fis.match('/src/(**.js)', {
    parser: fis.plugin('babel6', {
        speed: true,
        sourceMaps: false
    }),
    preprocessor: [
        fis.plugin('babel'),
        fis.plugin('amd', {
            clearCssRequire: true
        })
    ]
});

// process dep module: amd normalize
fis.match('/dep/**.js', {
    preprocessor: [
        fis.plugin('amd', {
            resolveRequire: true
        }),
        fis.plugin('replacer', {
            envify: true,
            isProd: isProduction
        })
    ]
});

// 启用打包插件
fis.require('prepackager-babel').babel = babel;
fis.match('::package', {
    prepackager: fis.plugin('babel'),
    packager: fis.plugin('static', {
        // 内联 `require.config`
        inlineResourceConfig: true,
        page: {
            files: pageFiles,
            // 打包页面异步入口模块
            packAsync: true,
            // 打包页面模块依赖的样式，默认打包到页面引用的样式文件里
            packDepStyle: true,
            // 按页面提取第三方依赖的模块打包成一个文件
            extractVendor: true
        }
    })
});
