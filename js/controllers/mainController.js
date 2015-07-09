var mainController = controllers
		.controller(
				"MainCtrl",
				function($scope, $location, MyFamilyService,
						AuthenticationService) {

					$scope.username = AuthenticationService.getUsername();
					$scope.userId = AuthenticationService.getUserId();

					/*
					 * Populate notifications: get all events about nodes or
					 * docs in this user view who are not already read by this
					 * user.
					 */
					function fillNotifications(events, graphView) {

						$scope.graphData.events = events;

						$scope.notifications = [];

						$.each(events, function(i, item) {

							var label = item.description + " of "
									+ item.entity_type + " " + item.entity
									+ " on " + item.date;

							$scope.notifications.push({
								label : label
							});

						});
					}

					/*
					 * Populate documents: get all documents visible by userId
					 * in the specified user view.
					 */
					function fillDocuments(userId, nodes) {

						var data = {
							nodes : nodes
						};

						MyFamilyService.getDocuments(userId, data).then(
								function(documents) {

									$scope.graphData.documents = documents;
								});
					}

					function fillGraphView(userId, viewId) {

						MyFamilyService
								.getGraphView(userId, viewId)
								.then(
										function(graphView) {

											var data = {
												nodes : graphView.nodes
											};

											MyFamilyService
													.getNotifications(userId,
															data)
													.then(
															function(events) {

																graphView.userId = $scope.userId;
																graphView.userLabel = $scope.username;
																graphView.viewId = $scope.selectedView.id;
																graphView.viewLabel = $scope.selectedView.label;

																$scope.graphData = graphView;

																fillNotifications(events);

																fillDocuments(
																		graphView.userId,
																		graphView.nodes);
															});
										});

					}

					fillGraphView($scope.userId, 4);

					initViews($scope);

					$scope.updateView = function(view) {

						$scope.selectedView = view;
						fillGraphView($scope.userId, view.id);
					};

					$scope.logout = function() {

						AuthenticationService.clearCredentials();
						$location.path('/login');
					};

				});