var exploreController = controllers
		.controller(
				"ExploreCtrl",
				function($scope, $location, MyFamilyService,
						AuthenticationService) {

					init();

					$scope.search = function() {

						MyFamilyService
								.getGraphView(
										AuthenticationService.getUserId(), 4)
								.then(
										function(resultData) {

											var data = {
												nodes : resultData.nodes
											};

											MyFamilyService
													.getViewDocuments(
															AuthenticationService
																	.getUserId(),
															data,
															$scope.start,
															$scope.pageSize,
															$scope.keywords,
															$scope.selectedSorting.field,
															$scope.selectedFilter.name)
													.then(
															function(resultData) {

																$scope.results = resultData.documents;
																$scope.results.total = resultData.total;
																$scope.documentsReady = true;
															});
										});
					};

					$scope.getFilePath = function(docName) {

						return MyFamilyService.getFilePath(docName);
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

						return Math
								.ceil($scope.results.total / $scope.pageSize);
					};

					$scope.bookmark = function(document) {

						// TODO
					};
					
					$scope.filter = function() {

						$scope.search();
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

							if (currentSortingCriteria.url == $location
									.search().sort) {

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

						var urlFilter = $location.search().filter;
						if (urlFilter) {

							$scope.selectedFilter = {};
							$scope.selectedFilter.name = urlFilter;

						} else {

							$scope.selectedFilter = $scope.filterCriteria[0];
						}

						for ( var i = 0; i < $scope.filterCriteria.length; i++) {

							var currentFilterCriteria = $scope.filterCriteria[i];

							if (currentFilterCriteria.name == $location
									.search().filter) {

								$scope.selectedFilter = currentFilterCriteria;
							}
						}

						var urlKeywords = parseInt($location.search().keywords,
								10);

						if (urlKeywords) {

							$scope.keywords = urlKeywords;

						} else {

							$scope.urlKeywords = "";
						}

						var urlCurrentPage = parseInt($location.search().page,
								10);

						if (urlCurrentPage) {

							$scope.currentPage = urlCurrentPage;

						} else {

							$scope.currentPage = 1;
						}

						var urlPageSize = parseInt($location.search().pageSize,
								10);

						if (urlPageSize) {

							$scope.pageSize = urlPageSize;

						} else {

							$scope.pageSize = 10;
						}

						var urlStart = parseInt($location.search().start, 10);

						if (urlStart) {

							$scope.start = urlStart;

						} else {

							$scope.start = 0;
						}

						$scope.$watch('keywords', function() {

							$scope.search();
						});
					}
				});