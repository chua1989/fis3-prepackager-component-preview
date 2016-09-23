/**
要求组件js的名称即为组件名称。
settings = {
	wrap: '/xx/xx..html',//组件可视化原型文件，用来包裹组件可视化代码
	url: '/xx/xx.html', //组件可视化最终的目标文件
	COMPath: '/xx/xxx',//组件集合目录
	moduleListInstead: 'xxx',//使用模块列表节点替换当前文本
	moduleViewInstead: 'xx',//使用模块视图列表节点替换当前文本
	moduleCommentsInstead: 'xxx',//使用模块注释列表节点替换当前文本
	moduleJsInstead: 'xxx',//使用js脚本节点替换当前文本
}
demo代码匹配规则'example': /\/\*\*([\s\S]*)@example[\s\S]*?html:([\s\S]*?)js:([\s\S]*?)@example end([\s|\S]*?)\*\//
// ret.src 所有的源码，结构是 {'<subpath>': <File 对象>},包括所有的文件
// ret.ids 所有源码列表，结构是 {'<id>': <File 对象>},只包含资源文件如css,js,tpl,json等，不包括html、图片等文件
// ret.map 包含两个属性：res和pkg。如果是 spriter、postpackager 这时候已经能得到打包结果了，可以修改静态资源列表或者其他
// ret.pkg
*/
var path = require('path');
var regs = {
		//懒惰匹配到第一个*/
		'example': /\/\*\*([\s\S]*)@example[\s\S]*?(html:([\s\S]*?)js:([\s\S]*?))@example end([\s|\S]*?)\*\//,//懒惰匹配第一个*/
		'jsfile': /\S*(\/(\S+)*?\.js)$/,
		'modName': /\/(\S+\.js)/
	},
	innerLeft = '',
	innerRightT = '',
	innerRightB = '',
	innerJs = '';
	
//将str字符串转换成HTML格式
function transToHtml(str){
	var tran = [/&/g, />/g, /</g, /\n/g, / /g],//先要处理'&'才能处理其他标签，否则其他标签生成的‘&’会被处理
		to = ['&amp;', '&gt;', '&lt;', '<br>', '&nbsp;'];
	for(var i = 0; i < tran.length; i++){
		str = str.replace(tran[i], to[i]);
	}
	return str;
}
module.exports = function(ret, pack, settings, opt) {
	var src = ret.src,
		com = {},
		root = fis.project.getProjectPath(),
		wrap,//包裹文件
		newFile = fis.file.wrap(path.join(root, settings.url));//新文件
	//fis.log.notice('settings.COMPath : ' + settings.COMPath);	

	Object.keys(src).forEach(function(key){
		if(RegExp(settings.COMPath).test(key) && /\.js$/.test(key)){
			com[key] = src[key];
		}

		if(RegExp(settings.wrap).test(key)){
			wrap = fis.file.wrap(src[key]);
		}
	});
	if(!wrap){
		console.log("wrap file path is not correct! wrap:" + wrap);
	}

	var requires = [];
	//遍历所有模块文件
	for(var buf in com){
		var match,
			moduleName = buf.match(regs.jsfile)[2];//["/xxx/ddd.js", "/ddd.js", "ddd"]
		if(match = com[buf].getContent().match(regs.example)){
			var comments = match[0].replace(regs.example,'$1$5')
				.replace(/((\r|\n)\s*)(\*)/g, '$1')
				.replace(regs.enter, '\n');

			innerLeft += '<div data-mod="'+ moduleName +'">' + moduleName + '</div>';
			innerRightT += '<div data-mod="'+ moduleName +'">' + match[3] + '</div>';
			innerRightB += '<div data-mod="'+ moduleName +'">' 
				+ '<div >样例：<div>' + transToHtml(match[2].replace(regs.enter, '\n')) +'</div></div>'
				//去掉代码用例区域，去掉每一行之前的*符号
				+ '<div >其他：<div>' + transToHtml(comments) + '</div></div></div>';
			innerJs += match[4] + ";";

			//添加依赖
			var modN = buf.replace(regs.modName, '$1');
			//fis.log.notice('com[' + buf + '].requires:' + com[buf].requires)
			requires = requires.concat(modN);
			requires = requires.concat(com[buf].requires);
		}
	}

	//新加的组件可视化页面
	var content = wrap.getContent();
	// fis.log.notice('settings.moduleListInstead:' + settings.moduleListInstead);
	// fis.log.notice('innerLeft:' + innerLeft);
	// fis.log.notice(RegExp(settings.moduleListInstead).test(content.toString()));

	//最终写入
	content = content.replace(settings.moduleListInstead, innerLeft)
		.replace(settings.moduleViewInstead, innerRightT)
		.replace(settings.moduleCommentsInstead, innerRightB)
		.replace(settings.moduleJsInstead, innerJs);

	    // 派送事件
    var message = {
      file: wrap,
      content: content,
      newFile: newFile
    };
    fis.emit('pack:file', message);

	newFile.setContent(content);
	newFile.requires = requires;
	ret.src[newFile.subpath] = newFile;
	fis.compile(newFile);
}

