# fis3-prepackager-component-preview
fis3组件可视化插件

## 配置方式(每个配置选项都是必须的)

```js
fis.match('::package', {
    prepackager: fis.plugin('component-preview',{
        wrap: '/v_components/wrap.html',//组件可视化原型文件，用来包裹组件可视化代码
        url: '/v_components.html', //目标文件
        COMPath: '/common/module',//组件集合目录
        moduleListInstead: 'instead of modules',//使用模块列表节点替换当前文本
        moduleViewInstead: 'instead of view htmls',//使用模块视图列表节点替换当前文本
        moduleCommentsInstead: 'instead of commnets',//使用模块注释列表节点替换当前文本
        moduleJsInstead: 'instead of js',//使用js脚本节点替换当前文本
	moduleAttr: 'data-mod'//默认是data-mod;给每一个组件对应的节点添加上moduleAttr对应的属性，属性的值是就是模块的名称
    })
})
```
v_components.html为组件可视化生成的文件。最终在浏览器中打开该文件即可看到组件化效果 

wrap.html是用来包裹组件可视化代码的。需要的js、css需要自己去配置

wrap.html样例:(注意body内的字符串将会被组件可视化数据替换，对应就是moduleXXXInstead对应的字段)
```html 
<!DOCTYPE html>
<html>
<head>
    <title>组件可视化</title>
    <link rel="import" href="/common/html/meta.html?__inline">
    <link rel="stylesheet" type="text/css" href="/common/css/common.scss" />
    <link rel="stylesheet" type="text/css" href="v_components.css" />
    <script type="text/javascript" src="/common/dep/mod.js" data-loader></script>
    <script type="text/javascript" src="/common/dep/jquery.js" data-loader></script>
    <script type="text/javascript" src="/common/js/common.js" data-loader></script>
    <script type="text/javascript" src="v_components.js" data-loader></script>
</head>
<body>  
<div class="left-side">instead of modules</div>
<div class="right-side">
    <div class="right-side-top">instead of view htmls</div>
    <div class="right-side-bottom">instead of commnets</div>
</div>
<script type="text/javascript">instead of js</script>
</body>
</html>
```

## 注意：

组件文件中"@example"和"@example end"之间的字符串被认为是代码段：

	1）不要出现不符合代码格式的字符

	2)"html:"、"js:"分别为html代码段和js代码段开始的标志。其后的代码分别要严格按照html和js的格式要求书写

组件文件样例：

```js
define('common/module/rightsideBar/rightsideBar', function(require, exports, module) {
/**
 * @example
    html:
    <div class="js-rightsideBar"></div>

    js:
    var rightsideBar = require('/common/module/rightsideBar/rightsideBar.js');
    new rightsideBar($('.js-rightsideBar'));

    @example end

 * @author chua
 * @date 2016-5-9
 * @description 首页右侧导航栏组件，依赖模版 rightsideBar.tpl，rightsideBar.scss;

 * @实例化：rightsideBar = new rightsideBar(dom);
 * @param dom {Dom} 为头部组件父级节点，将根据情况append模版，生成头部节点；
 */

/*
 * @require './rightsideBar.scss';
 */

var tpl_rightsideBar = require('./rightsideBar.tpl');
function rightsideBar(cont) {
    this.cont = $(cont);
    this.cont.empty().append(tpl_rightsideBar());//render html
    this.cont.on('click', 'xxx', function() {//binding event
       ...
    });
};
return rightsideBar;
}
```

匹配demo代码段的正则为/\/\*\*([\s\S]*)@example[\s\S]*?html:([\s\S]*?)js:([\s\S]*?)@example end([\s|\S]*?)\*\//

## 规则：  
1.组件可视化会将所有的组件分成四个部分来保存，这四个部分我们分别取名Names,Htmls,Commnets,Jss;  
2.组件可视化插件会将每一个组件拆分为四个部分：模块名称节点、模块html代码节点、模块注释节点、js脚本代码段;这四个部分分别会累加到Names,Htmls,Commnets,Jss中  
eg:有一个组件注释为下面这个代码段  

```
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
```



组件可视化将一个组件解析注释拆解组成的四个部分分别是  
a1.模块名称节点  
	
```
<div data-mod="header">header</div>
```

a2.模块html代码节点  

```
<div data-mod="header">  
    <div class="js-header"></div>  
</div>
```

a3.模块注释节点
	
```
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
```

a4.js脚本代码段  

```
var Header = require('/common/module/header/header.js');
new Header($('.js-header')).init();
```


注意其中包裹节点都有一个data-mod属性，并且值是组件名称。这个属性名称是moduleAttr定义的

解析完所有的组件，四个部分分别是：  
Names = a1 + b1 + c1 + ...  
Htmls = a2 + b2 + c2 + ...  
Commnets = a3 + b3 + c3 + ...  
Jss = a4 + b4 + c4 + ...  

3.组件解析完成以后，  
Names会替换wrap指定的文件中moduleListInstead对应的字符串  
Htmls会替换wrap指定的文件中moduleViewInstead对应的字符串  
Commnets会替换wrap指定的文件中moduleCommentsInstead对应的字符串  
Jss会替换wrap指定的文件中moduleJsInstead对应的字符串  


完整的demo查看[fis3_component_preview_demo](https://github.com/chua1989/fis3_component_preview_demo).
