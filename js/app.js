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
	'/profile' : {
		templateUrl : 'html/profile.html',
		controller : 'ProfileCtrl',
		requireLogin : true
	},
	'/settings' : {
		templateUrl : 'html/settings.html',
		controller : 'SettingsCtrl',
		requireLogin : true
	},
	'/explore' : {
		templateUrl : 'html/explore.html',
		controller : 'ExploreCtrl',
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

							} else {

								$location.path();
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

app.directive('prettyp', function() {

	return function(scope, element, attrs) {
		$("[rel^='prettyPhoto']").prettyPhoto({
			deeplinking : false,
			social_tools : false
		});
	};
});

app
		.directive(
				'd3Tree',
				[
						'$window',
						'MyFamilyService',
						'AuthenticationService',
						function($window, MyFamilyService,
								AuthenticationService) {

							return {

								restrict : 'A',

								scope : false,

								controller : 'MainCtrl',

								link : function(scope, element, attrs) {

									scope.initViews();
									scope.initEventTypes();
									
									scope.graph = {};
									scope.graph.view = scope.views[4];

									scope.graph.user = {};
									scope.graph.user.id = AuthenticationService
											.getUserId();
									scope.graph.user.label = AuthenticationService
											.getUsername();

									scope.initD3Config();
									scope.drawGraph();

									var interestingEntities = "[graphData.nodes + "
											+ "graphData.blacklist.blacklistedNodes + "
											+ "graphData.blacklist.blacklistingUsers + "
											+ "graphData.documents + "
											+ "graphData.selectedNode.documents + "
											+ "graphData.selectedDocument + "
											+ "graphData.selectedDocument.title + "
											+ "graphData.selectedDocument.date + "
											+ "graphData.selectedDocument.taggedNodes + "
											+ "graphData.notifications + "
											+ "graphData.resetPositions]";

									scope
											.$watchCollection(
													interestingEntities,
													function(newValue, oldValue) {

														return scope
																.renderGraph(
																		scope,
																		scope.graphData,
																		scope.configurationData,
																		MyFamilyService,
																		scope.svg);

													}, false);

									window.onresize = function() {

										scope.$apply();
									};

									scope.renderGraph = graphRender;
								}
							};

						} ]);
