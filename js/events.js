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

			for (taggedIndex in d.tagged) {

				var taggedNode = d.tagged[taggedIndex];
				if (taggedNode["node"] == parseInt(n.index)) {
					return true;
				}
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

	if (d3.event.defaultPrevented) {
		return;
	}

	var selection = d3.select(this);
	var grandParent = d3.select(this.parentNode.parentNode);

	var doc = selection[0][0];
	
	grandParent.append("image").attr("class", "zoomedDoc").moveToFront().attr(
			"width", 1200).attr("height", 1200).attr("xlink:href",
			doc.href.baseVal).attr("x", 1200).attr("y", -100);
	grandParent.append("text").attr("class", "closeDocText")
			.attr("x", 2300).attr("y", 0).text("[X]").on("click",
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

var docDrag = d3.behavior.drag().on("dragstart", docDragstarted).on("drag",
		docDragged).on("dragend", docDragended);

function clickNode(d) {

	if (d3.event.defaultPrevented) {
		return;
	}

	selectedNode = d3.select(this).moveToFront().append("g").attr("class",
			"selection");

	var centerX = width / 5;
	var centerY = height / 2;
	var maxRowSize = 10;

	selectedNode.append("circle").attr('r', 800).attr("cx", centerX).attr("cy",
			centerY).attr('class', "node--selected");

	selectedNode.append("image").attr("width", 200).attr("height", 200).attr(
			'class', "profile-image--selected").attr("x", centerX - 100).attr(
			"y", 0).attr("xlink:href", "./img/" + d.img);

	selectedNode.append("text").attr('class', "label--selected").attr("y", -30)
			.attr("x", centerX - 50).text(d.label);

	$
			.get(
					serverUrl + "/documents/" + d.index,
					function(documentsString) {

						var documents = JSON.parse(documentsString);

						var container = selectedNode.append("g");

						var offset = 0;

						for (docIndex in documents) {

							var doc = documents[docIndex];

							var docNode = container.append("image");

							var defaultX = centerX / 2 + offset;
							var defaultY = centerY / 2 + 100
									* Math.floor(docIndex / maxRowSize);

							var filtered = doc.tagged.filter(function(n) {
								return n.node == d.index;
							});

							docNode
									.attr("width", 100)
									.attr("id", doc.index)
									.attr("height", 80)
									.attr("xlink:href", "./img/" + doc.file)
									.attr("cursor", "move")
									.attr(
											"x",
											function() {
												if (filtered) {
													return filtered[0].position ? filtered[0].position.x
															: defaultX;
												} else {
													return defaultX;
												}
											})
									.attr(
											"y",
											function() {
												if (filtered) {
													return filtered[0].position ? filtered[0].position.y
															: defaultY;
												} else {
													return defaultY;
												}
											}).on("click", docClicked).call(
											docDrag);

							offset += 100;
							if (offset >= 100 * maxRowSize) {
								offset = 0;
							}
						}
					});

	d3.event.stopPropagation();
};

function clickSvg(d) {

	if (d3.event.defaultPrevented) {
		return;
	}

	var sel = svg.selectAll(".selection");
	sel.remove();
};

function zoomed() {

	container.attr("transform", "translate(" + d3.event.translate + ")scale("
			+ d3.event.scale + ")");
}

function nodeDragstarted(d) {

	d3.event.sourceEvent.stopPropagation();
	d3.select(this).classed("dragging", true);
}

function nodeDragged(d) {

	d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);

}

function nodeDragended(d) {

	d3.select(this).classed("dragging", false);

	$.get(serverUrl + '/updateNode?label=' + d.label + '&x=' + d.x + '&y='
			+ d.y);
}

function docDragstarted(d) {

	d3.event.sourceEvent.stopPropagation();
	d3.select(this).classed("dragging", true);
}

function docDragged(d) {

	var sel = d3.select(this);
	sel.attr("x", d.x = d3.event.x - parseInt(sel.attr("width")) / 2).attr("y",
			d.y = d3.event.y - parseInt(sel.attr("height")) / 2);
}

function docDragended(d) {

	var sel = d3.select(this);
	sel.classed("dragging", false);

	var document = sel[0][0];
	var x = document.x.baseVal.value;
	var y = document.y.baseVal.value;
	var id = document.attributes.id.nodeValue;

	$.get(serverUrl + '/updateDoc?node=' + d.index + '&index=' + id + '&x=' + x
			+ '&y=' + y);
}
