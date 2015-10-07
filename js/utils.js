var commons = window.commons || {};

commons.getCircleSize = function(thisId, thisLevel, userId) {

	var circleSize;

	if (thisId == userId) {

		circleSize = 20 * thisLevel * 2;

	} else {

		circleSize = 20 * thisLevel;
	}

	return circleSize;
};

commons.getNodeClass = function(d, userId) {

	if (d.originalId == userId) {

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
