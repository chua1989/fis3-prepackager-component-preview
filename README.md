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
        moduleJsInstead: 'instead of js'//使用js脚本节点替换当前文本
    })
})
```
v_components.html为组件可视化生成的文件。最终在浏览器中打开该文件即可看到组件化效果

wrap.html是用来包裹组件可视化代码的。需要的js、css需要自己去配置

## 注意：

组件文件中"@example"和"@example end"之间的字符串被认为是代码段：

	1）不要出现不符合代码格式的字符

	2)"html:"、"js:"分别为html代码段和js代码段开始的标志。其后的代码分别要严格按照html和js的格式要求书写



匹配demo代码段的正则为/\/\*\*([\s\S]*)@example[\s\S]*?html:([\s\S]*?)js:([\s\S]*?)@example end([\s|\S]*?)\*\//
