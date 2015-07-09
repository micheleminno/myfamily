var app = angular.module('main', [ 'ngRoute', 'controllers',
		'ui.bootstrap.datetimepicker', 'ngMessages' ]);

var controllers = angular.module('controllers', [ 'user-services' ]);

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
		templateUrl : 'html/tree.html',
		controller : 'MainCtrl',
		requireLogin : true
	},
	'/error' : {
		templateUrl : 'html/error.html',
		controller : 'ErrorCtrl',
		requireLogin : false
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
				'AuthenticationService',
				function($location, $rootScope, AuthenticationService) {

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

							} else {

								console.warn("Logged user can't access "
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

app.directive("compareTo", function() {

	return {
		require : "ngModel",
		scope : {
			otherModelValue : "=compareTo"
		},
		link : function(scope, element, attributes, ngModel) {

			ngModel.$validators.compareTo = function(modelValue) {

				return modelValue == scope.otherModelValue;
			};

			scope.$watch("otherModelValue", function() {

				ngModel.$validate();
			});
		}
	};
});

app.directive('d3Tree', [ '$window', 'MyFamilyService',
		function($window, MyFamilyService) {

			return {

				restrict : 'A',

				scope : {
					data : '='
				},
				link : function(scope, element, attrs) {

					scope.$watch('data', function(newVals, oldVals) {

						return scope.render(newVals);

					}, true);

					window.onresize = function() {
						scope.$apply();
					};

					scope.$watch(function() {

						return angular.element($window)[0].innerWidth;

					}, function() {

						scope.render(scope.data);
					});

					scope.render = treeRender;
				}
			};

		} ]);
