var serverUrl = 'http://localhost:8091';
var commons = window.commons || {};

var documentsRender = function(scope, $rootScope) {

	if (!scope.documents) {

		return;
	}

	var onSelectedNodeMenu = [ {
		title : 'Add document',
		action : function(elm, d, i) {

			$('#add-taggedArea').html('');
			$('#add-taggedArea').append(
					'<li id="' + d.originalId + '">' + d.label + '</li>');

			fillTaggedPersons($rootScope.nodes, 'add');

			$('#addDocumentModal').modal('show');
		}
	} ];

	d3.selection.prototype.moveToFront = function() {

		return this.each(function() {

			this.parentNode.appendChild(this);
		});
	};

	var onHeritageMenu = [ {
		title : 'Add document',
		action : function(elm, d, i) {

			$('#add-taggedArea').html('');
			$('#add-taggedArea').append('<li id="-1">Heritage</li>');

			$('#addDocumentModal #tagged').hide();
			$('#addDocumentModal').modal('show');
		}
	} ];

	var onDocumentMenu = [
			{
				title : 'Edit',
				action : function(elm, d, i) {

					$
							.get(
									serverUrl + '/documents/' + elm.id,
									function(data) {

										if (data.document != -1) {

											$('#edit-taggedArea').html('');

											var tagged = data.document.tagged;
											for ( var taggedIndex in tagged) {

												tag = tagged[taggedIndex];
												if (tag.id != -1) {
													$('#edit-taggedArea')
															.append(
																	'<li id="'
																			+ tag.id
																			+ '">'
																			+ tag.label
																			+ '<a id="remove-'
																			+ tag.id
																			+ '" style="margin-left: 5px" href="">(remove)</a>'
																			+ '</li>');
												}
											}

											fillTaggedPersons($rootScope.nodes,
													'edit');

											if (d) {
												$('#edit-nodeId').text(
														d.originalId);
											}

											$('#edit-docId').text(
													data.document.id);
											$('#edit-file').text(
													data.document.file);
											$('#edit-title').val(
													data.document.title);

											$('#edit-date')
													.val(
															commons
																	.getFormattedDate(data.document.date));

											$('#editDocumentModal').modal(
													'show');
										}
									});
				}
			},
			{
				title : 'Remove',
				action : function(elm, d, i) {

					$.get(serverUrl + '/documents/' + elm.id + '/remove',
							function() {

								removeDocument(elm.id);

								// register event
								$.get(serverUrl + '/events/add/document/'
										+ elm.id + "?type=removal&node="
										+ d.originalId);

							});
				}
			} ];

	var svg = null;

	function drawTree(userId, userLabel, viewId, viewLabel) {

		svg = d3.select("svg");
		svg.selectAll(".ground").on("click", groundClicked);

		$rootScope.node.each(function(d) {

			currentNode = d3.select(this);

			if (d.person) {

				currentNode.on("click", clickNode);
			}
		});

		svg.selectAll(".left-arrow").on("click", backMain);
		svg.selectAll(".right-arrow").on("click", forwardMain);

		fillStream();
	}

	drawTree(scope.documents.userId, scope.documents.userLabel,
			scope.documents.viewId, scope.documents.viewLabel);

	function fillStream() {

		var documentsSize = scope.documents.length;

		if (documentsSize > 0) {

			currentPage = Math.floor(documentsSize
					/ ($rootScope.docRowSize + 1));
			maxPage = currentPage;
			populateThumbnails(currentPage, true);
		}
	}

	function populateThumbnails(currentPage, back) {

		var minIndex = currentPage * $rootScope.docRowSize;

		for (docIndex in scope.documents) {

			var doc = scope.documents[docIndex];
			doc.index = parseInt(docIndex);
		}

		var currentDocuments = scope.documents.filter(function(d) {

			return d.index >= minIndex
					&& d.index < minIndex + $rootScope.docRowSize;
		});

		var doc = $rootScope.streamNode.selectAll(".doc");
		var sel = doc.data(currentDocuments, function(d) {
			return d.index;
		});

		var oldTarget = back ? $rootScope.streamWidth : $rootScope.streamX;
		var newTarget = back ? $rootScope.streamX : $rootScope.streamWidth;

		var newDelay = function(d) {
			return back ? (currentDocuments.length - (d.index - minIndex))
					* (duration / 15) : (d.index - minIndex) * (duration / 10);
		};
		var oldDelay = function(d) {
			return back ? (currentDocuments.length - (d.index - minIndex))
					* (duration / 15) : (d.index - minIndex) * (duration / 10);
		};

		var duration = 300;

		sel
				.enter()
				.append("image")
				.attr("class", "doc")
				.attr(
						"xlink:href",
						function(d) {
							return d.file.substr(-4) === ".pdf" ? "./docs/default_pdf.png"
									: "./docs/" + d.file;
						}).attr("width", 100).attr("height",
						$rootScope.streamHeight).attr("y", $rootScope.streamY)
				.attr("index", function(d) {
					return d.index;
				}).attr("id", function(d) {
					return d.id;
				}).attr("title", function(d) {
					return d.title;
				}).attr("url", function(d) {
					return "./docs/" + d.file;
				}).attr("date", function(d) {

					return commons.getDate(d.date);

				}).on("mouseover", thumbnailMouseovered).on("mouseout",
						thumbnailMouseouted).on("click", thumbnailClicked)
				.attr("cursor", "pointer").attr("x", newTarget).transition()
				.duration(duration).delay(newDelay).ease("linear").attr(
						"x",
						function(d) {
							return $rootScope.streamX + (d.index - minIndex)
									* 100;
						});

		sel.exit().transition().duration(duration).delay(oldDelay).ease(
				"linear").attr("x", oldTarget).remove();
	}

	function docClicked(d) {

		if (d3.event.defaultPrevented) {
			return;
		}

		svg.selectAll(".docText").remove();
		svg.selectAll(".docText-small").remove();
		svg.selectAll(".zoomedDoc").remove();

		var selection = d3.select(this);

		var grandParent = d3.select(this.parentNode.parentNode);

		grandParent.moveToFront();

		var doc = selection[0][0];

		if (doc.attributes.url.nodeValue.substr(-4) === ".pdf") {

			window.open(siteUrl + doc.attributes.url.nodeValue.substr(1),
					'_blank');

		} else {

			grandParent.append("rect").attr("class", "frame").attr("width",
					1205).attr("height", 1014).attr("xlink:href",
					doc.href.baseVal).attr("x", 997.5).attr("y", -182).on(
					"click", zoomedDocClicked).attr("cursor", "auto");

			grandParent.append("image").attr("class", "zoomedDoc")
					.moveToFront().attr("width", 1200).attr("height", 1010)
					.attr("xlink:href", doc.href.baseVal).attr("x", 1000).attr(
							"y", -180).on("click", zoomedDocClicked).attr(
							"cursor", "auto");

			grandParent.append("text").attr("class", "docText").attr("x", 1800)
					.attr("y", 900).text(doc.attributes.title.nodeValue);

			grandParent.append("text").attr("class", "docText-small").attr("x",
					1800).attr("y", 1000).text(
					"(on " + doc.attributes.date.nodeValue + ")");

			grandParent.append("text").attr("class", "closeDoc")
					.attr("x", 2125).attr("y", -220).text("[close]").attr(
							"cursor", "pointer").on("click", closeDocClicked);

		}

		d3.event.stopPropagation();
	}

	function closeDocClicked() {

		svg.selectAll(".zoomedDoc").remove();
		svg.selectAll(".frame").remove();
		svg.selectAll(".docText").remove();
		svg.selectAll(".docText-small").remove();
		svg.selectAll(".closeDoc").remove();

		d3.event.stopPropagation();
	}

	$('#updateDocument').click(
			function() {

				$('#editDocumentModal').modal('hide');

				var id = $('#edit-docId').text();
				var title = $('#edit-title').val();
				var date = $('#edit-date').val() + " 12:00:00";

				var tagged = [];

				$('#edit-taggedArea li').each(function() {

					personId = $(this).attr('id');
					tagged.push(parseInt(personId));
				});

				var url = serverUrl + '/documents/' + id + '/update?title='
						+ title + '&date=' + date + '&tagged='
						+ JSON.stringify(tagged);
				$.get(url, function() {

					var nodeId = $('#edit-nodeId').text();
					if (tagged.indexOf(nodeId) > -1) {

						removeDocument(id);
					}
				});
			});

	function zoomedDocClicked(d) {

		d3.event.stopPropagation();
	}

	function backMain() {

		if (currentPage > 0) {
			currentPage--;
			populateThumbnails(currentPage, true);
		}

		d3.event.stopPropagation();
	}

	function forwardMain() {

		if (currentPage < maxPage) {
			currentPage++;
			populateThumbnails(currentPage, false);
		}

		d3.event.stopPropagation();
	}

	var docDrag = d3.behavior.drag().on("dragstart", docDragstarted).on("drag",
			docDragged).on("dragend", docDragended);

	function drawDoc(doc, container, centerX, centerY, offset, maxRowSize) {

		var docNode = container.append("image");

		var x, y;

		if (doc.position) {

			x = doc.position.x;
			y = doc.position.y;

		} else {

			var defaultX = centerX / 2 - 300 + offset;
			var defaultY = centerY + 100 * Math.floor(docIndex / maxRowSize);

			x = defaultX;
			y = defaultY;

		}

		docNode
				.attr("width", 100)
				.attr("id", doc.id)
				.attr("title", doc.title)
				.attr("url", "./docs/" + doc.file)
				.attr("date", commons.getDate(doc.date))
				.attr("height", 80)
				.attr(
						"xlink:href",
						function() {
							return doc.file.substr(-4) === ".pdf" ? "./docs/default_pdf.png"
									: "./docs/" + doc.file;
						}).attr("class", function() {

					return "myCursor-pointer-move";
				}).attr("x", x).attr("y", y).on("click", docClicked).on(
						"mouseover", thumbnailMouseovered).on("mouseout",
						thumbnailMouseouted).call(docDrag);

		docNode.on('contextmenu', d3.contextMenu(onDocumentMenu));
	}

	function placeDocuments(serviceUrl, selectedNode, nodeIndex, centerX,
			centerY, maxRowSize) {

		$.get(serviceUrl, function(data) {

			var documents = data.documents;

			var container = selectedNode.append("g").attr("class",
					"docContainer");

			var offset = 0;

			for (docIndex in documents) {

				var doc = documents[docIndex];

				drawDoc(doc, container, centerX, centerY, offset, maxRowSize);

				offset += 100;

				if (offset >= 100 * maxRowSize) {

					offset = 0;
				}
			}
		});
	}

	function thumbnailMouseovered(d) {

		var selection = d3.select(this);
		selection.moveToFront();

		var doc = selection[0][0];

		var parent = d3.select(this.parentNode);

		doc.width.baseVal.value = 200;
		doc.height.baseVal.value = 200;
		doc.x.baseVal.value -= 50;
		doc.y.baseVal.value -= 50;

		if (!$rootScope.selectedNodeId
				|| doc.attributes.url.nodeValue.substr(-4) === ".pdf") {

			parent.append("text").attr("class", "thumbnailText").attr("x",
					doc.x.baseVal.value).attr("y", doc.y.baseVal.value - 20)
					.text(doc.attributes.title.nodeValue);

			if (!$rootScope.selectedNodeId) {

				parent.append("text").attr("class", "thumbnailText").attr("x",
						doc.x.baseVal.value).attr("y",
						doc.y.baseVal.value + 235).text(
						doc.attributes.date.nodeValue);

				$rootScope.node.classed("node--tagged", function(n) {

					if (d.node) {

						for (nodeIndex in d.node) {

							var taggedNode = d.node[nodeIndex];
							if (taggedNode == n.originalId) {
								return true;
							}
						}
					}

					return false;
				});
			}
		}
	}

	function thumbnailMouseouted(d) {

		svg.selectAll(".thumbnailText").remove();
		svg.selectAll(".thumbnail-frame").remove();

		var selection = d3.select(this);
		var doc = selection[0][0];

		doc.width.baseVal.value = 100;
		doc.height.baseVal.value = 100;
		doc.x.baseVal.value += 50;
		doc.y.baseVal.value += 50;

		$rootScope.node.classed("node--tagged", false);
	}

	function thumbnailClicked(d) {

		svg.selectAll(".docText").remove();
		svg.selectAll(".docText-small").remove();
		svg.selectAll(".zoomedDoc").remove();
		svg.selectAll(".frame").remove();

		var selection = d3.select(this);

		var parent = d3.select(this.parentNode);

		parent.moveToFront();

		var doc = selection[0][0];

		if (doc.attributes.url.nodeValue.substr(-4) === ".pdf") {

			window.open(siteUrl + doc.attributes.url.nodeValue.substr(1),
					'_blank');

		} else {

			parent = parent.append("g").attr("class", "selection");

			parent.append("rect").attr("class", "frame").attr("width", 1205)
					.attr("height", 1014).attr("xlink:href", doc.href.baseVal)
					.attr("x", 997.5).attr("y", -182);
			parent.append("image").attr("class", "zoomedDoc").moveToFront()
					.attr("width", 1200).attr("height", 1010).attr(
							"xlink:href", doc.href.baseVal).attr("x", 1000)
					.attr("y", -180);

			parent.append("text").attr("class", "docText").attr("x", 1800)
					.attr("y", 900).text(doc.attributes.title.nodeValue);

			parent.append("text").attr("class", "docText-small")
					.attr("x", 1800).attr("y", 1000).text(
							"(on " + doc.attributes.date.nodeValue + ")");

			parent.append("text").attr("class", "closeDoc").attr("x", 2125)
					.attr("y", -220).text("[close]").attr("cursor", "pointer")
					.on("click", closeDocClicked);
		}

		d3.event.stopPropagation();
	}

	function groundClicked(d) {

		var selectedNode = d3.select(this.parentNode).moveToFront().append("g")
				.attr("class", "selection").style("pointer-events", "click");

		selectedNode.append("rect").attr("class", "ground--selected").attr(
				"width", 3100).attr("height", 350).attr("x", -700).attr("y",
				1050).attr("cursor", "auto").on(
				'contextmenu',
				d3.contextMenu(onHeritageMenu, function() {

					$rootScope.uploadedDocumentPosition = [ this.event.x + 800,
							this.event.y + 800 ];
				}));

		selectedNode.append("text").attr('class', "label--selected").attr("y",
				1130).attr("x", -650).text("Heritage");

		$rootScope.selectedNodeId = -1;

		var centerX = -200;
		var centerY = 1100;
		var maxRowSize = 40;

		placeDocuments(serverUrl + "/documents?node=-1&relation=tagged",
				selectedNode, -1, centerX, centerY, maxRowSize);

		d3.event.stopPropagation();
	}

	function profileNodeClicked(d) {

		d3.event.stopPropagation();
	}

	function profileMouseovered(d) {

		var selection = d3.select(this);
		selection.moveToFront();

		var container = selection[0][0];

		rect = container.children[0];

		rect.width.baseVal.value = 660;
		rect.height.baseVal.value = 660;
		rect.x.baseVal.value -= 170;
		rect.y.baseVal.value -= 150;

		image = container.children[1];

		image.width.baseVal.value = 600;
		image.height.baseVal.value = 600;
		image.x.baseVal.value -= 150;
		image.y.baseVal.value -= 130;
	}

	function profileMouseouted(d) {

		var selection = d3.select(this);

		var container = selection[0][0];

		rect = container.children[0];

		rect.width.baseVal.value = 220;
		rect.height.baseVal.value = 220;
		rect.x.baseVal.value += 170;
		rect.y.baseVal.value += 150;

		image = container.children[1];

		image.width.baseVal.value = 200;
		image.height.baseVal.value = 200;
		image.x.baseVal.value += 150;
		image.y.baseVal.value += 130;
	}

	function profileImageClicked(d) {

		nodeIdToUpdate = d.originalId;

		$('#profile-img-upload').val(null);
		$('#profile-img-upload').click();
		d3.event.stopPropagation();
	}

	commons.selectNode = function(clickedNode, d) {

		$rootScope.selectedNode = d3.select(clickedNode).moveToFront().append(
				"g").attr("class", "selection")
				.style("pointer-events", "click");

		$rootScope.centerX = $rootScope.width / 10;
		$rootScope.centerY = $rootScope.height / 1.7;
		$rootScope.maxRowSize = 10;

		$rootScope.selectedNode.append("circle").attr('r', 615).attr("cx",
				$rootScope.centerX).attr("cy", $rootScope.centerY).attr(
				'class', "node--selected").on("click", profileNodeClicked)
				.attr("cursor", "auto").on(
						'contextmenu',
						d3.contextMenu(onSelectedNodeMenu, function() {

							$rootScope.uploadedDocumentPosition = [
									this.event.x, this.event.y ];
						}));

		var profileContainer = $rootScope.selectedNode.append("g").on(
				"mouseover", profileMouseovered).on("mouseout",
				profileMouseouted).on("click", profileNodeClicked);

		profileContainer.append("rect").attr("width", 220).attr("height", 220)
				.attr('class', "profile-frame").attr("x",
						$rootScope.centerX - 155).attr("y", -10);

		var imagePath = d.img == "" ? "./docs/default_profile.jpg" : "./docs/"
				+ d.img;

		profileContainer.append("image").attr("width", 200).attr("height", 200)
				.attr('class', "profile-image--selected").attr("x",
						$rootScope.centerX - 145).attr("y", 0).attr(
						"xlink:href", imagePath).on("click",
						profileImageClicked).attr("cursor", "auto").append(
						"title").text("Click to upload a new profile image");

		$rootScope.selectedNode.append("text").attr('class', "label--selected")
				.attr("y", -50).attr("x", $rootScope.centerX - 230).text(
						d.label).call(commons.makeEditable);

		placeDocuments(serverUrl + "/documents?node=" + d.originalId
				+ "&relation=tagged", $rootScope.selectedNode, d.originalId,
				$rootScope.centerX, $rootScope.centerY, $rootScope.maxRowSize);
	};

	function clickNode(d) {

		if (!d3.event || d3.event.defaultPrevented) {
			return;
		}

		$rootScope.selectedNodeId = d.originalId;

		commons.selectNode(this, d);

		d3.event.stopPropagation();
	}

	function docDragstarted(d) {

		d3.event.sourceEvent.stopPropagation();

		svg.selectAll(".thumbnailText").remove();
		d3.select(this).classed("dragging", true);
	}

	function docDragged(d) {

		var sel = d3.select(this);
		sel.attr("x", d3.event.x - parseInt(sel.attr("width")) / 2).attr("y",
				d3.event.y - parseInt(sel.attr("height")) / 2);
	}

	function docDragended(d) {

		var sel = d3.select(this);
		sel.classed("dragging", false);

		var document = sel[0][0];
		var x = document.x.baseVal.value;
		var y = document.y.baseVal.value;
		var id = document.attributes.id.nodeValue;

		var nodeId = d ? d.originalId : -1;

		$.get(serverUrl + '/documents/' + id + '/updatePosition?node=' + nodeId
				+ '&x=' + x + '&y=' + y);
	}

	function removeDocument(docId) {

		svg.selectAll(".docContainer .myCursor-pointer-move").filter(
				function() {

					var sel = d3.select(this);

					var document = sel[0][0];
					var id = document.attributes.id.nodeValue;
					return id == docId;

				}).remove();
	}

	function isAlreadyTagged(nodeId, taggedAreaId) {

		var tagged = [];
		$(taggedAreaId + ' li').each(function() {

			tagged.push(parseInt(this.id));
		});

		return tagged.indexOf(nodeId) > -1;
	}

	function fillTaggedPersons(nodes, mode) {

		$('#' + mode + '-taggedPersons').html('');

		for (nodeIndex in nodes) {

			var node = $rootScope.nodes[nodeIndex];
			if (node.person
					&& !isAlreadyTagged(node.originalId, '#' + mode
							+ '-taggedArea')) {

				$('#' + mode + '-taggedPersons').append(
						'<li id="' + node.originalId + '"><a href="">'
								+ node.label + '</a></li>');
			}
		}

		$('#' + mode + '-taggedArea li a').click(function() {

			personId = $(this).attr('id');

			$('#' + mode + '-taggedArea li#' + personId.slice(-1)).remove();

			fillTaggedPersons($rootScope.nodes, mode);
		});

		$('#' + mode + '-taggedPersons li')
				.on(
						'click',
						function() {

							personId = $(this).attr('id');
							personLabel = $(this).find('a').text();
							$('#' + mode + '-taggedArea')
									.append(
											'<li id="'
													+ personId
													+ '">'
													+ personLabel
													+ '<a id="remove-'
													+ personId
													+ '" style="margin-left: 5px" href="">(remove)</a></li>');

							fillTaggedPersons($rootScope.nodes, mode);
						});
	}
};