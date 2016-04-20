/**
 * @file Simple JS template engine
 * @author bruxexyj@gmail.com
 */
(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    }
    else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    }
    else {
        global.Template = factory();
    }
})(this, function () {
    var regExp = /<%(=?)\s*(.*?)\s*%>/g;

    /**
     * Template 构造函数
     *
     * @constructor
     * @param {string} template 模板文本
     */
    function Template(template) {
        if (!(this instanceof Template)) {
            return new Template(template);
        }

        this.template = template || '';
    }

    /**
     * 编译模板
     *
     * @return {Function} 编译后的渲染函数
     */
    Template.prototype.compile = function () {
        var match;
        var cursor = 0;
        var codes = [];
        // 因为构造函数体内容拼字符串是使用`"`，所以模板中输出的双引号需要转义
        // 同样，模板中的`\n、\r`也需要转义，因为正常代码是需要`;`作为一行的，但`\n、\r`会使代码在一行中折断
        var tpl = this.template
            .replace(/\"/g, '\\\"')
            .replace(/\n/g, '\\\n')
            .replace(/\r/g, '\\\r');

        codes.push(getValue.toString() + ';');
        codes.push('var r = "";');
        // 默认情况下，模板中访问数据`data`的属性时，需要`data.xxx`。为方便，使用`with`语法可以使变量访问的
        // 作用域限制在`data`下，所以直接使用`xxx`就可以访问（当然，平常开发中不推荐使用`with`）
        codes.push('with (data || {}) {');
        while (match = regExp.exec(tpl)) {
            // 固定文本
            codes.push('r += "' + tpl.slice(cursor, match.index) + '";');
            // 变量
            if (match[1]) {
                codes.push('r += getValue("' + match[2] + '");');
            }
            // 代码逻辑
            else {
                codes.push(match[2]);
            }
            cursor = match.index + match[0].length;
        }
        codes.push('r += "' + tpl.slice(cursor) + '";');
        codes.push('}');
        codes.push('return r;');

        return new Function('data', codes.join(''));
    };

    /**
     * Template 构造函数
     *
     * @param {Object} data 渲染时用到的数据
     * @return {string} 渲染后的文本
     */
    Template.prototype.render = function (data) {
        if (!this.renderer) {
            this.renderer = this.compile();
        }

        return this.renderer(data);
    };

    /**
     * 获取字段的值，支持对象取值和数组取值
     *
     * - 对象支持如下取值方式：a.b.c 或 a[b][c]
     * - 数组支持如下取值方式：a[0][1]
     *
     * @param {string} name 字段名，可以包含`.`和`[]`
     * @return {Mixed} 字段的值
     */
    function getValue(name) {
        if (!name) {
            return '';
        }
        var fields = name.split(/\.|\[(\d+)\]/);
        // 正则匹配出的结果有包含空值，过滤一下
        for (var i = 0; i < fields.length;) {
            if (!fields[i]) {
                fields.splice(i, 1);
            }
            else {
                i++;
            }
        }
        var value = data;
        for (var i = 0, len = fields.length; i < len; i++) {
            var field = fields[i];
            if (typeof value === 'object') {
                value = value[field];
            }
            else {
                return '';
            }
        }
        // null或undefined值转换成空字符串
        return value == null ? '' : value;
    }

    return Template;
});
