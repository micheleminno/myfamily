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
					function fillDocuments(userId, nodes, callback) {

						var data = {
							nodes : nodes
						};

						MyFamilyService.getViewDocuments(userId, data).then(
								function(documentsData) {

									$scope.graph.documents = documentsData;
									$scope.graphData = $scope.graph;

									if (callback) {
										callback();
									}
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

											$scope.graph = graphData;

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

					$scope.drawGraph = function(userId, viewId, callback) {

						fillGraph(userId, viewId, function() {

							fillDocuments($scope.userId, $scope.graph.nodes,
									function() {

										if (callback) {
											callback();
										}
									});
						});
					};

					$scope.updateView = function(view) {

						$scope.selectedView = view;
						$scope.drawGraph($scope.userId, view.id);
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

						MyFamilyService
								.addDocument(fileName, $scope.addTitle,
										$scope.addDate, $scope.taggedUsers,
										$scope.userId)
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
																tagged[0],
																addedDoc.position.x,
																addedDoc.position.y);

												MyFamilyService.registerEvent(
														'document',
														addedDoc.id,
														'creation', tagged[0]);

												fillDocuments(
														$scope.graphData.userId,
														$scope.graphData.nodes);

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
				});