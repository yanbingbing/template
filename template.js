// simple template engine
(function(){
var r_if    = /^if\s+(.+)$/,
	r_elif  = /^elif\s+(.+)$/,
	r_each  = /^each\s+(.+)\s+as\s+(\w+)(?:\s*,\s*(\w+))?$/,
	r_var   = /^(\w+)\s*=\s*(.+)$/,
	r_trim  = /^[\s\xA0]+|[\s\xA0]+$/,
	r_d = /\\/g, r_q = /'/g, r_m = /[\r\n]/g, r_b = /[\t\b\f]/g;
var split = (function(){
	var r_split = /{%(.*?)%}/gm, r_parse = /^(.*?){%(.*?)%}/m;
	return ' {%1%} '.split(r_split)[1] == '1' ? function(template){
		return template.split(r_split);
	} : function(template){
		var m, ret = [];
		while (m = r_parse.exec(template)) {
			template = template.substr(m[0].length);
			ret.push(m[1]);
			ret.push(m[2]);
		}
		ret.push(template);
		return ret;
	}
})();
function q(str){
	return "'"+str.replace(r_d, "\\\\").replace(r_q, "\\'").replace(r_b, ' ')+"'";
}
function trim(str){
	return str.trim ? str.trim() : str.replace(r_trim, '');
}
function expr(str){
	return '(function(){try{return('+str+')}catch(e){return""}})()';	
}
function compile(template){
	var chunk = split(template.replace(r_m, ' '));
	var body = ['var _O=[];'];
	for (var i=0,l=chunk.length,token;i<l;i++) {
		token = chunk[i];
		if (i%2) {
			token = trim(token);
			switch(true){
			// {%fi%}
			case token == 'fi': body.push('}'); break;
			// {%hcae%}
			case token == 'hcae': body.push('});'); break;
			// {%else%}
			case token == 'else': body.push('}else{'); break;
			// {%if expr%}
			case r_if.test(token):
				body.push("if("+expr(RegExp.$1)+"){");
				break;
			// {%elif expr%}
			case r_elif.test(token):
				body.push("}else if("+expr(RegExp.$1)+"){");
				break;
			// {%each expr as value,key%}
			case r_each.test(token):
				body.push("this.each("+expr(RegExp.$1)+",function("+(RegExp.$3 || "_P") + "," + RegExp.$2 + "){");
				break;
			// {%var=expr%}
			case r_var.test(token):
				body.push("var "+RegExp.$1+"="+expr(RegExp.$2)+";");
				break;
			// {%expr%}
			default:
				body.push("_O.push("+expr(token)+");");
				break;
			}
		} else {
			body.push("_O.push("+q(token)+");");
		}
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
	
	if (length === undefined || Object.prototype.toString.call(object) == '[object Function]') {
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