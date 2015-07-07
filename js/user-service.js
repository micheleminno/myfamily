angular
		.module('user-services', [ 'ngCookies' ])
		.service('SessionService', function() {

			this.canAccess = function() {

				return true;
			};

		})
		.service(
				'AuthenticationService',
				[
						'$cookies',
						function($cookies) {

							var httpTimeout = 10000;

							var authServer = 'http://api.findtheripple.com/assignment/assignment-endpoint/rest/assignments';

							this.theUsername = function() {
								var theusername = '';

								if (typeof $cookieStore.get('credentials') !== 'undefined') {
									theusername = $cookies.get('credentials').username;
								}

								return theusername;

							};

							this.credentials = function() {
								var credentials = '';
								if (typeof $cookies.get('credentials') !== 'undefined') {
									credentials = $cookies.get('credentials').credentials;
								}
								return credentials;
							};

							this.storeCredentials = function(
									loggedInCredentials, theUsername) {
								$cookieStore.put('credentials', {
									credentials : loggedInCredentials,
									username : theUsername
								});
							};

							this.clearCredentials = function() {
								$cookieStore.remove('credentials');
							};

							this.isLoggedIn = function() {

								var isLoggedIn = false, credentialsAsJson = $cookieStore
										.get('credentials');

								if (angular.isDefined(credentialsAsJson)) {
									isLoggedIn = angular
											.isDefined(credentialsAsJson.credentials)
											&& angular
													.isDefined(credentialsAsJson.username);
								}

								return isLoggedIn;
							};

							this.login = function($q, $http, encodedCredentials) {

								return $http({
									url : authServer,
									method : "GET",
									headers : {
										Authorization : 'Basic '
												+ encodedCredentials,
										withCredentials : true,
										Accept : 'application/json'
									},
									timeout : httpTimeout
								});
							};

						} ]);
