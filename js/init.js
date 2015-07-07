var initViews = function($scope) {

	$scope.views = [ {
		id : 0,
		label : 'Family as a child'
	}, {
		id : 1,
		label : 'Family as a parent'
	}, {
		id : 2,
		label : 'Pedigree'
	}, {
		id : 3,
		label : 'Descendants'
	}, {
		id : 4,
		label : 'Extended family'
	} ];

	$scope.selectedView = $scope.views[4];

};