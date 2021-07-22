app
		.service(
				'MyFamilyService',
				function($http, $q) {

					var serverUrl = 'http://localhost:8091';
					var docDestination = 'docs/';

					this.getServerUrl = function() {

						return serverUrl;
					};

					this.getFilePath = function(fileName) {

						var path = window.location.pathname;
						return path + docDestination + fileName;
					};

					// Send Mail

					this.sendMail = function(subject, body, to) {

						var deferred = $q.defer();

						var data = {
							subject : subject,
							body : body,
							to : to
						};

						var httpPostConfig = {

							url : "js/mail/notify.php",
							method : "POST",
							data : JSON.stringify(data),
							headers : {
								'Content-Type' : 'application/json'
							}
						};

						$http(httpPostConfig).then(function(response) {

							// Nothing to do
							deferred.resolve("Email sent");

						}, function(response) {

							deferred.reject("Email not sent: " + JSON.stringify(response));
						});

						return deferred.promise;
					};

					// User

					var addComponentToFamily = function(userId, familyNodeId,
							partnerName, asParent, deferred) {

						var familyNodeRole = null;

						if (asParent) {

							familyNodeRole = 'target';

						} else {

							familyNodeRole = 'source';
						}

						internalAddNode('person', userId, familyNodeId,
								familyNodeRole, partnerName, false, false)
								.then(
										function(response) {

											if (response.data.newNode) {

												deferred.resolve("Relative "
														+ data.newNode
														+ " added to user with id = " + userId);
											} else {
												deferred.resolve("Relative "
														+ data.newNode
														+ " not added to user with id = " + userId);
											}
										});
					};

					this.getUsers = function(username, firstParentName,
							secondParentName, firstSiblingName,
							secondSiblingName, partnerName) {

						var deferred = $q.defer();

						var url = serverUrl + "/graph/namesakes?name="
								+ username;

						if (firstParentName) {

							url += '&firstParentName=' + firstParentName;
						}

						if (secondParentName) {

							url += '&secondParentName=' + secondParentName;
						}

						if (firstSiblingName) {

							url += '&firstSiblingName=' + firstSiblingName;
						}

						if (secondSiblingName) {

							url += '&secondSiblingName=' + secondSiblingName;
						}

						if (partnerName) {

							url += '&partnerName=' + partnerName;
						}

						$http.get(url).then(function(namesakes) {

							deferred.resolve(namesakes);
						});

						return deferred.promise;
					};

					this.addRelatives = function(userId, firstParentName,
							secondParentName, firstSiblingName,
							secondSiblingName, partnerName) {

						var deferred = $q.defer();

						if (angular.isUndefined(firstParentName)
								&& angular.isUndefined(secondParentName)
								&& angular.isUndefined(firstSiblingName)
								&& angular.isUndefined(secondSiblingName)
								&& angular.isUndefined(partnerName)) {

							deferred.resolve("No relative to add to user with id = " + userId);

						} else {

							if (!angular.isUndefined(partnerName)) {

								// Family user + partner

								internalAddNode('family', userId, userId,
										'source', false, false).then(
										function(response) {

											var familyNodeId = response.data.newNode;

											addComponentToFamily(userId,
													familyNodeId, partnerName,
													true, deferred);
										});
							}

							if (!angular.isUndefined(firstParentName)
									|| !angular.isUndefined(secondParentName)
									|| !angular.isUndefined(firstSiblingName)
									|| !angular.isUndefined(secondSiblingName)) {

								// Family user + parents + brothers/sisters

								internalAddNode('family', userId, userId,
										'target', false, false)
										.then(
												function(response) {

													var familyNodeId = response.data.newNode;

													if (!angular
															.isUndefined(firstParentName)) {

														addComponentToFamily(
																userId,
																familyNodeId,
																firstParentName,
																true, deferred);
													}

													if (!angular
															.isUndefined(secondParentName)) {

														addComponentToFamily(
																userId,
																familyNodeId,
																secondParentName,
																true, deferred);
													}

													if (!angular
															.isUndefined(firstSiblingName)) {

														addComponentToFamily(
																userId,
																familyNodeId,
																firstSiblingName,
																false, deferred);
													}

													if (!angular
															.isUndefined(secondSiblingName)) {

														addComponentToFamily(
																userId,
																familyNodeId,
																secondSiblingName,
																false, deferred);
													}
												});
							}
						}

						return deferred.promise;
					};

					this.registerNewUser = function(username, credentials,
							email, firstParentName, secondParentName,
							firstSiblingName, secondSiblingName, partnerName) {

						var deferred = $q.defer();

						this.addUser(username)
							.then(function(addedUserId) {

								this.manageUserAdding(addedUserId, username, credentials,
										email, firstParentName, secondParentName,
										firstSiblingName, secondSiblingName, partnerName)
									.then(function(user) {

										deferred.resolve(user);
									})
							});

						return deferred.promise;
					};

					this.manageUserAdding = function(addedUserId, username, credentials,
							email, firstParentName, secondParentName,
							firstSiblingName, secondSiblingName, partnerName) {

						var deferred = $q.defer();

						this.addRelatives(addedUserId, firstParentName,
									secondParentName, firstSiblingName,
									secondSiblingName, partnerName)
							.then(function(result) {

								console.log(result);
								console.log("Params before internalRegisterUserFromNode call: " + username + "," + credentials + "," +
										    email + "," + addedUserId);

								this.internalRegisterUserFromNode(username, credentials,
															email, addedUserId)
									.then(function(user) {

										deferred.resolve(user);
									})
							});

						return deferred.promise;
					};

					this.getRegisteredUser = function(username, credentials,
							nodeId) {

						var deferred = $q.defer();

						var url = serverUrl + '/user/getRegistered?';

						var operator = '';

						if (username) {

							url += operator + 'user=' + username;
							operator = '&';
						}

						if (credentials) {

							url += operator + 'credentials=' + credentials;
							operator = '&';
						}

						if (nodeId) {

							url += operator + 'node=' + nodeId;
						}

						$http.get(url).then(function(response) {

							deferred.resolve(response.data.registeredUser);
						}, function (error){

						});

						return deferred.promise;
					};

					this.registerUserFromNode = function(username, credentials,
							email, nodeId) {

						return internalRegisterUserFromNode(username,
								credentials, email, nodeId);
					};

					this.internalRegisterUserFromNode = function(username,
							credentials, email, nodeId) {

						console.log("Params in internalRegisterUserFromNode: " + username + "," + credentials + "," +
									 email + "," + nodeId);

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/user/register?username='
										+ username + '&credentials='
										+ credentials + '&email=' + email
										+ '&node=' + nodeId).then(
								function(response) {

									deferred.resolve(response.data.user);
								});

						return deferred.promise;
					};

					this.getRegisteredUserWithNode = function(username, nodeId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/user/getRegistered?user='
										+ username + '&node=' + nodeId)
								.then(function(response) {

									deferred.resolve(response.data.registeredUser);
								});

						return deferred.promise;
					};

					this.updateCredentials = function(username, nodeId,
							newCredentials) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/user/update?username=' + username
										+ '&credentials=' + newCredentials
										+ '&node=' + nodeId).then(
								function(response) {

									deferred.resolve(response.data.userUpdated);
								});

						return deferred.promise;
					};

					this.addUser = function(name) {

						var deferred = $q.defer();
						var url = serverUrl + "/graph/addPerson?name="
								+ name;

						$http.get(url).then(function(response) {

							deferred.resolve(response.data.personId);
						});

						return deferred.promise;
					};

					// Graph

					this.getGraphView = function(userId, viewId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + "/" + userId + "/graph/view?view="
										+ viewId).then(function(graphView) {

							deferred.resolve(graphView);
						});

						return deferred.promise;
					};

					this.getParents = function(userId, familyId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + "/" + userId + "/graph/" + familyId
										+ "/parents").then(
								function(graphView) {

									deferred.resolve(graphView);
								});

						return deferred.promise;
					};

					var internalAddNode = function(type, userId, otherNodeId,
							otherNodeRole, label, invisible) {

						var deferred = $q.defer();

						var url = serverUrl + "/" + userId + '/graph/add?type='
								+ type + '&' + otherNodeRole + '='
								+ otherNodeId;

						if (label) {

							url += '&label=' + label;
						}

						if (invisible) {

							url += '&link=invisible';
						}

						$http.get(url).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					this.addNode = function(type, userId, otherNodeId,
							otherNodeRole, invisible) {

						return internalAddNode(type, userId, otherNodeId,
								otherNodeRole, false, invisible);
					};

					this.removeNode = function(userId, nodeId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + "/" + userId + '/graph/remove/'
										+ nodeId).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					this.updateNodePosition = function(nodeId, userId, viewId,
							xPosition, yPosition) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId + '/view/' + viewId
										+ '/update?node=' + nodeId + '&x='
										+ xPosition + '&y=' + yPosition)
								.then(

								function(response) {

									if (response) {

										deferred.resolve(response.data);
									}
								});

						return deferred.promise;
					};

					this.resetPositions = function(nodes, userId, viewId) {

						var deferred = $q.defer();

						var httpPostConfig = {

							url : serverUrl + '/' + userId + '/' + viewId
									+ '/graph/resetPositions',
							method : "POST",
							data : JSON.stringify(nodes),
							headers : {
								'Content-Type' : 'application/json'
							}
						};

						$http(httpPostConfig).then(function(response) {

							deferred.resolve(response.data);
						});

						return deferred.promise;
					};

					this.updateNode = function(nodeId, userId, field, value) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + "/" + userId + '/graph/update/'
										+ nodeId + '?field=' + field
										+ '&value=' + value).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					// Events

					this.getEvents = function(nodes) {

						var deferred = $q.defer();

						var httpPostConfig = {

							url : serverUrl + "/events",
							method : "POST",
							data : JSON.stringify(nodes),
							headers : {
								'Content-Type' : 'application/json'
							}
						};

						$http(httpPostConfig).then(function(response) {

							deferred.resolve(response.events);
						});

						return deferred.promise;
					};

					this.registerEvent = function(entityType, entityId,
							eventType, nodeId, userId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId + '/events/add/'
										+ entityType + '/' + entityId
										+ '?type=' + eventType + '&node='
										+ nodeId).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					this.deleteEvents = function(entityType, entityId, userId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId + '/events/remove/'
										+ entityType + '/' + entityId).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					// Node events

					this.addNodeEvent = function(eventType, date, nodeId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/nodeEvents/add/' + nodeId
										+ '?type=' + eventType + '&date='
										+ date).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					this.removeNodeEvent = function(nodeEventId) {

						var deferred = $q.defer();

						$http
								.get(
										serverUrl + '/nodeEvents/remove/'
												+ nodeEventId).then(

								function(response) {

									if (response) {

										deferred.resolve(response.data);
									}
								});

						return deferred.promise;
					};

					this.getNodeEvents = function(nodeId) {

						var deferred = $q.defer();

						$http.get(serverUrl + '/nodeEvents/' + nodeId).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					// Notifications

					this.getUnreadNotifications = function(userId) {

						var deferred = $q.defer();

						$http
								.get(
										serverUrl + '/' + userId
												+ '/notifications/1')
								.then(

										function(response) {

											if (response) {

												var notifications = response.data
														.map(function(item) {
															return {

																eventId : item.id,
																entityId : item.entity,
																label : item.description
																		+ " of "
																		+ item.entity_type
																		+ " '"
																		+ item.title
																		+ "' on "
																		+ item.date,
																file : item.file,
																user : item.user,
																docTitle : item.title,
																date : item.date

															};
														});

												deferred.resolve(notifications);
											}
										});

						return deferred.promise;
					};

					this.addNotifications = function(userId, eventIds) {

						var deferred = $q.defer();

						var httpPostConfig = {

							url : serverUrl + '/' + userId
									+ '/notifications/add/',
							method : "POST",
							data : {
								eventIds : eventIds
							},
							headers : {
								'Content-Type' : 'application/json'
							}
						};

						$http(httpPostConfig).then(function(response) {

							deferred.resolve(response.data);
						});

						return deferred.promise;
					};

					this.deleteNotification = function(userId, eventId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId
										+ '/notifications/remove/' + eventId)
								.then(

								function(response) {

									if (response) {

										deferred.resolve(response.data);
									}
								});

						return deferred.promise;
					};

					this.deleteNotifications = function(entityType, entityId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/notifications/remove/'
										+ entityType + '/' + entityId).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					this.markNotificationAsRead = function(userId, eventId) {

						var deferred = $q.defer();

						$http.get($.get(
								serverUrl + '/' + userId + '/notifications/'
										+ eventId + '/setStatus?status=read')
								.then(

								function(response) {

									if (response) {

										deferred.resolve(response.data);
									}
								}));

						return deferred.promise;
					};

					// Documents

					this.getViewDocuments = function(userId, nodes, offset,
							size, keywords, sort, filter, excludedNodeIds) {

						var deferred = $q.defer();

						var subsetQuery = "";

						if (offset != null
								|| size != null
								|| keywords != null
								|| sort != null
								|| filter != null
								|| (excludedNodeIds != null && excludedNodeIds.length > 0)) {

							subsetQuery = "?";
						}

						var separator = "";

						if (offset != null && size != null) {

							subsetQuery += "offset=" + offset + "&size=" + size;
							separator = "&";
						}

						if (keywords != null && keywords != "") {

							subsetQuery += separator + "keywords=" + keywords;
							separator = "&";
						}

						if (sort != null) {

							subsetQuery += separator + "sort=" + sort;
							separator = "&";
						}

						if (filter != null) {

							subsetQuery += separator + "filter=" + filter;
							separator = "&";
						}

						if (excludedNodeIds != null
								&& excludedNodeIds.length > 0) {

							subsetQuery += separator + "excludedNodeIds="
									+ excludedNodeIds;
						}

						var httpPostConfig = {

							url : serverUrl + "/" + userId + "/documents"
									+ subsetQuery,
							method : "POST",
							data : JSON.stringify(nodes),
							headers : {
								'Content-Type' : 'application/json'
							}
						};

						$http(httpPostConfig).then(function(documents) {

							deferred.resolve(documents);
						});

						return deferred.promise;
					};

					this.getNodeDocuments = function(nodeId, relationType) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + "/documents?node=" + nodeId
										+ "&relation=" + relationType).then(
								function(documents) {

									deferred.resolve(documents);
								});

						return deferred.promise;
					};

					this.getMixedStuffDocuments = function(userId) {

						var deferred = $q.defer();

						$http.get(serverUrl + '/' + userId + '/mixedStuff')
								.then(function(documents) {

									deferred.resolve(documents);
								});

						return deferred.promise;
					};

					this.getDocument = function(docId) {

						var deferred = $q.defer();

						$http.get(serverUrl + "/documents/" + docId).then(
								function(document) {

									deferred.resolve(document);
								});

						return deferred.promise;
					};

					this.addDocument = function(fileName, title, date,
							taggedUsers, keywords, owner) {

						var deferred = $q.defer();

						var taggedUsersIds = taggedUsers.map(function(user) {
							return user.id;
						});

						var keywordLabels = keywords ? keywords.map(function(
								keyword) {
							return keyword.label;
						}) : [];

						if (!date) {

							date = '01/01/2015';
						}

						$http.get(
								serverUrl + "/documents/add/document?file="
										+ fileName + "&title=" + title
										+ "&date=" + date + "&tagged="
										+ JSON.stringify(taggedUsersIds)
										+ "&keywords="
										+ JSON.stringify(keywordLabels)
										+ '&owner=' + owner).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					this.removeDocument = function(docId) {

						var deferred = $q.defer();

						$http
								.get(
										serverUrl + '/documents/' + docId
												+ '/remove').then(

								function(response) {

									if (response) {

										deferred.resolve(response.data);
									}
								});

						return deferred.promise;
					};

					this.updateDocument = function(docId, title, date,
							taggedPeople, keywords) {

						var deferred = $q.defer();

						var taggedUsersIds = taggedPeople.map(function(user) {
							return user.id;
						});

						$http.get(
								serverUrl + '/documents/' + docId
										+ '/update?title=' + title + '&date='
										+ date + '&tagged='
										+ JSON.stringify(taggedUsersIds)
										+ '&keywords='
										+ JSON.stringify(keywords)).then(
								function(response) {

									if (response) {

										deferred.resolve(response.data);
									}
								});

						return deferred.promise;
					};

					this.updateDocumentPosition = function(docId, nodeId,
							xPosition, yPosition) {

						var deferred = $q.defer();

						$http
								.get(
										serverUrl + '/documents/' + docId
												+ '/updatePosition?node='
												+ nodeId + '&x=' + xPosition
												+ '&y=' + yPosition).then(

								function(response) {

									if (response) {

										deferred.resolve(response.data);
									}
								});

						return deferred.promise;
					};

					// Blacklists

					this.addToBlacklist = function(userId, blockedUserId,
							documentId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId + '/blacklists/add/'
										+ blockedUserId + '/' + documentId)
								.then(

								function(response) {

									if (response) {

										deferred.resolve(response.data);
									}
								});

						return deferred.promise;
					};

					this.addManyToBlacklist = function(userId, blockedUsers,
							documentId) {

						var deferred = $q.defer();

						var httpPostConfig = {

							url : serverUrl + '/' + userId + '/blacklists/add/'
									+ documentId,
							method : "POST",
							data : {
								blockedUsers : blockedUsers
							},
							headers : {
								'Content-Type' : 'application/json'
							}
						};

						$http(httpPostConfig).then(function(events) {

							deferred.resolve(events);
						});

						return deferred.promise;
					};

					this.updateBlacklist = function(userId, blockedUsers,
							documentId) {

						var deferred = $q.defer();

						var httpPostConfig = {

							url : serverUrl + '/' + userId
									+ '/blacklists/update/' + documentId,
							method : "POST",
							data : {
								blockedUsers : blockedUsers
							},
							headers : {
								'Content-Type' : 'application/json'
							}
						};

						$http(httpPostConfig).then(function(res) {

							deferred.resolve(res);
						});

						return deferred.promise;
					};

					this.removeFromBlacklist = function(userId, blockedUserId,
							documentId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId
										+ '/blacklists/remove/' + blockedUserId
										+ '/' + documentId).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					this.getBlacklistedNodes = function(userId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId + '/blacklists/nodes')
								.then(

								function(response) {

									if (response) {

										deferred.resolve(response.data);
									}
								});

						return deferred.promise;
					};

					this.getBlacklistedUsersForDocument = function(userId,
							docId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId + '/blacklists/'
										+ docId).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					this.getForbiddenDocuments = function(userId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId
										+ '/forbiddenDocuments').then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					this.getBlacklistingUsers = function(userId) {

						var deferred = $q.defer();

						$http
								.get(
										serverUrl + '/' + userId
												+ '/blacklistingUsers')
								.then(

								function(response) {

									if (response) {

										deferred.resolve(response.data);
									}
								});

						return deferred.promise;
					};

					// Bookmarks

					this.addToBookmarks = function(userId, documentId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId + '/bookmarks/add/'
										+ documentId).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					this.removeFromBookmarks = function(userId, documentId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId + '/bookmarks/remove/'
										+ documentId).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					this.getBookmarks = function(userId) {

						var deferred = $q.defer();

						$http.get(serverUrl + '/' + userId + '/bookmarks')
								.then(

								function(response) {

									if (response) {

										deferred.resolve(response.data);
									}
								});

						return deferred.promise;
					};

					// Keywords

					this.getAllKeywords = function(userId) {

						var deferred = $q.defer();

						$http.get(serverUrl + '/' + userId + '/keywords')
								.then(

								function(response) {

									if (response) {

										deferred.resolve(response.data);
									}
								});

						return deferred.promise;
					};

					// Drawers

					this.createDefaultDrawers = function(userId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId
										+ '/drawers/initialise').then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					this.getDrawers = function(userId) {

						var deferred = $q.defer();

						$http.get(serverUrl + '/' + userId + '/drawers')
								.then(

								function(response) {

									if (response) {

										deferred.resolve(response.data);
									}
								});

						return deferred.promise;
					};

					this.getDrawer = function(drawerId) {

						var deferred = $q.defer();

						$http.get(serverUrl + '/drawers/' + drawerId).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					this.addDrawer = function(userId, label, taggedIds) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId
										+ '/drawers/add?label=' + label
										+ '&tagged=' + taggedIds).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					this.removeDrawer = function(drawerId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/drawers/' + drawerId + '/remove')
								.then(

								function(response) {

									if (response) {

										deferred.resolve(response.data);
									}
								});

						return deferred.promise;
					};

					this.updateDrawer = function(drawerId, label, taggedNodeIds) {

						var deferred = $q.defer();
						var url = serverUrl + '/drawers/' + drawerId
								+ '/update';

						if (label || taggedNodeIds) {

							url += '?';
						}

						if (label) {

							url += 'label=' + label;
						}

						if (label && taggedNodeIds) {

							url += '&';
						}

						if (taggedNodeIds) {

							url += 'tagged=' + taggedNodeIds;
						}

						$http.get(url).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

					// User

					this.updateUser = function(nodeId, username) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/user/update?node=' + nodeId
										+ '&username=' + username).then(

						function(response) {

							if (response) {

								deferred.resolve(response.data);
							}
						});

						return deferred.promise;
					};

				});
