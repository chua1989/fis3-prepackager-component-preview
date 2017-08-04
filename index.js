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
	moduleAttr: 'data-mod'//默认是data-mod;给每一个组件对应的节点添加上moduleAttr对应的属性，属性的值是就是模块的名称
}
demo代码匹配规则'example': /\/\*\*([\s\S]*)@example[\s\S]*?html:([\s\S]*?)js:([\s\S]*?)@example end([\s|\S]*?)\*\//

规则：
1.组件可视化会将所有的组件分成四个部分来保存，这四个部分我们分别取名Names,Htmls,Commnets,Jss;
2.组件可视化插件会将每一个组件拆分为四个部分：模块名称节点、模块html代码节点、模块注释节点、js脚本代码段;这四个部分分别会累加到Names,Htmls,Commnets,Jss中
eg:有一个组件注释为下面这个代码段
	 * @author '陈桦'
	 * @date '2017-3-22'
	 * @description h5头部导航栏，依赖模版 header.tpl，header.scss,Ajax
	 * @example
	    html:
	    <!-- 展示定期列表-->
	    <div class="js-header"></div>
	    
	    js:
	    var Header = require('/common/module/header/header.js');
	    new Header($('.js-header')).init();
	   @example end
	 * @return 无


组件可视化将一个组件解析注释拆解组成的四个部分分别是
a1.模块名称节点
	<div data-mod="header">header</div>
a2.模块html代码节点
	<div data-mod="header">
		<div class="js-header"></div>
	</div>
a3.模块注释节点
	<div data-mod="header">
		<div >样例：
			<div>
				html:
			    <!-- 展示定期列表-->
			    <div class="js-header"></div>
			    
			    js:
			    var Header = require('/common/module/header/header.js');
			    new Header($('.js-header')).init();
			</div>
		</div>
		<div >其他：
			<div>
				@author '陈桦'
	 			@date '2017-3-22'
	 			@description h5头部导航栏，依赖模版 header.tpl，header.scss,Ajax
				
				@return 无
 			</div>
 		</div>
 	</div>
a4.js脚本代码段
	var Header = require('/common/module/header/header.js');
	new Header($('.js-header')).init();

注意其中包裹节点都有一个data-mod属性，并且值是组件名称。这个属性名称是moduleAttr定义的

解析完所有的组件，四个部分分别是：
Names = a1 + b1 + c1 + ...
Htmls = a2 + b2 + c2 + ...
Commnets = a3 + b3 + c3 + ...
Jss = a4 + b4 + c4 + ...

3.组件解析完成以后，Names会替换wrap指定的文件中moduleListInstead对应的字符串
	Htmls会替换wrap指定的文件中moduleViewInstead对应的字符串
	Commnets会替换wrap指定的文件中moduleCommentsInstead对应的字符串
	Jss会替换wrap指定的文件中moduleJsInstead对应的字符串


*/
var path = require('path');
var fs = require('fs');
var regs = {
        //懒惰匹配到第一个*/
        'example': /\/\*\*([\s\S]*)@example[\s\S]*?(html:([\s\S]*?)js:([\s\S]*?))@example end([\s|\S]*?)\*\//, //懒惰匹配第一个*/
        'jsfile': /\S*(\/(\S+)*?\.js)$/,
        'modName': /\/(\S+\.js)/
    },
    innerItems = {},
    wrap;

//将str字符串转换成HTML格式
function transToHtml(str) {
    var tran = [/&/g, />/g, /</g, /\n/g, / /g], //先要处理'&'才能处理其他标签，否则其他标签生成的‘&’会被处理
        to = ['&amp;', '&gt;', '&lt;', '<br>', '&nbsp;'];
    for (var i = 0; i < tran.length; i++) {
        str = str.replace(tran[i], to[i]);
    }
    return str;
}

module.exports = function(ret, pack, settings, opt) {
    var src = ret.src, // 项目所有文件，key:文件路径，value:文件file对象
        com = {}, // 组件集合目录中所有的js文件,key：文件路径，value:文件file对象
        root = fis.project.getProjectPath(), // 项目根目录
        newFile = fis.file.wrap(path.join(root, settings.url)), //新文件
        innerLeft = '',
        innerRightTop = '',
        innerRightBottom = '',
        innerJs = '';

    // console.log('settings.wrap：' + settings.wrap, 'Object.keys(src)长度:' + Object.keys(src).length)
    Object.keys(src).forEach(function(key) {
        if (RegExp(settings.wrap).test(key)) {
            wrap = fis.file.wrap(src[key]);
        }

        if (RegExp(settings.COMPath).test(key) && /\.js$/.test(key)) {
            com[key] = src[key];
            // console.log('重新打包的文件路径', com[key]['origin'], '\n');
        }
    });

    if (!wrap) {
        console.log("wrap file path is not correct! wrap:" + wrap + ' wrappath:' + settings.wrap);
        return;
    }

    var requires = [];
    //遍历所有模块文件
    for (var buf in com) {
        var match,
            moduleName = buf.match(regs.jsfile)[2]; //["/xxx/ddd.js", "/ddd.js", "ddd"]

        if (match = com[buf].getContent().match(regs.example)) { //  提取模块中所有js文件中的符合提前约定的注释
            var comments = match[0].replace(regs.example, '$1$5')
                .replace(/((\r|\n)\s*)(\*)/g, '$1')
                .replace(regs.enter, '\n');

            settings.moduleAttr = settings.moduleAttr || 'data-mod';

            var id = com[buf].id;
            innerItems[id] = {
            	left: '<div ' + settings.moduleAttr + '="' + moduleName + '">' + moduleName + '</div>',
            	rightTop: '<div ' + settings.moduleAttr + '="' + moduleName + '">' + match[3] + '</div>',
            	rightBottom:'<div ' + settings.moduleAttr + '="' + moduleName + '">' +
                '<div >样例：<div>' + transToHtml(match[2].replace(regs.enter, '\n')) + '</div></div>'
                //去掉代码用例区域，去掉每一行之前的*符号
                +
                '<div >其他：<div>' + transToHtml(comments) + '</div></div></div>',
                js:'\ntry{' + match[4] + '}catch(err){console.log("in ' + settings.moduleAttr + ' js:" + err)};'

            };

            //添加依赖
            var modN = buf.replace(regs.modName, '$1');
            requires = requires.concat(modN);
            requires = requires.concat(com[buf].requires);
        }
    }

    Object.keys(innerItems).forEach(function(key) {
        innerLeft += innerItems[key]['left'];
        innerRightTop += innerItems[key].rightTop;
        innerRightBottom += innerItems[key].rightBottom;
        innerJs += innerItems[key].js;
    })

    //新加的组件可视化页面
    var content = wrap.getContent();
    //最终写入
    content = content.replace(settings.moduleListInstead, innerLeft)
        .replace(settings.moduleViewInstead, innerRightTop)
        .replace(settings.moduleCommentsInstead, innerRightBottom)
        .replace(settings.moduleJsInstead, innerJs);

    // 派送给打包事件
    var message = {
        file: wrap,
        content: content,
        newFile: newFile
    };

    fis.emit('pack:file', message);

    newFile.setContent(content); // 继续进行后续的parser
    newFile.requires = requires;
    ret.src[newFile.subpath] = newFile;

    fis.compile(newFile);

}