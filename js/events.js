function docMouseovered(d) {

	detail.transition().duration(200).style("opacity", .85);
	detail.html("<img src= './img/" + d.file + "' />");
};

function docMouseouted(d) {

	// detail.html("");
};

function clickNode(d) {

	if (d3.event.defaultPrevented) {
		return;
	}

	var selection = d3.select(this);
	var circle = selection.select("circle")[0][0];

	var x = circle.cx.baseVal.value;
	var y = circle.cy.baseVal.value;

	selection.append("circle").attr('r', 200).attr("cx", x).attr("cy", y).attr(
			'class', "node--selected");

	selection.moveToFront();

	selection.append("image").attr("width", 200).attr("height", 200).attr(
			'class', "profile-image--selected").attr("x", x - 100).attr("y",
			y - 100).attr("xlink:href", "./img/" + d.img);

	selection.append("text").attr('class', "label--selected")
			.attr("y", y - 120).attr("x", x - 50).text(d.label);

	d3.event.stopPropagation();
};

function clickSvg(d) {

	var selection = d3.select(this);

	selection.select(".node--selected").remove();
	selection.select(".profile-image--selected").remove();
	selection.select(".label--selected").remove();
};

function zoomed() {

	container.attr("transform", "translate(" + d3.event.translate + ")scale("
			+ d3.event.scale + ")");
}

function dragstarted(d) {

	d3.event.sourceEvent.stopPropagation();
	d3.select(this).classed("dragging", true);
}

function dragged(d) {

	d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);

}

function dragended(d) {

	d3.select(this).classed("dragging", false);

	$.get(serverUrl + '/updateNode?label=' + d.label + '&x=' + d.x + '&y='
			+ d.y);
}
