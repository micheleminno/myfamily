var exploreController = controllers.controller("ExploreCtrl", function($scope,
		MyFamilyService, AuthenticationService) {

	d3.select("svg").attr("opacity", .1);

	$scope.search = function() {

		MyFamilyService.getGraphView(AuthenticationService.getUserId(), 4)
				.then(
						function(resultData) {

							var data = {
								nodes : resultData.nodes
							};

							MyFamilyService.getViewDocuments(
									AuthenticationService.getUserId(), data)
									.then(function(resultData) {

										$scope.results = resultData;
										$scope.documentsReady = true;
									});
						});
	};

	$scope.getFilePath = function(docName) {

		return MyFamilyService.getFilePath(docName);
	};
});