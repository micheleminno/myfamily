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

						MyFamilyService
								.getDocuments(userId, data)
								.then(
										function(documentsData) {

											documentsData.userId = $scope.userId;
											documentsData.userLabel = $scope.username;
											documentsData.viewId = $scope.selectedView.id;
											documentsData.viewLabel = $scope.selectedView.label;

											$scope.documentsData = documentsData;
										});
					}

					/*
					 * Populate graph: get all nodes and links visible by userId
					 * in the specified user view.
					 */
					function fillGraph(userId, viewId, callback) {

						MyFamilyService
								.getGraphView(userId, viewId)
								.then(
										function(graphData) {

											graphData.userId = $scope.userId;
											graphData.userLabel = $scope.username;
											graphData.viewId = $scope.selectedView.id;
											graphData.viewLabel = $scope.selectedView.label;

											$scope.graphData = graphData;

											callback();

										});
					}

					initD3Config = function() {

						var configurationData = {};

						configurationData.width = 1250;
						configurationData.height = 630;
						configurationData.streamHeight = 100;
						configurationData.streamWidth = 1600;
						configurationData.streamY = 1130;
						configurationData.streamX = 100;
						configurationData.docRowSize = 16;

						$scope.configurationData = configurationData;

						$scope.svg = {};
					};

					fillGraph($scope.userId, 4, function() {

						fillDocuments($scope.userId, $scope.graphData.nodes);
					});

					initViews($scope);
					initD3Config();

					$scope.updateView = function(view) {

						$scope.selectedView = view;
						fillGraph($scope.userId, view.id);
					};

					$scope.logout = function() {

						AuthenticationService.clearCredentials();
						$location.path('/login');
					};

					$scope.uploadNewDocument = function() {

						$('#uploadDocumentForm').attr('action',
								serverUrl + '/documents/upload');

						$('#uploadDocumentForm').submit();

						var filePath = $('#document-upload').val();
						fileName = filePath.substring(filePath
								.lastIndexOf("\\") + 1);

						var title = $('#title').val();
						var date = $('#date').val();

						var tagged = [];
						$('#add-taggedArea > li').each(function() {

							tagged.push(parseInt(this.id));
						});

						MyFamilyService
								.addDocument(fileName, title, date, tagged,
										$scope.userId)
								.then(
										function(addedDoc) {

											if (addedDoc) {

												$('#addDocumentModal').modal(
														'hide');

												// Display new document

												addedDoc.position = {
													x : $scope.configurationData.uploadedDocumentPosition[0],
													y : $scope.configurationData.uploadedDocumentPosition[1]
												};

												$scope.configurationData.uploadedDocumentPosition = [];

												// update position on db
												$
														.get(serverUrl
																+ '/documents/'
																+ addedDoc.id
																+ '/updatePosition?node='
																+ tagged[0]
																+ '&x='
																+ addedDoc.position.x
																+ '&y='
																+ addedDoc.position.y);

												// register event
												$
														.get(serverUrl
																+ '/events/add/document/'
																+ addedDoc.id
																+ "?type=creation&node="
																+ tagged[0]);

												fillDocuments(
														$scope.graphData.userId,
														$scope.graphData.nodes);

											} else {
												console
														.log("Document not added!");
											}
										});
					};

					$scope.addInTaggedUsers = function(taggableUser) {

						$scope.taggedUsers.push(taggableUser);

						var taggableUsersIds = $scope.taggableUsers
								.map(function(user) {
									return user.id;
								});

						var indexUserToRemove = taggableUsersIds
								.indexOf(taggableUser.id);

						if (indexUserToRemove > -1) {
							$scope.taggableUsers.splice(indexUserToRemove, 1);
						}
					};

					$scope.removeFromTaggedUsers = function(taggedUser) {

						var indexUserToInsert = 0;

						for (userIndex in $scope.taggableUsers) {

							if ($scope.taggableUsers[userIndex]['id'] > parseInt(taggedUser.id)) {

								indexUserToInsert = userIndex;
								break;
							}
						}

						$scope.taggableUsers.splice(indexUserToInsert, 0,
								taggedUser);

						var taggedUsersIds = $scope.taggedUsers.map(function(
								user) {
							return user.id;
						});

						var indexUserToRemove = taggedUsersIds
								.indexOf(taggedUser.id);

						if (indexUserToRemove > -1) {
							$scope.taggedUsers.splice(indexUserToRemove, 1);
						}
					};
				});