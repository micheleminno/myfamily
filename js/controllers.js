var controllers = angular.module('controllers', []);

var mainController = controllers
		.controller(
				"MainCtrl",
				function($scope, $location, MyFamilyService) {

					$scope.login = function() {

						MyFamilyService
								.getUser($scope.loggedUser.name)
								.then(
										function(namesakes) {

											if (namesakes.length > 0) {

												var userId = namesakes[0]['id'];

												MyFamilyService
														.getGraphView(userId, 4)
														.then(
																function(
																		graphView) {

																	graphView.userId = userId;
																	graphView.viewId = $scope.selectedView.id;
																	graphView.viewLabel = $scope.selectedView.label;
																	graphView.userLabel = $scope.loggedUser.name;
																	$scope.graphData = graphView;
																});

											} else if ($scope.isNewUser) {

												MyFamilyService
														.addUser(
																$scope.loggedUser.name)
														.then(
																function(userId) {

																	$scope.userId = userId;
																	MyFamilyService
																			.getGraphView(
																					userId,
																					4)
																			.then(
																					function(
																							graphView) {

																						$scope.graphData = graphView;
																					});
																});
											}

											$scope.showLogin = false;
										});
					};

					initViews($scope);

					$scope.updateView = function(view) {

						$scope.selectedView = view;

						MyFamilyService
								.getGraphView(userId, view.id)
								.then(
										function(graphView) {

											graphView.userId = userId;
											graphView.viewId = $scope.selectedView.id;
											graphView.userLabel = $scope.loggedUser.name;
											$scope.graphData = graphView;
										});
					};

				});

var loginController = controllers.controller("LoginCtrl", function($scope, dateFilter) {

	
	$scope.$watch('birthDate', function(date) {

		$scope.birthDate = dateFilter(date,
				'dd-MM-yyyy');
	});
});