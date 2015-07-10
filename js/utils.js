var commons = window.commons || {};

commons.getCircleSize = function(d, userLabel) {

	var circleSize;

	if (d.label.toUpperCase() == userLabel.toUpperCase()) {

		circleSize = (125 / d.level) * 1.5;

	} else {

		circleSize = 125 / d.level;
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
		var date = new Date(dateString.substring(0, dateString.indexOf('T')));
		return date.toDateString();
	}
};

commons.getFormattedDate = function(dateString) {

	if (!dateString || dateString == '') {

		return "";
	} else {
		// yyyy-mm-dd
		var originalFormat = dateString.substring(0, dateString.indexOf('T'));
		return originalFormat;
	}
};
