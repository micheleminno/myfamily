var mainController = controllers.controller("MainCtrl", function($scope,
		$rootScope, $location, MyFamilyService, AuthenticationService) {

	$scope.username = AuthenticationService.getUsername();
	$scope.userId = AuthenticationService.getUserId();

	/*
	 * Populate notifications: get all events about nodes or docs in this user
	 * view who are not already read by this user.
	 */
	function fillNotifications(events, graphView) {

		$scope.graphData.events = events;

		$scope.notifications = [];

		$.each(events, function(i, item) {

			var label = item.description + " of " + item.entity_type + " "
					+ item.entity + " on " + item.date;

			$scope.notifications.push({
				label : label
			});

		});
	}

	/*
	 * Populate documents: get all documents visible by userId in the specified
	 * user view.
	 */
	function fillDocuments(userId, nodes) {

		var data = {
			nodes : nodes
		};

		MyFamilyService.getDocuments(userId, data).then(
				function(documentsData) {

					documentsData.userId = $scope.userId;
					documentsData.userLabel = $scope.username;
					documentsData.viewId = $scope.selectedView.id;
					documentsData.viewLabel = $scope.selectedView.label;

					$scope.documentsData = documentsData;
				});
	}
	;

	/*
	 * Populate graph: get all nodes and links visible by userId in the
	 * specified user view.
	 */
	function fillGraph(userId, viewId, callback) {

		MyFamilyService.getGraphView(userId, viewId).then(function(graphData) {

			graphData.userId = $scope.userId;
			graphData.userLabel = $scope.username;
			graphData.viewId = $scope.selectedView.id;
			graphData.viewLabel = $scope.selectedView.label;

			$scope.graphData = graphData;

			callback();

		});
	}

	initD3Config = function() {

		$rootScope.width = 1250;
		$rootScope.height = 630;
		$rootScope.streamHeight = 100;
		$rootScope.streamWidth = 1600;
		$rootScope.streamY = 1130;
		$rootScope.streamX = 100;
		$rootScope.docRowSize = 16;
	};

	fillGraph($scope.userId, 4, function() {

		fillDocuments($scope.userId, $scope.graphData.nodes);
	});

	initViews($scope);
	initD3Config();

	$scope.updateView = function(view) {

		$scope.selectedView = view;
		fillGraph($scope.userId, view.id);
	};

	$scope.logout = function() {

		AuthenticationService.clearCredentials();
		$location.path('/login');
	};

	$scope.uploadNewDocument = function() {

		$('#uploadDocumentForm')
				.attr('action', serverUrl + '/documents/upload');

		$('#uploadDocumentForm').submit();

		var filePath = $('#document-upload').val();
		fileName = filePath.substring(filePath.lastIndexOf("\\") + 1);

		var title = $('#title').val();
		var date = $('#date').val();

		var tagged = [];
		$('#add-taggedArea > li').each(function() {

			tagged.push(parseInt(this.id));
		});

		MyFamilyService.addDocument(fileName, title, date, tagged,
				$scope.userId).then(
				function(addedDoc) {

					if (addedDoc) {

						$('#addDocumentModal').modal('hide');

						// Display new document

						addedDoc.position = {
							x : $rootScope.uploadedDocumentPosition[0],
							y : $rootScope.uploadedDocumentPosition[1]
						};

						$rootScope.uploadedDocumentPosition = [];

						// update position on db
						$.get(serverUrl + '/documents/' + addedDoc.id
								+ '/updatePosition?node=' + tagged[0] + '&x='
								+ addedDoc.position.x + '&y='
								+ addedDoc.position.y);

						// register event
						$.get(serverUrl + '/events/add/document/' + addedDoc.id
								+ "?type=creation&node=" + tagged[0]);

						fillDocuments($scope.graphData.userId,
								$scope.graphData.nodes);

					} else {
						console.log("Document not added!");
					}
				});
	};

});