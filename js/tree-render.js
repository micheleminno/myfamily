var serverUrl = 'http://localhost:8091';

var treeRender = function(data) {

	if (!data) {

		return;
	}

	var width, height;

	var zoom;
	var svg;
	var container;

	var force, nodeDrag;

	var link, node;

	var streamHeight, streamWidth, streamY, streamX, streamNode;

	var docRowSize, currentPage, documents;

	function init() {

		d3.select("svg").remove();

		width = 1250;
		height = 630;

		zoom = d3.behavior.zoom().scaleExtent([ .5, 4 ]).on("zoom", zoomed);

		svg = d3.select("body").append("svg").attr("width", width).attr(
				"height", height).append("g").attr("transform",
				"translate(300, 100)scale(.4)").attr("class",
				"myCursor-zoom-move");

		svg.on("click", clickSvg);

		svg.append("circle").attr("r", width * 10).attr("class", "lens").style(
				"pointer-events", "all").call(zoom);

		svg.append("rect").attr("class", "ground").attr("width", 600).attr(
				"height", 200).attr("x", -700).attr("y", 1100).on("click",
				groundClicked).attr("cursor", "pointer");

		svg.append("text").attr('class', "nodeLabel").attr("y", 1080).attr("x",
				-650).text("Heritage");

		svg.append("rect").attr("class", "ground").attr("width", 500).attr(
				"height", 200).attr("x", 1900).attr("y", 1100).on("click",
				groundClicked).attr("cursor", "pointer");

		svg.append("text").attr('class', "nodeLabel").attr("y", 1080).attr("x",
				2220).text("Heritage");

		container = svg.append("g");

		force = d3.layout.force().size([ width, height ]).gravity(0).charge(
				function(d) {
					if (d.person) {
						return -2000 / d.level;
					} else {
						return 0;
					}
				}).linkDistance(function(d) {
			if (!d.source.person && d.target.person) {
				return 900 * 1 / d.level;
			} else {
				return 300 * 1 / d.level;
			}
		}).on("tick", tick);

		nodeDrag = force.drag().origin(function(d) {
			return d;
		}).on("dragstart", nodeDragstarted).on("drag", nodeDragged).on(
				"dragend", nodeDragended);

		link = container.selectAll(".link");
		node = container.selectAll(".node");

		streamHeight = 100;
		streamWidth = 1600;
		streamY = 1130;
		streamX = 100;

		docRowSize = 16;
	}

	/*
	 * Populate notifications: get all events about nodes or docs in this user
	 * view who are not already read by this user.
	 */
	function fillNotifications(nodes) {

		$('#notifications-list').html('');

		var data = {
			nodes : nodes
		};

		$.ajax({

			url : serverUrl + "/" + userId + "/events",
			type : "POST",
			data : JSON.stringify(data),
			contentType : "application/json",
			dataType : "json",
			success : function(events) {

				var items = [];

				$.each(events, function(i, item) {

					var label = item.description + " of " + item.entity_type
							+ " " + item.entity + " on " + item.date;

					items.push('<li><a href="#">' + label + '</a></li>');

				});

				$('#notifications-list').append(items.join(''));
			}
		});
	}

	var nodes;

	var viewIndex;

	function drawTree(userId, userLabel, viewId, viewLabel) {

		$('#logged-user').html(
				userLabel + '<span class="caret myCaret"></span>');
		$('#view-mode').html(viewLabel + '<span class="caret myCaret"></span>');

		viewIndex = viewId;
		init();

		nodes = data.nodes;
		links = data.links;

		//fillNotifications(nodes);

		if (viewId != 4) {

			svg.on('contextmenu', null);
		}

		force = force.nodes(nodes).links(links);

		force.start();

		link = link.data(links).enter().append("path");

		link.each(function(d) {

			currentLink = d3.select(this);
			currentLink.attr("class", "link").attr("stroke-width", function(d) {

				return 30 / d.level + "px";
			});
		});

		node = node.data(nodes).enter().append("g");

		node
				.each(function(d) {

					currentNode = d3.select(this);

					currentNode.call(nodeDrag);

					if (d.person) {

						currentNode.on("click", clickNode);

						if (viewId == 4) {

							currentNode.on('contextmenu', d3
									.contextMenu(onPersonMenu));
						}

						var defs = currentNode.append('svg:defs');

						clipPath = defs.append("svg:clipPath").attr("id",
								"clipPath_" + d.originalId);

						var circleSize = getCircleSize(d);
						var nodeClass = getNodeClass(d);

						clipPath.append("circle").attr("class", nodeClass)
								.attr("r", circleSize).attr("id",
										"circle_" + d.originalId);

						currentNode.append("svg:use").attr("xlink:href",
								"#" + "circle_" + d.originalId);

						currentNode
								.append("svg:image")
								.attr("class", "profile-image")
								.attr(
										"xlink:href",
										function(d) {
											return d.img == "" ? "./docs/default_profile.jpg"
													: "./docs/" + d.img;
										}).attr("width", circleSize * 2).attr(
										"height", circleSize * 2).attr("x", 0)
								.attr("y", 0).attr("clip-path",
										"url(#clipPath_" + d.originalId + ")");

						currentNode.append("text").attr(
								"class",
								function(d) {
									if (d.label.toUpperCase() == userLabel
											.toUpperCase()) {
										return "my-nodeLabel";
									} else {
										return "nodeLabel";
									}
								}).attr("dy", "1.5em").text(function(d) {
							return d.label;
						}).call(makeEditable);
					} else {

						if (viewId == 4) {

							currentNode.on('contextmenu', d3
									.contextMenu(onFamilyMenu));
						}

						currentNode.append("ellipse").attr("rx", function(d) {

							return 100 / d.level;
						}).attr("ry", function(d) {

							return 50 / d.level;
						}).attr("fill", "brown").attr("class", "myCursor-move");
					}
				});

		streamNode = svg.append("g").attr("cursor", "auto");

		streamNode.append("circle").attr("r", 30).attr("cx", streamX - 67)
				.attr("cy", streamY + 50).attr("class", "navigator");

		streamNode.append("text").attr("class", "navigator-arrow").attr("x",
				streamX - 88).attr("y", streamY + 65).text("<").on("click",
				backMain).attr("cursor", "pointer");

		streamNode.append("circle").attr("r", 30).attr("cx",
				streamX + streamWidth + 66).attr("cy", streamY + 45).attr(
				"class", "navigator");

		streamNode.append("text").attr("class", "navigator-arrow").attr("x",
				streamX + streamWidth + 50).attr("y", streamY + 60).text(">")
				.on("click", forwardMain).attr("cursor", "pointer");

		streamNode.append("rect").attr("width", streamWidth).attr("height",
				streamHeight).attr("x", streamX).attr("y", streamY).attr("rx",
				20).attr("ry", 20).attr("class", "data-stream");

		//fillStream(nodes);
	}

	function fillStream(nodes) {

		console.log("Filling stream");

		var data = {
			nodes : nodes
		};

		$.ajax({

			url : serverUrl + "/documents/" + userId,
			type : "POST",
			data : JSON.stringify(data),
			contentType : "application/json",
			dataType : "json",
			success : function(data) {

				documents = data.documents;

				console.log("Documents: " + JSON.stringify(documents));

				var documentsSize = documents.length;

				if (documentsSize > 0) {

					currentPage = Math.floor(documentsSize / (docRowSize + 1));

					maxPage = currentPage;

					populateThumbnails(currentPage, true);
				}
			}
		});
	}

	drawTree(data.userId, data.userLabel, data.viewId, data.viewLabel);

	function populateThumbnails(currentPage, back) {

		var minIndex = currentPage * docRowSize;

		for (docIndex in documents) {

			var doc = documents[docIndex];
			doc.index = parseInt(docIndex);
		}

		var currentDocuments = documents.filter(function(d) {

			return d.index >= minIndex && d.index < minIndex + docRowSize;
		});

		var doc = streamNode.selectAll(".doc");
		var sel = doc.data(currentDocuments, function(d) {
			return d.index;
		});

		var oldTarget = back ? streamWidth : streamX;
		var newTarget = back ? streamX : streamWidth;

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
						}).attr("width", 100).attr("height", streamHeight)
				.attr("y", streamY).attr("index", function(d) {
					return d.index;
				}).attr("id", function(d) {
					return d.id;
				}).attr("title", function(d) {
					return d.title;
				}).attr("url", function(d) {
					return "./docs/" + d.file;
				}).attr("date", function(d) {

					return getDate(d.date);

				}).on("mouseover", thumbnailMouseovered).on("mouseout",
						thumbnailMouseouted).on("click", thumbnailClicked)
				.attr("cursor", "pointer").attr("x", newTarget).transition()
				.duration(duration).delay(newDelay).ease("linear").attr("x",
						function(d) {
							return streamX + (d.index - minIndex) * 100;
						});

		sel.exit().transition().duration(duration).delay(oldDelay).ease(
				"linear").attr("x", oldTarget).remove();
	}
	var diagonal = d3.svg.diagonal().source(function(d) {

		return {
			"x" : d.source.y,
			"y" : d.source.x
		};

	}).target(function(d) {

		return {
			"x" : d.target.y,
			"y" : d.target.x
		};

	}).projection(function(d) {

		return [ d.y, d.x ];
	});

	function tick() {

		link.attr("d", diagonal);

		node.selectAll(".node").attr("cx", function(d) {
			return d.x;
		}).attr("cy", function(d) {
			return d.y;
		});

		node.selectAll(".nodeLabel").attr("x", function(d) {
			return d.x - 25;
		}).attr("y", function(d) {
			return d.y + getCircleSize(d);
		});

		node.selectAll(".my-nodeLabel").attr("x", function(d) {
			return d.x - 45;
		}).attr("y", function(d) {
			return d.y + getCircleSize(d);
		});

		node.selectAll(".profile-image").attr("x", function(d) {
			return d.x - getCircleSize(d);
		}).attr("y", function(d) {
			return d.y - getCircleSize(d);
		});

		node.selectAll("ellipse").attr("cx", function(d) {
			return d.x;
		}).attr("cy", function(d) {
			return d.y;
		});
	}

	var onPersonMenu = [
			{
				title : 'Add family as a parent',
				action : function(elm, d, i) {

					$.get(serverUrl + "/" + userId
							+ '/graph/add?type=family&source=' + d.originalId,
							function() {

								drawTree(userId, userLabel, selectedViewId,
										selectedViewLabel);
							});
				}
			},
			{
				title : 'Add family as a child',
				action : function(elm, d, i) {

					$.get(serverUrl + "/" + userId
							+ '/graph/add?type=family&target=' + d.originalId,
							function() {

								drawTree(userId, userLabel, selectedViewId,
										selectedViewLabel);
							});
				}
			},
			{
				title : 'Remove',
				action : function(elm, d, i) {

					$.get(serverUrl + "/" + userId + '/graph/remove/'
							+ d.originalId, function() {

						drawTree(userId, userLabel, selectedViewId,
								selectedViewLabel);
					});
				}
			} ];

	var onFamilyMenu = [
			{
				title : 'Add parent',
				action : function(elm, d, i) {

					$.get(serverUrl + "/" + userId
							+ '/graph/add?type=person&target=' + d.originalId,
							function() {

								drawTree(userId, userLabel, selectedViewId,
										selectedViewLabel);
							});
				}
			},
			{
				title : 'Add child',
				action : function(elm, d, i) {

					$.get(serverUrl + "/" + userId
							+ '/graph/add?type=person&source=' + d.originalId,
							function() {

								drawTree(userId, userLabel, selectedViewId,
										selectedViewLabel);
							});
				}
			},
			{
				title : 'Remove',
				action : function(elm, d, i) {

					$.get(serverUrl + "/" + userId + '/graph/remove/'
							+ d.originalId, function() {

						drawTree(userId, userLabel, selectedViewId,
								selectedViewLabel);
					});
				}
			} ];

	function getCircleSize(d) {

		var circleSize;

		if (d.label.toUpperCase() == data.userLabel.toUpperCase()) {

			circleSize = (125 / d.level) * 1.5;

		} else {

			circleSize = 125 / d.level;
		}

		return circleSize;
	}

	d3.selection.prototype.moveToFront = function() {

		return this.each(function() {

			this.parentNode.appendChild(this);
		});
	};

	function getNodeClass(d) {

		if (d.label.toUpperCase() == data.userLabel.toUpperCase()) {

			nodeClass = "node me";

		} else if (d.acquired) {

			nodeClass = "node acquired";

		} else if (d.leaf) {

			nodeClass = "node leaf";

		} else {

			nodeClass = "node core";
		}

		return nodeClass;
	}

	function getDate(dateString) {

		if (!dateString || dateString == '') {

			return "No date";
		} else {
			var date = new Date(dateString
					.substring(0, dateString.indexOf('T')));
			return date.toDateString();
		}
	}

	function getFormattedDate(dateString) {

		if (!dateString || dateString == '') {

			return "";
		} else {
			// yyyy-mm-dd
			var originalFormat = dateString.substring(0, dateString
					.indexOf('T'));
			return originalFormat;
		}
	}

	function makeEditable(d) {

		this.on("mouseover", function() {
			d3.select(this).style("fill", "red");
		}).on("mouseout", function() {
			d3.select(this).style("fill", null);
		}).on(
				"click",
				function(d) {

					var oldName = d.label;
					var result = prompt('Enter a new name', d.name);

					if (result) {

						var node = d3.select(this.parentNode.parentNode);
						var selection = node.selectAll(".nodeLabel");

						if (selection[0].length == 0
								&& node.selectAll(".my-nodeLabel")) {

							alert("Change your name from the setting menu");

							selection = node.selectAll(".my-nodeLabel");
							var label = selection[0][0];
							label.textContent = oldName;

						} else {

							var label = selection[0][0];
							label.textContent = result;

							d.label = result;
							var selection = d3.select(this);
							var label = selection[0][0];
							label.textContent = result;

							$.get(serverUrl + "/" + userId + '/graph/update/'
									+ d.originalId + '?field=label&value='
									+ result);
						}
					}

					d3.event.stopPropagation();
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

		if (!onDetail || doc.attributes.url.nodeValue.substr(-4) === ".pdf") {

			parent.append("text").attr("class", "thumbnailText").attr("x",
					doc.x.baseVal.value).attr("y", doc.y.baseVal.value - 20)
					.text(doc.attributes.title.nodeValue);

			if (!onDetail) {

				parent.append("text").attr("class", "thumbnailText").attr("x",
						doc.x.baseVal.value).attr("y",
						doc.y.baseVal.value + 235).text(
						doc.attributes.date.nodeValue);

				node.classed("node--tagged", function(n) {

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
	;

	function thumbnailMouseouted(d) {

		svg.selectAll(".thumbnailText").remove();
		svg.selectAll(".thumbnail-frame").remove();

		var selection = d3.select(this);
		var doc = selection[0][0];

		doc.width.baseVal.value = 100;
		doc.height.baseVal.value = 100;
		doc.x.baseVal.value += 50;
		doc.y.baseVal.value += 50;

		node.classed("node--tagged", false);
	}
	;

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
	;

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
	;

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
	;

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
	;

	function closeDocClicked() {

		svg.selectAll(".zoomedDoc").remove();
		svg.selectAll(".frame").remove();
		svg.selectAll(".docText").remove();
		svg.selectAll(".docText-small").remove();
		svg.selectAll(".closeDoc").remove();

		d3.event.stopPropagation();
	}

	function profileNodeClicked(d) {

		d3.event.stopPropagation();
	}

	function redrawStream() {

		var nodes = [];
		node.each(function(d) {

			nodes.push({
				"originalId" : d.originalId
			});
		});

		fillStream(nodes);
	}
	;

	var container;
	var documentToAdd;

	$('#uploadDocument').click(
			function() {

				$('#uploadDocumentForm').attr('action',
						serverUrl + '/documents/upload');

				$('#uploadDocumentForm').submit();

				var filePath = $('#document-upload').val();
				fileName = filePath.substring(filePath.lastIndexOf("\\") + 1);

				var title = $('#title').val();
				var date = $('#date').val();

				var tagged = [];
				$('#add-taggedArea > li').each(function() {

					tagged.push(parseInt(this.id));
				});

				var url = serverUrl + "/documents/add/document?file="
						+ fileName + "&title=" + title + "&date=" + date
						+ "&tagged=" + JSON.stringify(tagged) + '&owner='
						+ userId;

				$.get(url, function(addedDoc) {

					if (addedDoc) {

						documentToAdd = addedDoc;

						$('#addDocumentModal').modal('hide');

						// Display new document
						console.log(JSON.stringify(addedDoc));
						container = svg.selectAll(".docContainer");

						addedDoc.position = {
							x : documentPosition[0],
							y : documentPosition[1]
						};

						// update position on db
						$.get(serverUrl + '/documents/' + addedDoc.id
								+ '/updatePosition?node=' + tagged[0] + '&x='
								+ addedDoc.position.x + '&y='
								+ addedDoc.position.y);

						// register event
						$.get(serverUrl + '/events/add/document/' + addedDoc.id
								+ "?type=creation&node=" + tagged[0]);

						documentPosition = [];

						setTimeout(documentUploadContinueExecution, 500);

					} else {
						console.log("Document not added!");
					}
				});
			});

	function documentUploadContinueExecution() {

		drawDoc(documentToAdd, container, null, null, 0, null, false);

		redrawStream();
	}
	;

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

	var nodeIdToUpdate;
	var fileName;

	$('#profile-img-upload').change(
			function() {

				$('#uploadProfileImageForm').attr(
						'action',
						serverUrl + "/" + userId + '/graph/profileImage/'
								+ nodeIdToUpdate);
				$('#uploadProfileImageForm').submit();

				var filePath = $(this).val();
				fileName = filePath.substring(filePath.lastIndexOf("\\") + 1);

				setTimeout(profileImageUploadContinueExecution, 500);
			});

	function profileImageUploadContinueExecution() {

		svg.selectAll(".profile-image").filter(function(d) {

			return d.originalId == nodeIdToUpdate;

		}).attr("xlink:href", "./docs/" + fileName);

		svg.selectAll(".profile-image--selected").attr("xlink:href",
				"./docs/" + fileName);
	}
	;

	function profileImageClicked(d) {

		nodeIdToUpdate = d.originalId;

		$('#profile-img-upload').val(null);
		$('#profile-img-upload').click();
		d3.event.stopPropagation();
	}

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

	var onDetail = false;

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
				.attr("date", getDate(doc.date))
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
	;

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
	;

	function groundClicked(d) {

		var selectedNode = d3.select(this.parentNode).moveToFront().append("g")
				.attr("class", "selection").style("pointer-events", "click");

		selectedNode.append("rect").attr("class", "ground--selected").attr(
				"width", 3100).attr("height", 350).attr("x", -700).attr("y",
				1050).attr("cursor", "auto").on(
				'contextmenu',
				d3.contextMenu(onHeritageMenu,
						function() {

							documentPosition = [ this.event.x + 800,
									this.event.y + 800 ];
						}));

		selectedNode.append("text").attr('class', "label--selected").attr("y",
				1130).attr("x", -650).text("Heritage");

		onDetail = true;

		var centerX = -200;
		var centerY = 1100;
		var maxRowSize = 40;

		placeDocuments(serverUrl + "/documents?node=-1&relation=tagged",
				selectedNode, -1, centerX, centerY, maxRowSize);

		d3.event.stopPropagation();
	}
	;

	var documentPosition = [];

	function clickNode(d) {

		if (!d3.event || d3.event.defaultPrevented) {
			return;
		}

		onDetail = true;

		var selectedNode = d3.select(this).moveToFront().append("g").attr(
				"class", "selection").style("pointer-events", "click");

		var centerX = width / 10;
		var centerY = height / 1.7;
		var maxRowSize = 10;

		selectedNode.append("circle").attr('r', 615).attr("cx", centerX).attr(
				"cy", centerY).attr('class', "node--selected").on("click",
				profileNodeClicked).attr("cursor", "auto").on('contextmenu',
				d3.contextMenu(onSelectedNodeMenu, function() {

					documentPosition = [ this.event.x, this.event.y ];
				}));

		var profileContainer = selectedNode.append("g").on("mouseover",
				profileMouseovered).on("mouseout", profileMouseouted).on(
				"click", profileNodeClicked);

		profileContainer.append("rect").attr("width", 220).attr("height", 220)
				.attr('class', "profile-frame").attr("x", centerX - 155).attr(
						"y", -10);

		var imagePath = d.img == "" ? "./docs/default_profile.jpg" : "./docs/"
				+ d.img;

		profileContainer.append("image").attr("width", 200).attr("height", 200)
				.attr('class', "profile-image--selected").attr("x",
						centerX - 145).attr("y", 0).attr("xlink:href",
						imagePath).on("click", profileImageClicked).attr(
						"cursor", "auto").append("title").text(
						"Click to upload a new profile image");

		selectedNode.append("text").attr('class', "label--selected").attr("y",
				-50).attr("x", centerX - 230).text(d.label).call(makeEditable);

		placeDocuments(serverUrl + "/documents?node=" + d.originalId
				+ "&relation=tagged", selectedNode, d.originalId, centerX,
				centerY, maxRowSize);

		d3.event.stopPropagation();

	}
	;

	function clickSvg(d) {

		if (!d3.event || d3.event.defaultPrevented) {
			return;
		}

		onDetail = false;
		var sel = svg.selectAll(".selection");
		sel.remove();

		var actions = svg.selectAll(".action");
		actions.remove();

		svg.selectAll(".tree-leaf").style("pointer-events", "all");
	}
	;

	function zoomed() {

		container.attr("transform", "translate(" + d3.event.translate
				+ ")scale(" + d3.event.scale + ")");
	}
	;

	function nodeDragstarted(d) {

		d3.select(this).classed("fixed", d.fixed = true);

		if (!onDetail) {
			d3.event.sourceEvent.stopPropagation();
			d3.select(this).classed("dragging", true);
		}

		var actions = svg.selectAll(".action");
		actions.remove();
	}
	;

	function nodeDragged(d) {

		if (!onDetail) {
			d3.select(this).attr("x", d.x = d3.event.x).attr("y",
					d.y = d3.event.y);
		}
	}

	function nodeDragended(d) {

		if (!onDetail) {
			d3.select(this).classed("dragging", false);

			$.get(serverUrl + '/' + userId + '/view/' + selectedViewId
					+ '/update?node=' + d.originalId + '&x=' + d.x + '&y='
					+ d.y);
		}
	}
	;

	function docDragstarted(d) {

		d3.event.sourceEvent.stopPropagation();

		svg.selectAll(".thumbnailText").remove();
		d3.select(this).classed("dragging", true);
	}
	;

	function docDragged(d) {

		var sel = d3.select(this);
		sel.attr("x", d3.event.x - parseInt(sel.attr("width")) / 2).attr("y",
				d3.event.y - parseInt(sel.attr("height")) / 2);
	}
	;

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
	;

	function removeDocument(docId) {

		svg.selectAll(".docContainer .myCursor-pointer-move").filter(
				function() {

					var sel = d3.select(this);

					var document = sel[0][0];
					var id = document.attributes.id.nodeValue;
					return id == docId;

				}).remove();

		redrawStream();
	}
	;

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

			var node = nodes[nodeIndex];
			if (node.person
					&& !isAlreadyTagged(node.originalId, '#' + mode
							+ '-taggedArea')) {

				$('#' + mode + '-taggedPersons').append(
						'<li id="' + node.originalId + '"><a href="#">'
								+ node.label + '</a></li>');
			}
		}

		$('#' + mode + '-taggedArea li a').click(function() {

			personId = $(this).attr('id');

			$('#' + mode + '-taggedArea li#' + personId.slice(-1)).remove();

			fillTaggedPersons(nodes, mode);
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
													+ '" style="margin-left: 5px" href="#">(remove)</a></li>');

							fillTaggedPersons(nodes, mode);
						});
	}
	;

	var onSelectedNodeMenu = [ {
		title : 'Add document',
		action : function(elm, d, i) {

			$('#add-taggedArea').html('');
			$('#add-taggedArea').append(
					'<li id="' + d.originalId + '">' + d.label + '</li>');

			fillTaggedPersons(nodes, 'add');

			$('#addDocumentModal').modal('show');
		}
	} ];

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
																			+ '" style="margin-left: 5px" href="#">(remove)</a>'
																			+ '</li>');
												}
											}

											fillTaggedPersons(nodes, 'edit');

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
															getFormattedDate(data.document.date));

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

};