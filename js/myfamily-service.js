app
		.service(
				'MyFamilyService',
				function($http, $q) {

					var serverUrl = 'http://localhost:8091';

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

					this.getUsers = function(name) {

						var deferred = $q.defer();

						$http.get(serverUrl + "/graph/namesakes?name=" + name)
								.success(function(namesakes) {

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
						} else if (!angular.isUndefined(partnerName)) {

							this.addNode('family', userId, userId, 'source')
									.then(function() {

										deferred.resolve("Family node added");
									});

						} else {

							this.addNode('family', userId, userId, 'target')
									.then(function() {

										deferred.resolve("Family node added");
									});
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

					this.addNode = function(type, userId, otherNodeId,
							otherNodeRole) {

						var deferred = $q.defer();

						$http.get(
								serverUrl + "/" + userId + '/graph/add?type='
										+ type + '&' + otherNodeRole + '='
										+ otherNodeId).success(

						function(data) {

							if (data) {

								deferred.resolve(data);
							}
						});

						return deferred.promise;
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

					this.getEvents = function(userId, nodes) {

						var deferred = $q.defer();

						var httpPostConfig = {

							url : serverUrl + "/" + userId + "/events",
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
							eventType, nodeId) {

						var deferred = $q.defer();

						$http.get($.get(
								serverUrl + '/events/add/' + entityType + '/'
										+ entityId + '?type=' + eventType
										+ '&node=' + nodeId).success(

						function(data) {

							if (data) {

								deferred.resolve(data);
							}
						}));

						return deferred.promise;
					};

					// Notifications

					this.getUnreadNotifications = function(userId) {

						var deferred = $q.defer();

						$http.get($.get(
								serverUrl + '/' + userId
										+ '/notifications/unread').success(

								function(data) {

									if (data) {

										var notifications = data.map(function(
												item) {
											return {
												id : item.id,
												label : item.description
														+ " of "
														+ item.entity_type
														+ " " + item.entity
														+ " on " + item.date
											};
										});

										deferred.resolve(notifications);
									}
								}));

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

					this.markNotificationAsRead = function(notificationId) {

						var deferred = $q.defer();

						$http.get($.get(
								serverUrl + '/notifications/' + notificationId
										+ '/setStatus/?status=read').success(

						function(data) {

							if (data) {

								deferred.resolve(data);
							}
						}));

						return deferred.promise;
					};

					// Documents

					this.getViewDocuments = function(userId, nodes) {

						var deferred = $q.defer();

						var httpPostConfig = {

							url : serverUrl + "/documents" + "/" + userId,
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
								.success(

								function(data) {

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

				});