var loginController = controllers.controller("LoginCtrl", function($scope, $q,
		$http, $location, dateFilter, ErrorService, EncryptionService,
		AuthenticationService, MyFamilyService) {

	$scope.$watch('birthDate', function(date) {

		$scope.birthDate = dateFilter(date, 'dd-MM-yyyy');
	});

	$scope.login = function(username, password) {

		if (angular.isUndefined(username) || angular.isUndefined(password)) {
			return;
		}

		var credentials = EncryptionService.base64Encode(username + ':'
				+ password);

		MyFamilyService.isRegisteredUser(username, credentials).then(
				function(registeredUser) {

					if (registeredUser) {

						AuthenticationService.storeCredentials(
								registeredUser.credentials,
								registeredUser.username, registeredUser.node);

						$location.path('/home');

					} else {

						ErrorService.printMsg("You can't access the platform",
								"wrong credentials",
								"Go back and retry or register");
						console.warn();
						$scope.wrongCredentials = true;
						$location.path('/error');
					}
				});
	};
});