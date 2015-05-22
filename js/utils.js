d3.selection.prototype.moveToFront = function() {

	return this.each(function() {

		this.parentNode.appendChild(this);
	});
};

function getDate(doc) {

	var date = "";

	if (doc.year && doc.month && doc.day) {

		date = doc.day + " " + getMonth(doc.month) + " " + doc.year;
	} else if (doc.year && doc.month) {

		date = getMonth(doc.month) + " " + doc.year;
	} else if (doc.year) {

		date = doc.year;
	} else {
		date = "no date available";
	}

	return date;
}

function getMonth(monthNumber) {

	var month = "";

	switch (monthNumber) {

	case 1:
		month = "January";
		break;
	case 2:
		month = "February";
		break;
	case 3:
		month = "March";
		break;
	case 4:
		month = "April";
		break;
	case 5:
		month = "May";
		break;
	case 6:
		month = "June";
		break;
	case 7:
		month = "July";
		break;
	case 8:
		month = "August";
		break;
	case 9:
		month = "September";
		break;
	case 10:
		month = "October";
		break;
	case 11:
		month = "November";
		break;
	case 12:
		month = "December";
		break;
	}

	return month;
}

function wrap(text, width) {
	text
			.each(function() {

				var text = d3.select(this);
				var words = text.text().split(/\s+/).reverse();
				var word, line = [];
				var lineNumber = 0;
				var lineHeight = 0.45; // ems

				var x = text.attr("x");
				var y = text.attr("y");
				var dy = parseFloat(text.attr("dy"));

				var tspan = text.text(null).append("tspan").attr("x", x).attr(
						"y", y).attr("dy", dy + "em");

				while (word = words.pop()) {

					line.push(word);
					tspan.text(line.join(" "));

					if (tspan.node().getComputedTextLength() > width) {

						line.pop();
						tspan.text(line.join(" "));
						line = [ word ];
						tspan = text.append("tspan").attr("x", x).attr("y", y)
								.attr("dy",
										++lineNumber * lineHeight + dy + "em")
								.text(word);
					}
				}
			});
};
