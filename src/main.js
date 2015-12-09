angular.module('test', ['realtime-markdown', 'ngSanitize'])
.controller('MainController', function($scope, socket){
	$scope.html = '';
	socket.on('ArticleRes', function(data){
		$scope.html = data.html;
		$scope.$digest();
	});
})