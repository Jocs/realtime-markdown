angular.module('realtime-markdown.service',[])
.provider('showdown', function(){
	var converter = new showdown.Converter();
	//默认设置不添加ID值
	converter.setOption('noHeaderId', true);
	this.setOption = function(key, value){
		converter.setOption(key, value);
	};

	this.$get = function(){
		return function(text){
			return converter.makeHtml(text);
		};
	};
})
.provider('socket', function(){
	var url = 'http://localhost:18080';
	var socket = io(url);
	this.$get = function(){
		return socket;
	}
})
.provider('CodeMirror', function(){
	var options = {
		value: '',
		lineNumbers: true, // lineNumbers：是是否显示行号。
		mode: "javascript", // mode：是高亮代码的语言
		keyMap: "sublime", // keyMap：快捷键类型
		autoCloseBrackets: true, // 自动补全括号
		matchBrackets: true, 
		showCursorWhenSelecting: true,
		theme: "base16-light",
		tabSize: 2 // tab键两个空格
	};
	this.setOption = function(key, value){
		if(options.hasOwnProperty(key)){
			options.key = value;
		}
	};
	this.$get = function(){
		return function(element){
			CodeMirror(function(ele){
				element.parentNode.replaceChild(ele, element);
			}, options);
		}
	};
})










