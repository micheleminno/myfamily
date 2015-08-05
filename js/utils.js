var commons = window.commons || {};

commons.getCircleSize = function(thisLabel, thisLevel, userLabel) {

	var circleSize;

	if (thisLabel.toUpperCase() == userLabel.toUpperCase()) {

		circleSize = (125 / thisLevel) * 1.5;

	} else {

		circleSize = 125 / thisLevel;
	}

	return circleSize;
};

commons.getNodeClass = function(d, userLabel) {

	if (d.label.toUpperCase() == userLabel.toUpperCase()) {

		nodeClass = "node me";

	} else if (d.acquired) {

		nodeClass = "node acquired";

	} else if (d.leaf) {

		nodeClass = "node leaf";

	} else {

		nodeClass = "node core";
	}

	return nodeClass;
};

commons.getDate = function(dateString) {

	if (!dateString || dateString == '') {

		return "No date";

	} else {

		TIndex = dateString.indexOf('T');

		if (TIndex > -1) {

			dateString = dateString.substring(0, TIndex);
			var newDateString = moment(dateString, 'YYYY-MM-DD').format(
					'MMMM Do YYYY');

			return newDateString;

		} else {

			var newDateString = moment(dateString, 'DD/MM/YYYY').format(
					'MMMM Do YYYY');

			return newDateString;
		}
	}
};
