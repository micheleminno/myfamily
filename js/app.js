var app = angular.module('main', [ 'ngRoute', 'controllers',
		'ui.bootstrap.datetimepicker' ]);

window.routes = {

	'/' : {
		templateUrl : 'html/login.html',
		controller : 'LoginCtrl',
		requireLogin : false
	},
	'/login' : {
		templateUrl : 'html/login.html',
		controller : 'LoginCtrl',
		requireLogin : false
	},
	'/home' : {
		templateUrl : 'html/home.html',
		controller : 'HomeCtrl',
		requireLogin : true
	}
};

app.config(
		[ '$routeProvider', '$locationProvider', '$httpProvider',
				function($routeProvider, $locationProvider, $httpProvider) {

					for ( var path in window.routes) {
						$routeProvider.when(path, window.routes[path]);
					}

				} ]).run(
		[
				'$location',
				'$rootScope',
				function($location, $rootScope) {

					$rootScope.debug = false;
					$rootScope.isLogging = false;

					$rootScope.$on("$routeChangeSuccess", function(event, next,
							current) {

						// checks if login is required on next page
						if (next.$$route.requireLogin) {
							if (!AuthenticationService.isLoggedIn()) {
								$location.path("/login");
							} else if ($location.path() === "/home") {
								$location.path("/home");
							} else if (SessionService.canAccess($location
									.path())) {
								$location.path();
							} else {
								console.warn("logged in user cant access "
										+ $location.path());
								$location.path("/home");
							}
						}
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

app.directive('d3Tree', [ '$window', '$timeout', function($window, $timeout) {

	return {

		restrict : 'A',

		scope : {
			data : '='
		},
		link : function(scope, element, attrs) {

			// watch for data changes and re-render
			scope.$watch('data', function(newVals, oldVals) {
				return scope.render(newVals);
			}, true);

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

		}
	};

} ]);
