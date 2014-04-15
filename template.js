/*
 * Simple Template Engine
 */
(function (global) {

    'use strict';

    var R_IF = /^if\s+(.+)$/,
        R_ELIF = /^(?:elif|else\s*if)\s+(.+)$/,
        R_EACH = /^(?:for)?each\s+(.+)\s+as\s+(\w+)(?:\s*,\s*(\w+))?$/,
        R_VAR = /^(\w+)\s*=\s*(.+)$/,
        R_TRIM = /\S/.test("\xA0") ? /^[\s\xA0]+|[\s\xA0]+$/g : /^\s+|\s+$/g,
        R_D = /\\/g, R_Q = /'/g, R_M = /[\t\b\f\r\n]/g,

        T_OPEN = '{%', T_CLOSE = '%}',

        toString = ({}).toString,

        trim = ''.trim ? function (str) {
            return str.trim();
        } : function (str) {
            return str.replace(R_TRIM, '');
        };

    function isFunction(obj) {
        return toString.call(obj) === '[object Function]';
    }

    function quote(str) {
        return "'" + str.replace(R_D, "\\\\").replace(R_Q, "\\'").replace(R_M, ' ') + "'";
    }

    function expr(str) {
        return '(function(){try{return(' + str + ')}catch(e){return""}})()';
    }

    function each(object, callback) {
        if (!object) return;
        var index = 0, length = object.length;
        if (isFunction(object.forEach)) {
            object.forEach(callback);
        } else if (length === undefined || isFunction(object)) {
            for (index in object) {
                callback(object[index], index, object);
            }
        } else {
            for (; index < length;) {
                callback(object[index], index++, object);
            }
        }
    }

    function compile(template) {
        var body = ['var __O=[];'], part;
        template = template.split(T_OPEN);
        body.push("__O.push(" + quote(template.shift()) + ");");
        while (part = template.shift()) {
            var parts = part.split(T_CLOSE), token;
            if (parts.length > 1 && (token = trim(parts.shift()))) {
                switch (true) {
                    // {%fi%}
                    case token == 'endif':
                        body.push('}');
                        break;
                    // {%hcae%}
                    case token == 'endforeach':
                    case token == 'endeach':
                        body.push('});');
                        break;
                    // {%else%}
                    case token == 'else':
                        body.push('}else{');
                        break;
                    // {%if expr%}
                    case R_IF.test(token):
                        body.push("if(" + expr(RegExp.$1) + "){");
                        break;
                    // {%elif expr%}
                    case R_ELIF.test(token):
                        body.push("}else if(" + expr(RegExp.$1) + "){");
                        break;
                    // {%each expr as value,key%}
                    case R_EACH.test(token):
                        body.push("__EACH(" + expr(RegExp.$1) + ",function(" + RegExp.$2 + "," + (RegExp.$3 || "__index") + "){");
                        break;
                    // {%var=expr%}
                    case R_VAR.test(token):
                        body.push("var " + RegExp.$1 + "=" + expr(RegExp.$2) + ";");
                        break;
                    // {%expr%}
                    default:
                        body.push("__O.push(" + expr(token) + ");");
                        break;
                }
            }
            body.push("__O.push(" + quote(parts.join(T_CLOSE)) + ");");
        }
        body.push('return __O.join("");');
        return body.join('');
    }

    var Template = function (template) {
        this.template = compile(template);
    };
    Template.setOpenTag = function (tag) {
        T_OPEN = tag;
    };
    Template.setCloseTag = function (tag) {
        T_CLOSE = tag;
    };
    Template.prototype.render = function (data) {
        var body = [
            'with(__I){',
            this.template,
            '}'
        ].join('');
        return (new Function('__I, __EACH', body))(data, each);
    };

    // EXPOSE
    if (typeof define === 'function') {
        define(function () {
            return Template;
        });
    } else {
        global.Template = Template;
    }
})(this);