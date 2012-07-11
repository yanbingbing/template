// simple template engine
(function(){
var R_IF    = /^if\s+(.+)$/,
	R_ELIF  = /^elif\s+(.+)$/,
	R_EACH  = /^each\s+(.+)\s+as\s+(\w+)(?:\s*,\s*(\w+))?$/,
	R_VAR   = /^(\w+)\s*=\s*(.+)$/,
	R_TRIM  = /^[\s\xA0]+|[\s\xA0]+$/,
	R_D = /\\/g, R_Q = /'/g, R_M = /[\t\b\f\r\n]/g,

	T_OPEN = '{%', T_CLOSE = '%}',

	toString = Object.prototype.toString,

	trim = (function(){
		return String.prototype.trim ? function(str){
			return str.trim();
		} : function(str){
			return str.replace(R_TRIM, '');
		};
	})();

function q(str){
	return "'"+str.replace(R_D, "\\\\").replace(R_Q, "\\'").replace(R_M, ' ')+"'";
}
function expr(str){
	return '(function(){try{return('+str+')}catch(e){return""}})()';	
}
function compile(template){
	var body = ['var _O=[];'], part;
	template = template.split(T_OPEN);
	body.push("_O.push("+q(template.shift())+");");
	while (part = template.shift()) {
		var parts = part.split(T_CLOSE), token;
		if (parts.length > 1 && (token = trim(parts.shift()))) {
			switch(true){
			// {%fi%}
			case token == 'fi': body.push('}'); break;
			// {%hcae%}
			case token == 'hcae': body.push('});'); break;
			// {%else%}
			case token == 'else': body.push('}else{'); break;
			// {%if expr%}
			case R_IF.test(token):
				body.push("if("+expr(RegExp.$1)+"){");
				break;
			// {%elif expr%}
			case R_ELIF.test(token):
				body.push("}else if("+expr(RegExp.$1)+"){");
				break;
			// {%each expr as value,key%}
			case R_EACH.test(token):
				body.push("this.each("+expr(RegExp.$1)+",function("+(RegExp.$3 || "_P") + "," + RegExp.$2 + "){");
				break;
			// {%var=expr%}
			case R_VAR.test(token):
				body.push("var "+RegExp.$1+"="+expr(RegExp.$2)+";");
				break;
			// {%expr%}
			default:
				body.push("_O.push("+expr(token)+");");
				break;
			}
		}
		body.push("_O.push("+q(parts.join(T_CLOSE))+");");
	}
	body.push('return _O.join("");');
	return body.join('');
}
var Template = function(template){
	this.template = compile(template);
};
Template.each = function(object, callback) {
	if (!object) return;
	var key, i = 0,
		length = object.length;
	
	if (length === undefined || toString.call(object) == '[object Function]') {
		for (key in object) {
			callback.call(object[key], key, object[key]);
		}
	} else {
		for (; i < length;) {
			callback.call(object[i], i, object[i++]);
		}
	}
};
Template.prototype.render = function(data){
	var body = [
		'with(_I){',
		this.template,
		'}'
	].join('');
	return (new Function('_I', body)).call(Template, data);
};
window.Template = Template;
})();