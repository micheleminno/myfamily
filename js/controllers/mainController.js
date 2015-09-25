var mainController = controllers
		.controller(
				"MainCtrl",
				function($scope, $location, dateFilter, MyFamilyService, $modal,
						AuthenticationService) {


					var modalUploadIinstance = null;

					$scope.openUploadModal = function(b){

						if(b){
							modalUploadIinstance = $modal.open({
								animation: true,
								templateUrl: 'addDocumentModal.html',
								scope: $scope,
								controller: 'FileUploadController'
							});

							modalUploadIinstance.result.then(function (selectedItem) {
								//$scope.selected = selectedItem;
							}, function () {
								//console.info('Modal dismissed at: ' + new Date());
							});
						}else{
							modalUploadIinstance.dismiss('cancel');
						}
					};


					d3.select("svg").attr("opacity", 1);
					
					function entityIsForbidden(entity, entityType) {

						var forbidden = false;

						for (forbiddenDocIndex in $scope.graph.blacklist.forbiddenDocuments) {

							var forbiddenDoc = $scope.graph.blacklist.forbiddenDocuments[forbiddenDocIndex];
							if (entityType == 'document'
									&& entity == forbiddenDoc.id) {

								forbidden = true;
								break;
							}
						}

						return forbidden;
					}

					/*
					 * Populate notifications: get all events about nodes or
					 * docs in this user view who are not already read by this
					 * user.
					 */
					function fillNotifications(callback) {

						var nodesCopy = jQuery.extend(true, [],
								$scope.graph.nodes);

						var data = {
							nodes : nodesCopy
						};

						data.nodes.push({
							originalId : -1
						});

						MyFamilyService
								.getEvents(data)
								.then(
										function(events) {

											var nodesIds = $scope.graph.nodes
													.map(function(n) {
														return n.originalId;
													});

											var newEventIds = events
													.filter(
															function(event) {

																return nodesIds
																		.indexOf(event.user) > -1
																		&& event.user != $scope.graph.user.id
																		&& $scope.graph.blacklist.blacklistingUsers
																				.indexOf(event.user) == -1
																		&& $scope.graph.blacklist.blacklistedNodes
																				.indexOf(event.user) == -1
																		&& !entityIsForbidden(
																				event.entity,
																				event.entity_type);
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

						MyFamilyService
								.getViewDocuments($scope.graph.user.id, data)
								.then(
										function(resultData) {

											$scope.graph.documents = [];
											$scope.graph.taggedNodes = [];

											for (docIndex in resultData.documents) {

												var doc = resultData.documents[docIndex];
												found = false;

												for (forbiddenDocIndex in $scope.graph.blacklist.forbiddenDocuments) {

													var forbiddenDoc = $scope.graph.blacklist.forbiddenDocuments[forbiddenDocIndex];
													if (doc.id == forbiddenDoc.id) {

														found = true;
														break;
													}
												}

												if (!found) {

													$scope.graph.documents
															.push(doc);

													var taggedNodesIds = doc.taggedNodes
															.map(function(n) {
																return n.id;
															});

													for (taggedNodeIndex in taggedNodesIds) {

														var taggedNodeId = taggedNodesIds[taggedNodeIndex];
														if ($scope.graph.taggedNodes
																.indexOf(taggedNodeId) == -1) {

															$scope.graph.taggedNodes
																	.push(taggedNodeId);
														}
													}
												}
											}

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
													.getForbiddenDocuments(
															$scope.graph.user.id)
													.then(
															function(
																	forbiddenDocs) {

																blacklist.forbiddenDocuments = forbiddenDocs;
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
									$scope.graph.resetPositions = false;

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

					$scope.initEventTypes = function() {

						$scope.eventTypes = [ {
							id : 0,
							label : 'Birth',
							on : 'person'
						}, {
							id : 1,
							label : 'Death',
							on : 'person'
						}, {
							id : 2,
							label : 'Marriage',
							on : 'family'
						}, {
							id : 3,
							label : 'Divorce',
							on : 'family'
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
						$scope.graph.selectedNode = null;

						$scope.drawGraph();
					};

					function resetData() {

						d3.select("svg").remove();
						$scope.graphData = null;
					}

					$scope
							.$watch(
									'searchName',
									function(name) {

										if (!$scope.svg.node) {

											return;
										}

										if (name != "") {

											$scope.svg.node[0]
													.forEach(function(n) {

														var label = n.attributes.label.nodeValue;
														var isPerson = n.attributes.person.nodeValue;
														var className = (label
																.toLowerCase()
																.indexOf(name) == -1 || isPerson == "0") ? "blacklisted"
																: "";

														d3.select(n).attr(
																"class",
																className);
													});

											$scope.svg.link[0]
													.forEach(function(n) {

														d3
																.select(n)
																.attr("class",
																		"blacklisted link");
													});
										} else {

											$scope.svg.node[0]
													.forEach(function(n) {

														d3.select(n).attr(
																"class", "");
													});

											$scope.svg.link[0]
													.forEach(function(n) {

														d3.select(n)
																.attr("class",
																		"link");
													});
										}
									});

					$scope.logout = function() {

						AuthenticationService.clearCredentials();
						resetData();

						$location.path('/login');
					};

					$scope.uploadNewDocument = function(fileName, addTitle, addDate, taggedUsers) {

						
						MyFamilyService
								.addDocument(fileName, addTitle,
										addDate, taggedUsers,
										$scope.graph.user.id)
								.then(
										function(addedDoc) {

											if (addedDoc) {

												$('#addDocumentModal').modal(
														'hide');

												// Display new document

												$scope.graph.selectedNode.documents
														.push(addedDoc);

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
														.addManyToBlacklist(
																$scope.graph.user.id,
																$scope.excludedUsers,
																addedDoc.id);

												MyFamilyService
														.registerEvent(
																'document',
																addedDoc.id,
																'creation',
																$scope.taggedUsers[0]['id'],
																$scope.graph.user.id);

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
										$scope.taggedUsers, $scope.keywords)
								.then(
										function() {

											if ($scope.graphData.selectedDocument) {

												$scope.graphData.selectedDocument.title = $scope.editTitle;
												$scope.graphData.selectedDocument.date = $scope.editDate;

												var taggedNodes = $scope.taggedUsers
														.map(function(n) {
															return {
																id : n.id,
																label : n.name
															};
														});

												$scope.graphData.selectedDocument.taggedNodes = taggedNodes;
												$scope.graphData.selectedDocument.keywords = $scope.keywords;
											}

											MyFamilyService.updateBlacklist(
													$scope.graph.user.id,
													$scope.excludedUsers,
													$scope.editDocId).then(
													function() {

														$scope.drawGraph(true,
																false);
													});
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

					$scope.$watch('nodeEventDate', function(date) {

						$scope.nodeEventDate = dateFilter(date, 'dd/MM/yyyy');
					});

					$scope.addElement = function(elements, availableElements,
							element) {

						elements.push(element);

						var availableElementIds = availableElements
								.map(function(e) {
									return e.id;
								});

						var indexElementToRemove = availableElementIds
								.indexOf(element.id);

						if (indexElementToRemove > -1) {
							availableElements.splice(indexElementToRemove, 1);
						}
					};

					$scope.removeElement = function(elements,
							availableElements, element) {

						var indexElementToInsert = 0;

						for (elementIndex in availableElements) {

							if (availableElements[elementIndex]['id'] > parseInt(element.id)) {

								indexElementToInsert = elementIndex;
								break;
							}
						}

						availableElements.splice(indexElementToInsert, 0,
								element);

						var elementIds = elements.map(function(e) {
							return e.id;
						});

						var indexElementToRemove = elementIds
								.indexOf(element.id);

						if (indexElementToRemove > -1) {
							elements.splice(indexElementToRemove, 1);
						}
					};

					$scope.showNotificationObject = function(notification) {

						MyFamilyService
								.getDocument(notification.entityId)
								.then(
										function(data) {

											$scope.graphData.selectedDocument = data.document;

											MyFamilyService
													.markNotificationAsRead(
															$scope.graph.user.id,
															notification.eventId)
													.then(
															function() {

																$scope
																		.drawGraph(
																				true,
																				true);
															});
										});
					};

					$scope.resetPositions = function() {

						var nodesIds = $scope.graph.nodes.map(function(n) {
							return n.originalId;
						});

						MyFamilyService
								.resetPositions(nodesIds, $scope.graph.user.id,
										$scope.graph.view.id)
								.then(
										function(data) {

											$scope.graphData.resetPositions = !$scope.graphData.resetPositions;

											$scope.drawGraph(false, true);
										});
					};

					$scope.selectEvent = function(eventType) {

						$scope.selectedEventType = eventType.label;
					};

					$scope.eventTypeFilter = function(eventType) {

						if ($scope.graphData && $scope.graphData.selectedNode) {

							return eventType.on == $scope.graphData.selectedNode.type;
						}
					};

					$scope.addNodeEvent = function() {

						$('#addInfoModal').modal('hide');

						MyFamilyService.addNodeEvent($scope.selectedEventType,
								$scope.nodeEventDate,
								$scope.graphData.selectedNode.id).then(
								function(addedNodeEvent) {

									$scope.graphData.selectedNode.events
											.push(addedNodeEvent);

									$scope.drawGraph(false, false);
								});
					};

					$scope.selectedNewKeyword = function(selected) {

						if (selected.originalObject.value) {

							$scope.keywords.push({
								id : selected.originalObject.id,
								label : selected.originalObject.value
							});

						} else {

							$scope.keywords.push({
								label : selected.originalObject
							});
						}
					};

				});