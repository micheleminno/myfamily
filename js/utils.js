d3.selection.prototype.moveToFront = function() {

	return this.each(function() {

		this.parentNode.appendChild(this);
	});
};

function getDate(dateString) {

	if (!dateString || dateString == '') {

		return "No date";
	} else {
		var date = new Date(dateString.substring(0, dateString.indexOf('T')));
		return date.toDateString();
	}
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
