angular.module('realtime-markdown', ['realtime-markdown.service'])
.directive('contenteditable', function(){
	return {
		restrict : 'A',
		controller: contenteditableController,
		require :['contenteditable'],
		compile: function(element){
			//编译过程中，在div contenteditable中添加一个如下元素，保证第一个元素是元素节点。
			element.html('<div><br></div>');
			//编译阶段向document.body中添加一个input type='file'输入框，设置其不可见，用于后面图片的上传和显示
			replaceInput();

			return {
				pre : function(scope, element, attrs, ctrls){},
				post : postLinkFn
			}
		}
	}
});
var postLinkFn = function(scope, element, attrs, ctrls){
	var ctrl = ctrls[0];
	angular.element(element).bind('keyup', function(e){
		var text, html, 
		activeNode = getActiveElement();
    //如果用户所按键是换行符，并且element最后一个元素innerHTML 是 <br>那么，就需要转换格式
    if(e.keyCode === 13 && $(element)[0].lastChild.innerHTML == '<br>'){
    	var preToTransfor = activeNode.previousElementSibling,
    	prePreNode = preToTransfor && preToTransfor.previousElementSibling;

			// 如果最后一个元素有「md-dirty」的className，移除掉.'md-dirty'通常是换行自动生成的
			if(activeNode.nodeName !== 'OL' 
				&& activeNode.nodeName !== 'UL' 
				&& $(activeNode).hasClass('md-dirty')){
				if(activeNode.firstElementChild.tagName.toLowerCase() !== 'img'){
					$(activeNode).removeClass('md-dirty');
				}
			};
			
			// 第一个if主要是处理列表包括有序列表和无序列表。因为prePreNode已经有md-dirty className了
			// 因此不用在添加md-dirty className了。
			if((preToTransfor && /^\d\.\s/.test(preToTransfor.textContent) 
				&& prePreNode && prePreNode.nodeName == 'OL' )
				||(preToTransfor && /^[\*\-]{1}\s{1}/.test(preToTransfor.textContent) 
					&& prePreNode && prePreNode.nodeName == 'UL' )){

				text = preToTransfor.textContent;
				html = $(ctrl.makeHtml(text));
				$(prePreNode).append(html[0].firstElementChild);
				$(preToTransfor).remove();

			}  
			// 下面一个if用来处理代码块的。
			else if(preToTransfor && /^`{3}/.test(preToTransfor.textContent)){
				//将prePreNode替换为CodeMirror文本编辑器，并删除preToTransfor元素
				ctrl.CodeMirror(preToTransfor);
				var activeElement = getActiveElement();
				var CodeMirrorLines = activeElement.previousElementSibling.querySelector('textarea');
				activeElement.previousElementSibling.count = 0;
				CodeMirrorLines.focus();
			} 
			//下面一个if是用来处理除以上情况以外的按下回车，转化格式。
			else if(!/^CodeMirror/.test(activeNode.className )
				&& !$(preToTransfor).hasClass('md-dirty')){
				text = preToTransfor.textContent;
				html = $(ctrl.makeHtml(text));
				html.addClass('md-dirty');
				$(preToTransfor).replaceWith(html);
			};	
		}
		//当按下回车键时，如果是第一行，并且光标处在index = 0的位置，为了防止"<div><br></div>"
		//被删除，可以手动添加一个『<div><br></div>』,或者阻止默认事件发生。
		if(e.keyCode == 8 ){
			//保证第一个node，一定是元素节点
			if(!/\S+/.test(element.text()) && $(element)[0].getElementsByTagName('img').length == 0) {
				var range, userSelection;
				$(element)[0].innerHTML = '<div><br></div>';
				userSelection = window.getSelection();
				range = userSelection.createRange? userSelection.createRange(): userSelection.getRangeAt(0);
				range.setStartAfter($(element)[0].firstChild.firstChild);
				range.setEndAfter($(element)[0].firstChild.firstChild);
				userSelection.removeAllRanges();
				userSelection.addRange(range);
			};
			// 下面一个if主要用来处理按下回车键时，如果新的一行带有md-dirty className,就把md-dirty删除掉。保证了后面
			// 能够正常转换格式。
			if(!/\S+/.test(activeNode.textContent)){
				if($(activeNode).hasClass('md-dirty')){
					$(activeNode).removeClass('md-dirty');
				}
			};
			
			if(/^CodeMirror/.test(activeNode.className) && comfirmCodeMirrorEmpty()){
				console.log(activeNode.count);
				if(activeNode.hasOwnProperty('count') && activeNode.count == 1){
					var range, userSelection, focusElement;
					userSelection = window.getSelection();
					range = userSelection.createRange? userSelection.createRange(): userSelection.getRangeAt(0);
					focusElement = activeNode.nextElementSibling.firstChild;
					range.setStartBefore(focusElement);
					range.setEndBefore(focusElement);
					userSelection.removeAllRanges();
					userSelection.addRange(range);
					activeNode.parentNode.removeChild(activeNode);
					activeNode.count = 0;
				} else if(activeNode.hasOwnProperty('count')) {
					activeNode.count ++ ;
				}
			}
		};
		
	});
var lastCursorHeight;
angular.element(element).bind('keydown', function(e){
		var activeElement = getActiveElement(), userSelection = window.getSelection();
		if(e.keyCode !== 40 && /^CodeMirror/.test(activeElement.className)) {
			var lastCursor = activeElement.querySelector('.CodeMirror-cursor');
			lastCursorHeight = parseInt(lastCursor.style.top) + parseInt(lastCursor.style.height);
		}
		//如果现在光标是代码块最后一行，那么当按向下键时，跳到代码块下一行，如果没有下一行，先生成下一行。
		//再跳到下一行
		if(e.keyCode === 40 && /^CodeMirror/.test(activeElement.className)){
			//如果pre是最后一个元素，那么就向pre后面添加一个换行元素。
			if(!activeElement.nextElementSibling){
				$(element)[0].appendChild(getBrElement());
			}
			var cursor = activeElement.querySelector('.CodeMirror-cursor');
		  var cursorHeight = parseInt(cursor.style.top) + parseInt(cursor.style.height);
		  if(cursorHeight == lastCursorHeight) {
		  	var range;
				range = userSelection.createRange? userSelection.createRange(): userSelection.getRangeAt(0);
				range.setStartAfter(activeElement.nextElementSibling.firstChild);
				range.setEndAfter(activeElement.nextElementSibling.firstChild);
				userSelection.removeAllRanges();
				userSelection.addRange(range);
		  } else {
		  	lastCursorHeight = cursorHeight;
		  }
		};
		//按向上方向键，并且previousElement是CodeMirror元素，那么，阻止默认事件发生，并使得CodeMirror获得焦点
		if(e.keyCode === 38 
			&& activeElement.previousElementSibling
			&& /^CodeMirror/.test(activeElement.previousElementSibling.className)){
			e.preventDefault();
			activeElement.previousElementSibling.querySelector('textarea').focus();
		}
		//按向左方向键和BackSpace键时，如果focusOffset为0.就阻止默认行为发生，并使得CodeMirror获取焦点
		if((e.keyCode === 37 || e.keyCode === 8 ) 
			&& activeElement.previousElementSibling
			&& /^CodeMirror/.test(activeElement.previousElementSibling.className)){
			var offset = userSelection.focusOffset;
			if(offset == 0) {
				e.preventDefault();
				activeElement.previousElementSibling.querySelector('textarea').focus();
			}
		}
		//图片上传input输入框的显示
		if(e.target.hasAttribute('contenteditable') && e.ctrlKey == true && e.keyCode == 73){
			var input = document.querySelector('.md-hiddenInput');
			input.click();
		}
	});

document.addEventListener('drop', function(e){
	e.preventDefault();
	if(confirmInEditor(e.target)){
		var files = e.dataTransfer.files;
		Array.prototype.forEach.call(files, function(file){
			ctrl.sendImage(file);
			ctrl.readFile(file).then(function( url ){
				var img = document.createElement('img');
				var div = document.createElement('div');
				img.src = url;
				img.title = file.name.split(/\.(?=png|jpg)/)[0];
				div.className = 'md-dirty';
				div.appendChild(img);
				img.addEventListener('load', function(){
					if(e.target.hasAttribute('contenteditable')){
						e.target.insertBefore(div, e.target.lastElementChild);
					} else {
						var activeTargetElement = getTargetElement(e.target);
						activeTargetElement.parentNode.insertBefore(div, activeTargetElement);
					}

				});
			});
		});
		replaceInput();
	};
});
	//支持直接input type=file显示和发送图片
	document.addEventListener('change', function(e){
		if(e.target.getAttribute('type') == 'file' && e.target.className == 'md-hiddenInput'){
			var input = e.target;
			var files = input.files;
			Array.prototype.forEach.call(files, function(file){
				ctrl.sendImage(file);
				ctrl.readFile(file).then(function(url){
					var img = document.createElement('img');
					var div = document.createElement('div');
					img.src = url;
					img.title = file.name.split(/\.(?=png|jpg)/)[0];
					div.className = 'md-dirty';
					div.appendChild(img);
					img.addEventListener('load', function(){
						$(element)[0].insertBefore(div, $(element)[0].lastElementChild);
					});
				});
			});
		}
		replaceInput();
	});
	//增加md-url属性
	ctrl.resImageUpload(function(data){
		if(data.hasOwnProperty('error')) console.log(data.error);
		else {
			var imgs = $(element)[0].querySelectorAll('img');
			Array.prototype.forEach.call(imgs, function(img){
				if(img.getAttribute('title') == data.title){
					img.setAttribute('md-url', data.path);
				};
			});
		};
	});
	// 发送输入框中的html。
	var timer = null;
	$(element).bind('keyup', function(){
		if(timer) clearTimeout(timer);
		timer = setTimeout(function(){
			ctrl.sendArticle($(element)[0].innerHTML);
		}, 300);
	});
	//下面是markdown格式高亮显示
	var HEADER_RPG      = /(^#{1,6})(?=[^#])/g,
	QUOTE_RPG           = /(^|[^\\])(`)([^`]+)(`)(?=[^`])/g,
	LINK_BRACKET_RPG    = /(^|[^\\])(\[)([^\[\]]*)(\]\()([^\(\)]*)(\))(?=[^\)])/g,
	PICTURE_BRACKET_RPG = /(^|[^\\])(\!\[)([^\[\]]*)(\]\()([^\(\)]*)(\))(?=[^\)])/g,
	EM_RPG              = /(^|[^\\\*])([*]{1})([^*]+)(\2)(?=[^\*])/g,
	STRONG_RPG          = /(^|[^\\])([*]{2})([^*]+)(\2)(?=[^\*])/g,
	DISORDER_RPG        = /(^[*-]\s)(?=[^\s])/g,
	ORDER_RPG           = /(^\d\.\s)(?=[^\s])/g,
	ESC_RPG             = /(\\)(?!\\)/g,
	KAN_JI_RPG          = /(<\/span\>)([^\u4e00-\u9fa5]+)([\u4e00-\u9fa5]+)$/g;

	function testText(text){
		return !!(
			HEADER_RPG.test(text) 
			|| QUOTE_RPG.test(text)
			|| LINK_BRACKET_RPG.test(text)
			|| PICTURE_BRACKET_RPG.test(text)
			|| EM_RPG.test(text)
			|| STRONG_RPG.test(text)
			|| DISORDER_RPG.test(text)
			|| ORDER_RPG.test(text)
			|| ESC_RPG.test(text)
			)
	}

	$(element)[0].addEventListener('textInput', function(e){
		var activeElement = getActiveElement(), _text;
		var promise = new Promise(function(resolve, reject){
			setTimeout(function(){
				var text = activeElement.textContent || activeElement.nodeValue;
				resolve(text);
			}, 0);
		});

		var userSelection = window.getSelection();
		var focusNodeValue = userSelection.focusNode.nodeValue;
				//
				if(userSelection.focusNode.parentNode.classList.contains('rt-grey')
					&& /`|\*|\)|\]|#|\s|\(|\[/.test(userSelection.focusNode.nodeValue)){
					var range = document.createRange();
				var offset = userSelection.focusOffset;
				var node = userSelection.focusNode.parentNode;
				var textNode = document.createTextNode(userSelection.focusNode.nodeValue);
				node.parentNode.insertBefore(textNode, node);
				node.parentNode.removeChild(node);

				range.setStart(textNode, offset);
				range.setEnd(textNode, offset);
				range.collapse(true);
				userSelection.removeAllRanges();
				userSelection.addRange(range);
			}

		if(testText(focusNodeValue) 
			&& userSelection.focusNode.parentNode.parentNode.hasAttribute('contenteditable')){
			promise.then(function(text){
				_text = text.replace(HEADER_RPG, '<span class="rt-grey">$1</span>')
				.replace(QUOTE_RPG, '$1<span class="rt-grey">$2</span>' +
						'<code>$3</code><span class="rt-grey">$4</span>')
				.replace(LINK_BRACKET_RPG, '$1<span class="rt-grey">$2</span>'+
						'<span class="rt-link">$3</span>' + 
						'<span class="rt-grey">$4</span>' +
						'<span class="rt-link">$5</span>' +
						'<span class="rt-grey">$6</span>')
				.replace(PICTURE_BRACKET_RPG, '$1<span class="rt-grey">$2</span>'+
						'<span class="rt-link">$3</span>' + 
						'<span class="rt-grey">$4</span>' +
						'<span class="rt-link">$5</span>' +
						'<span class="rt-grey">$6</span>')
				.replace(STRONG_RPG, '$1<span class="rt-grey">$2</span>'+
						'<strong>$3</strong>' + 
						'<span class="rt-grey">$4</span>')
				.replace(EM_RPG, '$1<span class="rt-grey">$2</span>'+
						'<em>$3</em>' + 
						'<span class="rt-grey">$4</span>')
				.replace(DISORDER_RPG, '<span class="rt-grey">$1</span>')
				.replace(ORDER_RPG, '<span class="rt-grey">$1</span>')
				.replace(ESC_RPG, '<span class="rt-grey">$1</span>');

				var range = document.createRange(),
				lastOffset = getLastOffset();

				activeElement.innerHTML = _text;

				findCurrentNode(range, activeElement, lastOffset);
			});

			function getLastOffset(){
				var count = 0;
				var focusNode = userSelection.focusNode;
				while(focusNode.previousSibling){
					focusNode = focusNode.previousSibling;
					var plus = focusNode.textContent? 
					focusNode.textContent.length : focusNode.nodeValue.length;
					count += plus;
				}
				return userSelection.focusOffset + count;
			}

			function findCurrentNode(range, element, offset){
				var count = 0, childNodes = element.childNodes;
				for(var i = 0; i < childNodes.length; i ++){
					count += childNodes[i].textContent.length;
					if(count >= offset) {
						count -= childNodes[i].textContent.length;
						break;
					}
				}						
				var pos = { position: i, offset: offset - count };

				var currentActiveNode = element.childNodes[pos.position]|| element.lastChild;

				range.setStart(currentActiveNode, pos.offset );
				range.setEnd(currentActiveNode, pos.offset );
				range.collapse(true);
				userSelection.removeAllRanges();
				userSelection.addRange(range);
			}
		}
	});
/**
 * [comfirmCodeMirrorEmpty 用于判断CodeMirror是否为空]
 * @return {[Boolean]} [为空返回true， 不为空返回false]
 */
	function comfirmCodeMirrorEmpty(){
		var activeElement = getActiveElement();
		var code = activeElement.querySelector('.CodeMirror-code');
		var codeCounts = code.children.length;
		var text = code.firstElementChild.querySelector('.CodeMirror-line').textContent;
		// /\u200b/匹配零宽空格
		return codeCounts == 1 && /\u200b/.test(text);
	}
	/**
	 * [getActiveElement 用来获取focusNode 所在 contenteditable 的子元素。也就是说activeElement是focusNode
	 * 或者包含focusNode，并且activeNode是div contenteditable的子元素]
	 * @return {[elementNode]} [返回activeElement]
	 */
	 function getActiveElement(){
	 	var activeElement = document.getSelection().focusNode;
	 	while(activeElement 
	 		&& activeElement.parentNode.hasAttribute 
	 		&& !activeElement.parentNode.hasAttribute('contenteditable')){
	 		activeElement = activeElement.parentNode;
	 }
	 return activeElement;
	}
	/**
	 * [getBrElement 用来生成一个仅包含一个<br>元素的div元素]
	 * @return {[elementNdoe]} [返回这个div]
	 */
	 function getBrElement(){
	 	var div = document.createElement('div'),
	 	br = document.createElement('br');
	 	div.appendChild(br);
	 	return div;
	 }
	/**
	 * [confirmInEditor 用于判断元素是否在div contenteditable元素内]
	 * @param  {[elementNdoe]} element [需要判断的元素]
	 * @return {[Boolean]}         [返回一个布尔值，包含包含返回true，不包含返回false]
	 */
	 function confirmInEditor(element){
	 	var result = false;
	 	do{
	 		if(element.hasAttribute('contenteditable')){
	 			result = true;
	 			break;
	 		}
	 	} while (element = element.parentNode);
	 	return result;
	 };
	/**
	 * [getTargetElement 用来获取e.target所在的div contenteditable子元素]
	 */
	 function getTargetElement(element){
	 	var ele = element;
	 	while(ele.parentNode && !ele.parentNode.hasAttribute('contenteditable')){
	 		ele = ele.parentNode;
	 	}
	 	return ele;
	 }
	};
//contenteditableControllerk控制器
var contenteditableController = ['showdown', 'socket', 'CodeMirror', function(showdown, socket, CodeMirror){
	//CodeMirror方法作用是将element替换为CodeMirror富文本编辑器
	this.CodeMirror = function( element ) {
		CodeMirror(element);
	};
	this.makeHtml = function(text){
		return showdown(text);
	};
	this.readFile = function(file){
		var reader = new FileReader();
		reader.readAsDataURL(file);
		var promise = new Promise(function(resolve, reject){
			reader.addEventListener('load', function(e){
				resolve(e.target.result);
			});
		});
		return promise;
	};
	this.sendImage = function(file){
		var data = {
			type : file.type,
			name : file.name,
			file : file
		};
		socket.emit('uploadImage', data);
	};
	this.resImageUpload = function(fn){
		socket.on('resImageUpload', fn);
	};
	//sendArticle将img的src替换为md-url值。
	this.sendArticle = function(html){
		var div = document.createElement('div');
		div.innerHTML = html;
		var imgs = div.querySelectorAll('img');
		Array.prototype.forEach.call(imgs, function(img){
			if(img.hasAttribute('md-url')){
				var url = img.getAttribute('md-url');
				img.setAttribute('src', url);
			}
		});
		var _html = div.innerHTML;
		socket.emit('uploadArticle', {html: _html});
	};
}];

/**
* [replaceInput 用来生成或替换现有的'.md-hiddenInput'输入框，保证了input输入框files为空]
*/
function replaceInput(){
//删除所有md-hiddenInput输入框
	var inputs = document.querySelectorAll('.md-hiddenInput');
	if(inputs.length !== 0){
		Array.prototype.forEach.call(inputs, function(input){
			input.parentNode.removeChild(input);
		});
	};
		//添加新的unvisibleInput元素
	var unvisibleInput              = document.createElement('input');
	unvisibleInput.style.visibility = "hidden";
	unvisibleInput.style.position   = "absolute";
	unvisibleInput.style.top        = "0";
	unvisibleInput.style.left       = "0";
	unvisibleInput.style.height     = "0";
	unvisibleInput.style.width      = "0";
	unvisibleInput.className        = 'md-hiddenInput';
	unvisibleInput.setAttribute('type', 'file');
	document.body.appendChild(unvisibleInput);
}








