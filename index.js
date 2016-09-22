/**
要求组件js的名称即为组件名称。
settings = {
	wrap: 'xx/xx..html',//组件可视化原型文件，用来包裹组件可视化代码
	COMPath: 'xx/xxx',//组件集合目录
	COMListClass: 'xxx',//组件列样式class名称
	COMViewClass: 'xxx',//组件展示框class名称
	COMDetailClass: 'xxx', //组件详情展示框class名称
}
demo代码匹配规则'example': /\/\*\*([\s\S]*)@example[\s\S]*?html:([\s\S]*?)js:([\s\S]*?)@example end([\s|\S]*?)\*\//
*/
module.exports = function(ret, pack, settings, opt) {
	var src = ret.src;
	Object.keys(src).forEach(function(key){
		fis.log.notice(key + ' : ' + src[key]);
	})	
}