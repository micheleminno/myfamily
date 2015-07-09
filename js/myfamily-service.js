app.service('MyFamilyService', function($http, $q) {

	var serverUrl = 'http://localhost:8091';

	this.getUser = function(name) {

		var deferred = $q.defer();

		$http.get(serverUrl + "/graph/namesakes?name=" + name).success(
				function(namesakes) {

					deferred.resolve(namesakes);
				});

		return deferred.promise;
	};

	this.isRegisteredUser = function(username, credentials) {

		var deferred = $q.defer();

		$http.get(
				serverUrl + '/user/isRegistered?user=' + username
						+ '&credentials=' + credentials).success(
				function(data) {

					deferred.resolve(data.registeredUser);
				});

		return deferred.promise;
	};

	this.getGraphView = function(userId, viewId) {

		var deferred = $q.defer();

		$http.get(serverUrl + "/" + userId + "/graph/view?view=" + viewId)
				.success(function(graphView) {

					deferred.resolve(graphView);
				});

		return deferred.promise;
	};

	this.getNotifications = function(userId, nodes) {

		var deferred = $q.defer();

		var httpPostConfig = {

			url : serverUrl + "/" + userId + "/events",
			method : "POST",
			data : JSON.stringify(nodes),
			headers : {
				'Content-Type' : 'application/json'
			}
		};

		$http(httpPostConfig).success(function(events) {

			deferred.resolve(events);
		});

		return deferred.promise;
	};

	this.getDocuments = function(userId, nodes) {

		var deferred = $q.defer();

		var httpPostConfig = {

			url : serverUrl + "/documents" + "/" + userId,
			method : "POST",
			data : JSON.stringify(nodes),
			headers : {
				'Content-Type' : 'application/json'
			}
		};

		$http(httpPostConfig).success(function(documents) {

			deferred.resolve(documents);
		});

		return deferred.promise;
	};

	this.addUser = function(name) {

		var deferred = $q.defer();

		$http.get($.get(serverUrl + '/graph/addPerson?name=' + name).success(
				function(data) {

					if (data) {

						deferred.resolve(data.personId);
					}
				}));

		return deferred.promise;
	};

});