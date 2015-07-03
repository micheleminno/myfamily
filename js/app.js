var app = angular.module('main', [ 'ngRoute', 'd3', 'controllers' ]);

app.config([ '$routeProvider', function($routeProvider) {

	$routeProvider.when('/', {
		templateUrl : 'tree.html',
		controller : 'MainCtrl'
	}).when('/explore', {
		templateUrl : 'explore.html',
		controller : 'ExploreCtrl'
	}).otherwise({
		redirectTo : '/'
	});

} ]);

app.directive('ngEnter', function() {
	return function(scope, element, attrs) {
		element.bind("keydown keypress", function(event) {
			if (event.which === 13) {
				scope.$apply(function() {
					scope.$eval(attrs.ngEnter);
				});

				event.preventDefault();
			}
		});
	};
});

app.directive('d3Tree', [ '$window', '$timeout', 'd3Service',
		function($window, $timeout, d3Service) {

			return {

				restrict : 'A',

				scope : {},
				link : function(scope, element, attrs) {

					d3Service.d3().then(function(d3) {

						// Browser onresize
						// event
						window.onresize = function() {
							scope.$apply();
						};

						// Watch for resize
						// event
						scope.$watch(function() {
							return angular.element($window)[0].innerWidth;
						}, function() {
							
							scope.render(scope.data);
						});
						
						scope.render = treeRender;
					});
				}
			};

		} ]);
