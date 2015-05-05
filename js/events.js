function docMouseovered(d) {

	var selection = d3.select(this);
	selection.moveToFront();

	var doc = selection[0][0];

	doc.width.baseVal.value = 200;
	doc.height.baseVal.value = 200;
	doc.x.baseVal.value -= 50;
	doc.y.baseVal.value -= 50;

	node.classed("node--tagged", function(n) {

		if (d.tagged) {
			var nodeIndex = d.tagged.indexOf(n.index);
			if (nodeIndex > -1) {
				return true;
			}
		}

		return false;
	});
};

function docMouseouted(d) {

	var selection = d3.select(this);
	var doc = selection[0][0];

	doc.width.baseVal.value = 100;
	doc.height.baseVal.value = 100;
	doc.x.baseVal.value += 50;
	doc.y.baseVal.value += 50;

	node.classed("node--tagged", false);
};

function docClicked(d) {

	var selection = d3.select(this);
	var grandParent = d3.select(this.parentNode.parentNode);

	var doc = selection[0][0];

	grandParent.append("image").attr("class", "zoomedDoc").moveToFront().attr(
			"width", 1200).attr("height", 1200).attr("xlink:href",
			doc.href.baseVal).attr("x", d.x - 400).attr("y", d.y - 500);
	grandParent.append("text").attr("class", "closeDocText").attr("x",
			d.x + 710).attr("y", d.y - 290).text("[X]").on("click",
			closeDocClicked);

	d3.event.stopPropagation();
};

function closeDocClicked() {

	selectedNode.selectAll(".zoomedDoc").remove();
	selectedNode.selectAll(".closeDocText").remove();
}

function backMain() {

	if (currentPage > 0) {
		currentPage--;
		populateThumbnails(currentPage, true);
	}
}

function forwardMain() {

	if (currentPage < maxPage) {
		currentPage++;
		populateThumbnails(currentPage, false);
	}
}

var selectedNode;

function clickNode(d) {

	if (d3.event.defaultPrevented) {
		return;
	}

	selectedNode = d3.select(this).moveToFront().append("g").attr("class",
			"selection");

	var centerX = width / 2;
	var centerY = height / 2;
	var maxRowSize = 10;

	selectedNode.append("circle").attr('r', 800).attr("cx", centerX).attr("cy",
			centerY).attr('class', "node--selected");

	selectedNode.append("image").attr("width", 200).attr("height", 200).attr(
			'class', "profile-image--selected").attr("x", centerX - 100).attr(
			"y", -50).attr("xlink:href", "./img/" + d.img);

	selectedNode.append("text").attr('class', "label--selected").attr("y", -80)
			.attr("x", centerX - 50).text(d.label);

	$.get(serverUrl + "/documents/" + d.index,
			function(documentsString) {

				var documents = JSON.parse(documentsString);

				var offset = 0;

				for (docIndex in documents) {

					var doc = documents[docIndex];

					var thumbnail = selectedNode.append("g");
					var docNode = thumbnail.append("image");

					docNode.attr("width", 100).attr("height", 80).attr('class',
							"doc--selected").attr("xlink:href",
							"./img/" + doc.file)
							.attr("x", centerX / 2 + offset).attr(
									"y",
									centerY / 2 + 100
											* Math.floor(docIndex / maxRowSize))
							.on("click", docClicked);

					offset += 100;
					if (offset >= 100 * maxRowSize) {
						offset = 0;
					}
				}
			});

	d3.event.stopPropagation();
};

function clickSvg(d) {

	var sel = svg.selectAll(".selection");
	sel.remove();
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
