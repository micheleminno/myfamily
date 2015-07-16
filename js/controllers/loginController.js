var loginController = controllers
		.controller(
				"LoginCtrl",
				function($scope, $q, $http, $location, dateFilter,
						ErrorService, EncryptionService, AuthenticationService,
						MyFamilyService) {

					$scope.$watch('birthDate', function(date) {

						$scope.birthDate = dateFilter(date, 'dd-MM-yyyy');
					});

					function removeModalElements() {

						$('body').removeClass('modal-open');
						$('.modal-backdrop').remove();
					}

					$scope.login = function(username, password) {

						$('#alreadyRegisteredModal').modal('hide');
						removeModalElements();

						if (angular.isUndefined(username)
								|| angular.isUndefined(password)) {
							return;
						}

						var credentials = EncryptionService
								.base64Encode(username.toLowerCase() + ':'
										+ password);

						MyFamilyService
								.getRegisteredUser(username, credentials)
								.then(
										function(registeredUser) {

											if (registeredUser) {

												AuthenticationService
														.storeCredentials(
																registeredUser.credentials,
																registeredUser.username,
																registeredUser.node);

												$location.path('/home');

											} else {

												ErrorService
														.printMsg(
																"You can't access the platform",
																"wrong credentials",
																"Try to login again or register");
												console.warn();
												$scope.wrongCredentials = true;
												$location.path('/error');
											}
										});
					};

					$scope.registerNewUser = function() {

						$('#identifyUserModal').modal('hide');
						removeModalElements();

						MyFamilyService
								.registerNewUser($scope.username,
										$scope.credentials, $scope.email,
										$scope.firstParentName,
										$scope.secondParentName,
										$scope.firstSiblingName,
										$scope.secondSiblingName,
										$scope.partnerName)
								.then(
										function(user) {

											MyFamilyService
													.sendMail(
															"family.place notifications",
															"Hi "
																	+ $scope.username
																	+ " (password: "
																	+ $scope.password
																	+ "), you've been successfully registered!",
															$scope.email);

											AuthenticationService
													.storeCredentials(
															$scope.credentials,
															$scope.username,
															user.nodeId);

											$location.path('/home');
										});
					};

					$scope.register = function() {

						$scope.alreadyRegisteredWithNode = false;

						$scope.credentials = EncryptionService
								.base64Encode($scope.username.toLowerCase()
										+ ':' + $scope.password);

						MyFamilyService
								.getRegisteredUser($scope.username,
										$scope.credentials)
								.then(
										function(registeredUser) {

											if (registeredUser) {

												$('#alreadyRegisteredModal')
														.modal('show');

											} else {

												MyFamilyService
														.getUsers(
																$scope.username)
														.then(
																function(users) {

																	if (users.length > 0) {

																		$scope.potentialUsers = users;
																		$(
																				'#identifyUserModal')
																				.modal(
																						'show');

																	} else {

																		$scope
																				.registerNewUser();
																	}
																});
											}
										});
					};

					$scope.useThisAsUser = function(nodeId) {

						$('#identifyUserModal').modal('hide');
						removeModalElements();

						$scope.nodeId = nodeId;

						MyFamilyService
								.getRegisteredUserWithNode($scope.username,
										nodeId)
								.then(
										function(user) {

											if (user) {

												$scope.alreadyRegisteredWithNode = true;
												$('#alreadyRegisteredModal')
														.modal('show');

											} else {

												MyFamilyService
														.registerUserFromNode(
																$scope.username,
																$scope.credentials,
																$scope.email,
																nodeId)
														.then(
																function(user) {

																	AuthenticationService
																			.storeCredentials(
																					$scope.credentials,
																					$scope.username,
																					nodeId);

																	$location
																			.path('/home');
																});
											}
										});
					};
				});