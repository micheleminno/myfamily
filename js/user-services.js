angular
		.module('user-services', [ 'ngCookies' ])
		.service(
				'AuthenticationService',
				[
						'$cookies',
						function($cookies) {

							this.getUsername = function() {

								var username = '';

								if (typeof $cookies.get('credentials') !== 'undefined') {

									username = $cookies
											.getObject('credentials').username;
								}

								return username;

							};

							this.getUserId = function() {

								var userId = '';

								if (typeof $cookies.get('credentials') !== 'undefined') {

									userId = $cookies.getObject('credentials').userId;
								}

								return userId;

							};

							this.getCredentials = function() {

								var credentials = '';

								if (typeof $cookies.get('credentials') !== 'undefined') {

									credentials = $cookies
											.getObject('credentials').credentials;
								}

								return credentials;
							};

							this.storeCredentials = function(
									loggedInCredentials, theUsername, theUserId) {

								$cookies.putObject('credentials', {
									credentials : loggedInCredentials,
									username : theUsername,
									userId : theUserId
								});
							};

							this.clearCredentials = function() {

								$cookies.remove('credentials');
							};

							this.isLoggedIn = function() {

								var isLoggedIn = false;
								var credentials = $cookies
										.getObject('credentials');

								if (angular.isDefined(credentials)) {

									isLoggedIn = angular
											.isDefined(credentials.credentials)
											&& angular
													.isDefined(credentials.username);
								}

								return isLoggedIn;
							};
						} ])
		.service(
				'EncryptionService',
				function() {

					var keyStr = 'ABCDEFGHIJKLMNOP' + 'QRSTUVWXYZabcdef'
							+ 'ghijklmnopqrstuv' + 'wxyz0123456789+/' + '=';

					this.base64Encode = function(input) {

						var output = "";
						var chr1, chr2, chr3 = "";
						var enc1, enc2, enc3, enc4 = "";
						var i = 0;

						do {
							chr1 = input.charCodeAt(i++);
							chr2 = input.charCodeAt(i++);
							chr3 = input.charCodeAt(i++);

							enc1 = chr1 >> 2;
							enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
							enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
							enc4 = chr3 & 63;

							if (isNaN(chr2)) {
								enc3 = enc4 = 64;
							} else if (isNaN(chr3)) {
								enc4 = 64;
							}

							output = output + keyStr.charAt(enc1)
									+ keyStr.charAt(enc2) + keyStr.charAt(enc3)
									+ keyStr.charAt(enc4);
							chr1 = chr2 = chr3 = "";
							enc1 = enc2 = enc3 = enc4 = "";
						} while (i < input.length);

						return output;
					};

					this.base64Decode = function(input) {
						var output = "";
						var chr1, chr2, chr3 = "";
						var enc1, enc2, enc3, enc4 = "";
						var i = 0;

						var base64test = /[^A-Za-z0-9\+\/\=]/g;
						if (base64test.exec(input)) {
							alert("There were invalid base64 characters in the input text.\n"
									+ "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n"
									+ "Expect errors in decoding.");
						}
						input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

						do {
							enc1 = keyStr.indexOf(input.charAt(i++));
							enc2 = keyStr.indexOf(input.charAt(i++));
							enc3 = keyStr.indexOf(input.charAt(i++));
							enc4 = keyStr.indexOf(input.charAt(i++));

							chr1 = (enc1 << 2) | (enc2 >> 4);
							chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
							chr3 = ((enc3 & 3) << 6) | enc4;

							output = output + String.fromCharCode(chr1);

							if (enc3 != 64) {
								output = output + String.fromCharCode(chr2);
							}
							if (enc4 != 64) {
								output = output + String.fromCharCode(chr3);
							}

							chr1 = chr2 = chr3 = "";
							enc1 = enc2 = enc3 = enc4 = "";

						} while (i < input.length);

						return output;
					};

				})
		.service(
				'ErrorService',
				function() {

					var problem = '';

					var whatWeCanDo = '';

					var reason = '';

					this.defaultAnalyticsCategory = function() {
						return 'generic';
					};

					this.defaultProblem = function() {
						return 'Oops! Something went wrong!';
					};

					this.defaultWhatWeCanDo = function() {
						return 'Our technical team has been automatically notified about this and will be looking into it soon';
					};

					this.messageAsObject = function() {

						return {
							problem : problem,
							whatWeCanDo : whatWeCanDo,
							reason : reason
						};
					};

					this.printMsg = function(theProblem, theReason,
							aThingWeCanDo) {

						problem = theProblem;
						reason = theReason;
						whatWeCanDo = aThingWeCanDo;
					};
				});