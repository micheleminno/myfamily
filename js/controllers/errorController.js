var errorController = app.controller('ErrorCtrl', [ '$scope',
		'$rootScope', '$location', 'ErrorService',
		function($scope, $rootScope, $location, ErrorService) {

			$scope.readMessageAsObject = function() {

				var msg = ErrorService.messageAsObject();
				console.log(msg);

				$scope.problem = msg.problem;
				$scope.reason = msg.reason;
				$scope.whatWeCanDo = msg.whatWeCanDo;
			};

			$scope.goToLogin = function() {

				$location.path("/login");
			};

		} ]);
