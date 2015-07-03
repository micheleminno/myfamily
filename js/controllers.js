var controllers = angular.module('controllers', []);

var mainController = controllers.controller("MainCtrl", function($scope,
		$location, MyFamilyService) {

	$scope.login = function() {

		MyFamilyService.getUser($scope.loggedUser.name).then(
				function(namesakes) {

					if (namesakes.length > 0) {

						userId = namesakes[0]['id'];

						drawTree(userId, userLabel, selectedViewId,
								selectedViewLabel);

					} else if ($scope.isNewUser) {

						MyFamilyService.addUser($scope.loggedUser.name).then(
								function(userId) {

									drawTree(userId, userLabel, selectedViewId,
											selectedViewLabel);
								});
					}
					
					$scope.showLogin = false;
				});
	};

});