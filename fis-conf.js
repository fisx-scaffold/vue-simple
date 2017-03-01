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

// 初始化要编译的样式文件: 只处理页面引用的样式文件
fis.initProcessStyleFiles(pageFiles, require('./tool/stylus')());

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
    // 声明动态模块 id：构建打包过程中动态创建的模块
    dynamic: [
        'babelHelpers'
    ],
    config: fis.getModuleConfig()
});

var babel = require('babel-core');

// 编译 vue 文件
var vueLoader = require('fisx-vue-loader');
vueLoader.registerParser({
    babel: babel
});
fis.require('parser-vue').parser = vueLoader;
fis.match('/src/(**.vue)', {
    rExt: 'vue.js',
    isJsLike: true,
    relative: true,
    useMap: true,
    parser: fis.plugin('vue', {
        isProduction: isProduction,
        sourceMap: false,
        script: {
            lang: 'babel',
            speed: true
        }
    }),
    preprocessor: [
        fis.plugin('babel'), // extract babel helper api
        fis.plugin('amd') // convert commonjs to amd
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
        fis.plugin('amd')
    ]
});

// convert dist vue js to amd
fis.match('/dep/vue/dist/**.js', {
    preprocessor: [
        fis.plugin('replacer', {
            from: /process\.env\.NODE_ENV/g,
            to: '\'' + (fis.isProduction() ? 'production' : 'development') + '\''
        }),
        fis.plugin('amd')
    ]
});

// compress vue component in production env
fis.media('prod').match('/src/**.vue', {
    optimizer: fis.plugin('uglify-js')
}).match(/\/src\/.*\-vue\-part.*\.css/, {
    optimizer: fis.plugin('css-compressor')
});

// 由于从原有文件派生出来的文件，哪怕最后会打包到其它文件，但也会被认为是引用了不发布的文件
// 这里在处理结束设置为不允许发布，绕过这个问题。
fis.on('process:end', function (file) {
    file.derived.forEach(function (item) {
        if (/\/src\/.*\-vue\-part.*\.css/.test(item.subpath)) {
            item.release = false;
        }
    });
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
            packAsync: true
        },
        bundles: [
            {
                files: [/\/src\/.*\-vue\-part.*\.css/],
                target: 'src/main.styl'
            }
        ]
    })
});
