var mainController = controllers
		.controller(
				"MainCtrl",
				function($scope, $location, MyFamilyService,
						AuthenticationService) {

					/*
					 * Populate notifications: get all events about nodes or
					 * docs in this user view who are not already read by this
					 * user.
					 */
					function fillNotifications(callback) {

						var data = {
							nodes : $scope.graph.nodes
						};

						MyFamilyService
								.getEvents($scope.graph.userId, data)
								.then(
										function(events) {

											var newEventIds = events
													.filter(
															function(event) {
																return event.status != 1;
															}).map(
															function(item) {
																return item.id;
															});

											MyFamilyService
													.addNotifications(
															$scope.graph.userId,
															newEventIds)
													.then(
															function() {

																MyFamilyService
																		.getUnreadNotifications(
																				$scope.graph.userId)
																		.then(
																				function(
																						notifications) {

																					$scope.graph.notifications = notifications;

																					if (callback) {
																						callback();
																					}
																				});
															});
										});
					}

					/*
					 * Populate documents: get all documents visible by userId
					 * in the specified user view.
					 */
					function fillDocuments(callback) {

						var data = {
							nodes : $scope.graph.nodes
						};

						MyFamilyService.getViewDocuments($scope.graph.userId,
								data).then(function(documentsData) {

							$scope.graph.documents = documentsData;

							if (callback) {
								callback();
							}
						});
					}

					/*
					 * Populate graph: get all nodes and links visible by userId
					 * in the specified user view.
					 */
					function fillGraph(callback) {

						MyFamilyService.getGraphView($scope.graph.userId,
								$scope.graph.viewId).then(function(graphData) {

							$scope.graph.nodes = graphData.nodes;
							$scope.graph.links = graphData.links;

							if (callback) {
								callback();
							}
						});
					}

					$scope.initViews = function() {

						$scope.views = [ {
							id : 0,
							label : 'Family as a child'
						}, {
							id : 1,
							label : 'Family as a parent'
						}, {
							id : 2,
							label : 'Pedigree'
						}, {
							id : 3,
							label : 'Descendants'
						}, {
							id : 4,
							label : 'Extended family'
						} ];

						$scope.selectedView = $scope.views[4];
					};

					$scope.initD3Config = function() {

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

					$scope.drawGraph = function(callback) {

						fillGraph(function() {

							fillDocuments(function() {

								fillNotifications(function() {

									$scope.graphData = $scope.graph;

									if (callback) {
										callback();
									}
								});
							});
						});
					};

					$scope.updateView = function(view) {

						$scope.selectedView = view;
						$scope.drawGraph();
					};

					function resetData() {
					
						d3.select("svg").remove();
						$scope.graphData = null;
					};
					
					$scope.logout = function() {

						AuthenticationService.clearCredentials();
						resetData();
						
						$location.path('/login');
					};

					$scope.uploadNewDocument = function() {

						$('#uploadDocumentForm').attr('action',
								serverUrl + '/documents/upload');

						$('#uploadDocumentForm').submit();

						var filePath = $('#document-upload').val();

						fileName = filePath.substring(filePath
								.lastIndexOf("\\") + 1);

						MyFamilyService
								.addDocument(fileName, $scope.addTitle,
										$scope.addDate, $scope.taggedUsers,
										$scope.graph.userId)
								.then(
										function(addedDoc) {

											if (addedDoc) {

												$('#addDocumentModal').modal(
														'hide');

												// Display new document

												addedDoc.position = {
													x : $scope.svg.uploadedDocumentPosition[0],
													y : $scope.svg.uploadedDocumentPosition[1]
												};

												$scope.svg.uploadedDocumentPosition = [];

												MyFamilyService
														.updateDocumentPosition(
																addedDoc.id,
																$scope.taggedUsers[0]['id'],
																addedDoc.position.x,
																addedDoc.position.y);

												MyFamilyService
														.registerEvent(
																'document',
																addedDoc.id,
																'creation',
																$scope.taggedUsers[0]['id']);

												$scope.drawGraph();

											} else {
												console
														.log("Document not added!");
											}
										});
					};

					$scope.updateDocument = function() {

						$('#editDocumentModal').modal('hide');

						MyFamilyService.updateDocument($scope.editDocId,
								$scope.editTitle, $scope.editDate,
								$scope.taggedUsers).then(
								function() {

									if ($scope.taggedUsers
											.indexOf($scope.nodeId) > -1) {

										removeDocument($scope.docId);
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

					$scope.markAsRead = function(notification) {

						MyFamilyService.markNotificationAsRead(notification.id)
								.then(function() {

									$scope.drawGraph();
								});
					};
				});