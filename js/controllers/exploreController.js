var exploreController = controllers.controller("ExploreCtrl", function($scope,
		$location, MyFamilyService, AuthenticationService) {

	init();

	var defaultDocumentImg = "default_pdf.png";

	$scope.search = function() {

		MyFamilyService.getGraphView(AuthenticationService.getUserId(), 4)
				.then(
						function(resultData) {

							$scope.nodes = resultData.nodes;

							var data = {
								nodes : $scope.nodes
							};

							$scope.taggedPeople = resultData.nodes
									.filter(function(n) {

										return n.person == 1;
									});

							$scope.taggedPeople.forEach(function(n) {

								n.count = 0;
								n.checked = false;
							});

							MyFamilyService.getViewDocuments(
									AuthenticationService.getUserId(), data,
									$scope.start, $scope.pageSize,
									$scope.keywords,
									$scope.selectedSorting.field,
									$scope.selectedFilter.name,
									$scope.uncheckedPeopleIds).then(
									function(resultData) {

										$scope.results = resultData;

										fillStars();
										fillTaggedPeople();

										$scope.documentsReady = true;
									});
						});
	};

	function fillStars() {

		$scope.results.documents.forEach(function(doc) {

			if (doc.bookmarked == null) {

				doc.starFilePath = $scope.emptyStar;

			} else {

				doc.starFilePath = $scope.fullStar;
			}
		});
	}

	function fillTaggedPeople() {

		var data = {
			nodes : $scope.nodes
		};

		MyFamilyService.getViewDocuments(AuthenticationService.getUserId(),
				data, null, null, $scope.keywords, null,
				$scope.selectedFilter.name, []).then(
				function(resultData) {

					var allDocuments = resultData.documents;
					allDocuments.forEach(function(doc) {

						for (taggedNodesIndex in doc.taggedNodes) {

							var taggedNode = doc.taggedNodes[taggedNodesIndex];

							$scope.taggedPeople.forEach(function(n) {

								if (n.originalId == taggedNode.id) {

									if ($scope.uncheckedPeopleIds
											.indexOf(n.originalId) == -1) {

										found = true;
										n.checked = true;
									}

									n.count++;
								}
							});
						}
					});
				});

	}

	$scope.toggleTaggedUser = function(user) {

		var userIndex = $scope.uncheckedPeopleIds.indexOf(user.originalId);

		if (userIndex > -1) {

			$scope.uncheckedPeopleIds.splice(userIndex, 1);

		} else {

			$scope.uncheckedPeopleIds.push(user.originalId);
		}

		var currentSearch = $location.search();
		currentSearch.excludeTagged = $scope.uncheckedPeopleIds.toString();

		$location.search(currentSearch);
	};

	$scope.sumResults = function(start, pageSize) {

		var sum = start + pageSize;

		if (sum > $scope.results.total) {

			return $scope.results.total;
		}

		return sum;
	};

	$scope.navigateToPage = function(nextPage, nextStart) {

		$scope.currentPage = nextPage;

		var currentSearch = $location.search();
		currentSearch.page = nextPage;
		currentSearch.start = nextStart;

		$location.search(currentSearch);
	};

	$scope.numberOfPages = function() {

		return Math.ceil($scope.results.total / $scope.pageSize);
	};

	$scope.updateTitle = function() {

		var currentSearch = $location.search();
		currentSearch.title = $scope.title;

		$location.search(currentSearch);
	};

	$scope.updateKeywords = function() {

		var currentSearch = $location.search();
		currentSearch.keywords = $scope.keywords;

		$location.search(currentSearch);
	};

	$scope.updateSort = function() {

		var currentSearch = $location.search();
		currentSearch.sort = $scope.selectedSorting.field;

		$location.search(currentSearch);
	};

	$scope.updateFilter = function() {

		var currentSearch = $location.search();
		currentSearch.filter = $scope.selectedFilter.name;

		$location.search(currentSearch);
	};

	$scope.toggleBookmark = function(document) {

		if (document.starFilePath == $scope.emptyStar) {

			MyFamilyService.addToBookmarks(AuthenticationService.getUserId(),
					document.id).then(function(result) {

				if (result.msg == "bookmark added") {

					document.starFilePath = $scope.fullStar;
				}
			});

		} else {

			MyFamilyService.removeFromBookmarks(
					AuthenticationService.getUserId(), document.id).then(
					function(result) {

						if (result.msg == "bookmark deleted") {

							if ($scope.selectedFilter.name == "All") {

								document.starFilePath = $scope.emptyStar;
							} else {

								$scope.search();
							}
						}
					});
		}
	};

	$scope.getDate = function(unformattedDate) {

		return commons.getDate(unformattedDate);
	};

	function init() {

		d3.select("svg").remove();

		$scope.documentsReady = false;
		$scope.results = {};
		$scope.results.total = 0;

		$scope.sortingCriteria =

		[ {
			name : 'Date',
			field : 'date',
			url : 'date'
		}, {
			name : 'Last uploaded',
			field : 'upload',
			url : 'upload'
		}, {
			name : 'Last updated',
			field : 'update',
			url : 'update'
		} ];

		for ( var i = 0; i < $scope.sortingCriteria.length; i++) {

			var currentSortingCriteria = $scope.sortingCriteria[i];

			if (currentSortingCriteria.url == $location.search().sort) {

				$scope.selectedSorting = currentSortingCriteria;
			}
		}

		if (!$scope.selectedSorting) {

			$scope.selectedSorting = $scope.sortingCriteria[0];
		}

		$scope.filterCriteria =

		[ {
			name : 'All',
		}, {
			name : 'Bookmarked',
		} ];

		$scope.fullStar = "/myfamily/img/star-yellow-full.png";
		$scope.emptyStar = "/myfamily/img/star-yellow-empty.png";

		var urlFilter = $location.search().filter;
		if (urlFilter) {

			$scope.selectedFilter = {};
			$scope.selectedFilter.name = urlFilter;

		} else {

			$scope.selectedFilter = $scope.filterCriteria[0];
		}

		for ( var i = 0; i < $scope.filterCriteria.length; i++) {

			var currentFilterCriteria = $scope.filterCriteria[i];

			if (currentFilterCriteria.name == $location.search().filter) {

				$scope.selectedFilter = currentFilterCriteria;
			}
		}

		var urlTitle = $location.search().title;

		if (urlTitle) {

			$scope.title = urlTitle;

		} else {

			$scope.title = "";
		}

		var urlKeywords = $location.search().keywords;

		if (urlKeywords) {

			$scope.keywords = urlKeywords;

		} else {

			$scope.keywords = "";
		}

		var urlCurrentPage = parseInt($location.search().page);

		if (urlCurrentPage) {

			$scope.currentPage = urlCurrentPage;

		} else {

			$scope.currentPage = 1;
		}

		var urlPageSize = parseInt($location.search().pageSize);

		if (urlPageSize) {

			$scope.pageSize = urlPageSize;

		} else {

			$scope.pageSize = 10;
		}

		var urlStart = parseInt($location.search().start);

		if (urlStart) {

			$scope.start = urlStart;

		} else {

			$scope.start = 0;
		}

		var urlSort = parseInt($location.search().sort);

		if (urlSort) {

			$scope.sort = urlSort;

		} else {

			$scope.sort = 0;
		}

		var excludeTagged = $location.search().excludeTagged;

		if (excludeTagged) {

			$scope.uncheckedPeopleIds = JSON.parse("[" + excludeTagged + "]");

		} else {

			$scope.uncheckedPeopleIds = [];
		}

		$scope.$watch('keywords', function(newValue, oldValue) {

			if (oldValue != "" && newValue == "") {

				$scope.updateKeywords();
			}
		});

		$scope.getFileName = function(docName) {

			return docName.substr(-4) === ".pdf" ? MyFamilyService
					.getFilePath(defaultDocumentImg) : MyFamilyService
					.getFilePath(docName);
		};
	}
});