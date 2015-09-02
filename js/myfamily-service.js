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

						var data = {
							subject : subject,
							body : body,
							to : to
						};

						var httpPostConfig = {

							url : "php/notify.php",
							method : "POST",
							data : JSON.stringify(data),
							headers : {
								'Content-Type' : 'application/json'
							}
						};

						$http(httpPostConfig).success(function() {

							// Nothing to do

						}).error(function(textStatus) {

							alert("Email not sent: " + textStatus);
						});
					};

					// User

					function addComponentToFamily(userId, familyNodeId,
							partnerName, asParent, deferred) {

						var familyNodeRole = null;

						if (asParent) {

							familyNodeRole = 'target';

						} else {

							familyNodeRole = 'source';
						}

						internalAddNode('person', userId, familyNodeId,
								familyNodeRole, partnerName).then(
								function(data) {

									if (data.newNode) {

										deferred.resolve("Relative "
												+ data.newNode + " added");
									} else {
										deferred.resolve("Relative "
												+ data.newNode + " not added");
									}
								});
					}

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

						$http.get(url).success(function(namesakes) {

							deferred.resolve(namesakes);
						});

						return deferred.promise;
					};

					var addRelatives = function(userId, firstParentName,
							secondParentName, firstSiblingName,
							secondSiblingName, partnerName) {

						var deferred = $q.defer();

						if (angular.isUndefined(firstParentName)
								&& angular.isUndefined(secondParentName)
								&& angular.isUndefined(firstSiblingName)
								&& angular.isUndefined(secondSiblingName)
								&& angular.isUndefined(partnerName)) {

							deferred.resolve("No relative to add");

						} else {

							if (!angular.isUndefined(partnerName)) {

								// Family user + partner

								internalAddNode('family', userId, userId,
										'source').then(
										function(data) {

											var familyNodeId = data.newNode;

											addComponentToFamily(userId,
													familyNodeId, partnerName,
													true, deferred);
										});
							}

							if (!angular.isUndefined(secondParentName)
									|| !angular.isUndefined(firstSiblingName)
									|| !angular.isUndefined(secondSiblingName)
									|| !angular.isUndefined(partnerName)) {

								// Family user + parents + brothers/sisters

								internalAddNode('family', userId, userId,
										'target')
										.then(
												function(data) {

													var familyNodeId = data.newNode;

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

						this
								.addUser(username)
								.then(
										function(addedUserId) {

											addRelatives(addedUserId,
													firstParentName,
													secondParentName,
													firstSiblingName,
													secondSiblingName,
													partnerName)
													.then(
															function() {

																internalRegisterUserFromNode(
																		username,
																		credentials,
																		email,
																		addedUserId)
																		.then(
																				function(
																						user) {

																					deferred
																							.resolve(user);
																				});
															});
										});

						return deferred.promise;
					};

					this.getRegisteredUser = function(username, credentials) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/user/getRegistered?user='
										+ username + '&credentials='
										+ credentials).success(function(data) {

							deferred.resolve(data.registeredUser);
						});

						return deferred.promise;
					};

					this.registerUserFromNode = function(username, credentials,
							email, nodeId) {

						return internalRegisterUserFromNode(username,
								credentials, email, nodeId);
					};

					var internalRegisterUserFromNode = function(username,
							credentials, email, nodeId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/user/register?username='
										+ username + '&credentials='
										+ credentials + '&email=' + email
										+ '&node=' + nodeId).success(
								function(data) {

									deferred.resolve(data.user);
								});

						return deferred.promise;
					};

					this.getRegisteredUserWithNode = function(username, nodeId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/user/getRegistered?user='
										+ username + '&node=' + nodeId)
								.success(function(data) {

									deferred.resolve(data.registeredUser);
								});

						return deferred.promise;
					};

					this.updateCredentials = function(username, nodeId,
							newCredentials) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/user/update?username=' + username
										+ '&credentials=' + newCredentials
										+ '&node=' + nodeId).success(
								function(data) {

									deferred.resolve(data.userUpdated);
								});

						return deferred.promise;
					};

					this.addUser = function(name) {

						var deferred = $q.defer();

						$http.get(serverUrl + '/graph/addPerson?name=' + name)
								.success(function(data) {

									if (data) {

										deferred.resolve(data.personId);
									}
								});

						return deferred.promise;
					};

					// Graph

					this.getGraphView = function(userId, viewId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + "/" + userId + "/graph/view?view="
										+ viewId).success(function(graphView) {

							deferred.resolve(graphView);
						});

						return deferred.promise;
					};

					var internalAddNode = function(type, userId, otherNodeId,
							otherNodeRole, label) {

						var deferred = $q.defer();

						var url = serverUrl + "/" + userId + '/graph/add?type='
								+ type + '&' + otherNodeRole + '='
								+ otherNodeId;

						if (label) {

							url += '&label=' + label;
						}

						$http.get(url).success(

						function(data) {

							if (data) {

								deferred.resolve(data);
							}
						});

						return deferred.promise;
					};

					this.addNode = function(type, userId, otherNodeId,
							otherNodeRole) {

						return internalAddNode(type, userId, otherNodeId,
								otherNodeRole);
					};

					this.removeNode = function(userId, nodeId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + "/" + userId + '/graph/remove/'
										+ nodeId).success(

						function(data) {

							if (data) {

								deferred.resolve(data);
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
								.success(

								function(data) {

									if (data) {

										deferred.resolve(data);
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

						$http(httpPostConfig).success(function(data) {

							deferred.resolve(data);
						});

						return deferred.promise;
					};

					this.updateNode = function(nodeId, userId, field, value) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + "/" + userId + '/graph/update/'
										+ nodeId + '?field=' + field
										+ '&value=' + value).success(

						function(data) {

							if (data) {

								deferred.resolve(data);
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

						$http(httpPostConfig).success(function(events) {

							deferred.resolve(events);
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
										+ nodeId).success(

						function(data) {

							if (data) {

								deferred.resolve(data);
							}
						});

						return deferred.promise;
					};

					this.deleteEvents = function(entityType, entityId, userId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId + '/events/remove/'
										+ entityType + '/' + entityId).success(

						function(data) {

							if (data) {

								deferred.resolve(data);
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
								.success(

										function(data) {

											if (data) {

												var notifications = data
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

						$http(httpPostConfig).success(function(data) {

							deferred.resolve(data);
						});

						return deferred.promise;
					};

					this.deleteNotification = function(userId, eventId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId
										+ '/notifications/remove/' + eventId)
								.success(

								function(data) {

									if (data) {

										deferred.resolve(data);
									}
								});

						return deferred.promise;
					};

					this.deleteNotifications = function(entityType, entityId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/notifications/remove/'
										+ entityType + '/' + entityId).success(

						function(data) {

							if (data) {

								deferred.resolve(data);
							}
						});

						return deferred.promise;
					};

					this.markNotificationAsRead = function(userId, eventId) {

						var deferred = $q.defer();

						$http.get($.get(
								serverUrl + '/' + userId + '/notifications/'
										+ eventId + '/setStatus?status=read')
								.success(

								function(data) {

									if (data) {

										deferred.resolve(data);
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

						$http(httpPostConfig).success(function(documents) {

							deferred.resolve(documents);
						});

						return deferred.promise;
					};

					this.getNodeDocuments = function(nodeId, relationType) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + "/documents?node=" + nodeId
										+ "&relation=" + relationType).success(
								function(documents) {

									deferred.resolve(documents);
								});

						return deferred.promise;
					};

					this.getGroundDocuments = function(owners) {

						var deferred = $q.defer();

						var httpPostConfig = {

							url : serverUrl + '/heritage/documents',
							method : "POST",
							data : {
								nodes : owners
							},
							headers : {
								'Content-Type' : 'application/json'
							}
						};

						$http(httpPostConfig).success(function(events) {

							deferred.resolve(events);
						});

						return deferred.promise;
					};

					this.getDocument = function(docId) {

						var deferred = $q.defer();

						$http.get(serverUrl + "/documents/" + docId).success(
								function(document) {

									deferred.resolve(document);
								});

						return deferred.promise;
					};

					this.addDocument = function(fileName, title, date,
							taggedUsers, owner) {

						var deferred = $q.defer();

						var taggedUsersIds = taggedUsers.map(function(user) {
							return user.id;
						});

						if (!date) {

							date = '01/01/2015';
						}

						$http.get(
								serverUrl + "/documents/add/document?file="
										+ fileName + "&title=" + title
										+ "&date=" + date + "&tagged="
										+ JSON.stringify(taggedUsersIds)
										+ '&owner=' + owner).success(

						function(data) {

							if (data) {

								deferred.resolve(data);
							}
						});

						return deferred.promise;
					};

					this.removeDocument = function(docId) {

						var deferred = $q.defer();

						$http
								.get(
										serverUrl + '/documents/' + docId
												+ '/remove').success(

								function(data) {

									if (data) {

										deferred.resolve(data);
									}
								});

						return deferred.promise;
					};

					this.updateDocument = function(docId, title, date,
							taggedPeople) {

						var deferred = $q.defer();

						var taggedUsersIds = taggedPeople.map(function(user) {
							return user.id;
						});

						$http.get(
								serverUrl + '/documents/' + docId
										+ '/update?title=' + title + '&date='
										+ date + '&tagged='
										+ JSON.stringify(taggedUsersIds))
								.success(function(data) {

									if (data) {

										deferred.resolve(data);
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
												+ '&y=' + yPosition).success(

								function(data) {

									if (data) {

										deferred.resolve(data);
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
								.success(

								function(data) {

									if (data) {

										deferred.resolve(data);
									}
								});

						return deferred.promise;
					};

					this.addToBlacklist = function(userId, blockedUsers,
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

						$http(httpPostConfig).success(function(events) {

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

						$http(httpPostConfig).success(function(res) {

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
										+ '/' + documentId).success(

						function(data) {

							if (data) {

								deferred.resolve(data);
							}
						});

						return deferred.promise;
					};

					this.getBlacklistedNodes = function(userId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId + '/blacklists/nodes')
								.success(

								function(data) {

									if (data) {

										deferred.resolve(data);
									}
								});

						return deferred.promise;
					};

					this.getBlacklistedUsersForDocument = function(userId,
							docId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId + '/blacklists/'
										+ docId).success(

						function(data) {

							if (data) {

								deferred.resolve(data);
							}
						});

						return deferred.promise;
					};

					this.getForbiddenDocuments = function(userId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId
										+ '/forbiddenDocuments').success(

						function(data) {

							if (data) {

								deferred.resolve(data);
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
								.success(

								function(data) {

									if (data) {

										deferred.resolve(data);
									}
								});

						return deferred.promise;
					};

					// Bookmarks

					this.addToBookmarks = function(userId, documentId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId + '/bookmarks/add/'
										+ documentId).success(

						function(data) {

							if (data) {

								deferred.resolve(data);
							}
						});

						return deferred.promise;
					};

					this.removeFromBookmarks = function(userId, documentId) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + '/' + userId + '/bookmarks/remove/'
										+ documentId).success(

						function(data) {

							if (data) {

								deferred.resolve(data);
							}
						});

						return deferred.promise;
					};

					this.getBookmarks = function(userId) {

						var deferred = $q.defer();

						$http.get(serverUrl + '/' + userId + '/bookmarks')
								.success(

								function(data) {

									if (data) {

										deferred.resolve(data);
									}
								});

						return deferred.promise;
					};

				});