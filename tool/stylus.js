/**
 * @file 定义 stylus 扩展的选项
 */

var autoprefixer = require('autoprefixer-stylus');
var rider = require('rider');

module.exports = exports = function (stylus, resolveUrl) {
    return {
        use: function (style) {
            style.use(autoprefixer({
                browsers: [
                    'Android >= 2.3',
                    'iOS >= 6',
                    'ExplorerMobile >= 10'
                ]
            }));

            if (stylus && resolveUrl) {
                // 默认 web server 没有开启这个选项，需要强制初始化下
                style.define('url', stylus.resolver());
            }

            style.use(
                rider()
            );
        }
    };
};
