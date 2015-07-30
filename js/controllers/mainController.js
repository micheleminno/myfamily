var mainController = controllers
		.controller(
				"MainCtrl",
				function($scope, $location, dateFilter, MyFamilyService,
						AuthenticationService) {

					d3.select("svg").attr("opacity", 1);

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
								.getEvents(data)
								.then(
										function(events) {

											var newEventIds = events
													.filter(
															function(event) {
																return event.status != 1
																		&& event.node != $scope.graph.user.id;
															}).map(
															function(item) {
																return item.id;
															});

											MyFamilyService
													.addNotifications(
															$scope.graph.user.id,
															newEventIds)
													.then(
															function() {

																MyFamilyService
																		.getUnreadNotifications(
																				$scope.graph.user.id)
																		.then(
																				function(
																						resultData) {

																					$scope.graph.notifications = resultData;

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
					function fillDocuments(sameDocuments, callback) {

						if (sameDocuments && callback) {

							callback();
						}

						var data = {
							nodes : $scope.graph.nodes
						};

						MyFamilyService.getViewDocuments($scope.graph.user.id,
								data).then(function(resultData) {

							$scope.graph.documents = resultData;

							if (callback) {
								callback();
							}
						});
					}

					function loadBlacklists(callback) {

						var blacklist = {};

						MyFamilyService
								.getBlacklistedNodes($scope.graph.user.id)
								.then(
										function(blacklisted) {

											blacklist.blacklistedNodes = blacklisted;

											MyFamilyService
													.getBlacklistingUsers(
															$scope.graph.user.id)
													.then(
															function(
																	blacklisting) {

																blacklist.blacklistingUsers = blacklisting;
																$scope.graph.blacklist = blacklist;

																if (callback) {

																	callback();
																}
															});

										});
					}

					/*
					 * Populate graph: get all nodes and links visible by userId
					 * in the specified user view.
					 */
					function fillGraph(sameGraph, callback) {

						if (sameGraph && callback) {

							callback();
						}

						MyFamilyService.getGraphView($scope.graph.user.id,
								$scope.graph.view.id).then(
								function(resultData) {

									$scope.graph.nodes = resultData.nodes;
									$scope.graph.links = resultData.links;

									loadBlacklists(callback);
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

					$scope.drawGraph = function(sameGraph, sameDocuments) {

						fillGraph(sameGraph, function() {

							fillDocuments(sameDocuments, function() {

								fillNotifications(function() {

									$scope.graphData = $scope.graph;
								});
							});
						});
					};

					$scope.updateView = function(view) {

						$scope.graph.view = view;
						$scope.drawGraph();
					};

					function resetData() {

						d3.select("svg").remove();
						$scope.graphData = null;
					}

					$scope.logout = function() {

						AuthenticationService.clearCredentials();
						resetData();

						$location.path('/login');
					};

					$scope.uploadNewDocument = function() {

						$('#uploadDocumentForm').attr(
								'action',
								MyFamilyService.getServerUrl()
										+ '/documents/upload');

						$('#uploadDocumentForm').submit();

						var filePath = $('#document-upload').val();

						fileName = filePath.substring(filePath
								.lastIndexOf("\\") + 1);

						MyFamilyService
								.addDocument(fileName, $scope.addTitle,
										$scope.addDate, $scope.taggedUsers,
										$scope.graph.user.id)
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

												MyFamilyService.addToBlacklist(
														$scope.graph.user.id,
														$scope.excludedUsers,
														addedDoc.id);

												MyFamilyService
														.registerEvent(
																'document',
																addedDoc.id,
																'creation',
																$scope.taggedUsers[0]['id']);

												$scope.drawGraph(true, false);

											} else {
												console
														.log("Document not added!");
											}
										});
					};

					$scope.updateDocument = function() {

						$('#editDocumentModal').modal('hide');

						MyFamilyService
								.updateDocument($scope.editDocId,
										$scope.editTitle, $scope.editDate,
										$scope.taggedUsers)
								.then(
										function() {

											MyFamilyService.updateBlacklist(
													$scope.graph.user.id,
													$scope.excludedUsers,
													addedDoc.id);

											if ($scope.taggedUsers
													.indexOf($scope.graphData.selectedNode.id) == -1) {

												$scope.graphData.selectedNode.documents
														.splice(
																$scope.editDocId,
																1);
											}
										});
					};

					$scope.editDateConfig = {
						dropdownSelector : '.edit-date-toggle-select',
						startView : 'year',
						minView : 'day'
					};

					$scope.addDateConfig = {
						dropdownSelector : '.add-date-toggle-select',
						startView : 'year',
						minView : 'day'
					};

					$scope.$watch('editDate', function(date) {

						$scope.editDate = dateFilter(date, 'dd/MM/yyyy');
					});

					$scope.$watch('addDate', function(date) {

						$scope.addDate = dateFilter(date, 'dd/MM/yyyy');
					});

					$scope.addInUsers = function(users, removeFromUsers, user) {

						users.push(user);

						var removeFromUsersIds = removeFromUsers
								.map(function(u) {
									return u.id;
								});

						var indexUserToRemove = removeFromUsersIds
								.indexOf(user.id);

						if (indexUserToRemove > -1) {
							removeFromUsers.splice(indexUserToRemove, 1);
						}
					};

					$scope.removeFromUsers = function(users, addToUsers, user) {

						var indexUserToInsert = 0;

						for (userIndex in addToUsers) {

							if (addToUsers[userIndex]['id'] > parseInt(user.id)) {

								indexUserToInsert = userIndex;
								break;
							}
						}

						addToUsers.splice(indexUserToInsert, 0, user);

						var usersIds = users.map(function(u) {
							return u.id;
						});

						var indexUserToRemove = usersIds.indexOf(user.id);

						if (indexUserToRemove > -1) {
							users.splice(indexUserToRemove, 1);
						}
					};

					$scope.showNotificationObject = function(notification) {

						var documentUrl = MyFamilyService
								.getFilePath(notification.file);

						$scope.graphData.selectedDocument = {
							url : documentUrl,
							title : notification.docTitle,
							date : notification.date
						};

						MyFamilyService.markNotificationAsRead(
								$scope.graph.user.id, notification.eventId)
								.then(function() {

									$scope.drawGraph(true, true);
								});

					};
				});