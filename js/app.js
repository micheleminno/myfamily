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

app.directive('d3Tree', [ '$window', '$rootScope', 'MyFamilyService',
		function($window, $rootScope, MyFamilyService) {

			return {

				restrict : 'A',

				scope : {
					graph : '=',
					documents : '=',
					notifications : '='
				},
				link : function(scope, element, attrs) {

					scope.server = MyFamilyService;

					scope.$watch('graph', function(newVals, oldVals) {

						return scope.renderGraph(scope, $rootScope);

					}, true);

					scope.$watch('documents', function(newVals, oldVals) {

						return scope.renderDocuments(scope, $rootScope);

					}, true);

					scope.$watch('notifications', function(newVals, oldVals) {

						return scope.renderNotifications(scope, $rootScope);

					}, true);

					window.onresize = function() {

						scope.$apply();
					};

					scope.$watch(function() {

						return angular.element($window)[0].innerWidth;

					}, function() {

						scope.renderGraph(scope, $rootScope);
					});

					scope.renderGraph = graphRender;
					scope.renderDocuments = documentsRender;
					scope.renderNotifications = notificationsRender;
				}
			};

		} ]);
