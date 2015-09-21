Angular HTTP Auth Interceptor module with GUI (Bootstrap login dialog)
======================================================================

__Module is extension of [angular-http-auth](https://github.com/witoldsz/angular-http-auth), that automatically open Bootstrap Angular-UI modal dialog
when HTTP 401 occures in any HTTP result.__

When credential entered and "Login" button pressed,
modal dialog sends HTTP login request to custom URL and automaticcaly resend previously HTTP-401 failed requests. 

### Vizualization of Login Dialog popup:

![Login dialog GUI](/doc/login-dialog.png)


Usage
=====

1. Install via Bower
--------------------
    bower install angular-http-auth-gui --save

2. Insert into index.html
-------------------------
Note: This is example. See real URL in your project!

	<!-- Dependencies of angular-http-auth-gui -->  
	<script type="text/javascript" src="bower_components/angular/angular.min.js"></script>
	<script type="text/javascript" src="bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js"></script>
	<script type="text/javascript" src="bower_components/angular-http-auth/src/http-auth-interceptor.js"></script>
	<link rel="stylesheet" href="bower_components/bootstrap-css-only/css/bootstrap.min.css"/>
	<link rel="stylesheet" href="bower_components/components-font-awesome/css/font-awesome.css"/>

	<!-- Library angular-http-auth-gui -->
	<script type="text/javascript" src="bower_components/angular-http-auth-gui/http-auth-gui-interceptor.js"></script>


3. Insert Angular dependency
----------------------------
    angular.module('myApp', ['http-auth-gui-interceptor']);

__Important note when using Angular-loading bar:__

You have to include in right order!
Wrong order will cause, that angular-loading bar will not hide when login dialog popup.

Right order:

	angular.module('myApp', ['http-auth-gui-interceptor', 'angular-loading-bar']

4. Insert into Global controller (optional)
--------------------------------
If you want everytime to see logged user in Global controller, use this code inside this controller:

    var self = this;
	self.loggedUser = {};

	// Get loggedUser on page load
	// It fill call event "event:auth-loginConfirmed"
	backendAuthService.getLoggedUser();

    // When user changed, update metadata in variable
	$rootScope.$on('event:auth-loginConfirmed', function(event, loggedUser) {
		self.loggedUser = loggedUser;
	});

How does it works
=================

Login
-----

Modal dialog call HTTP request, that send entered credentials into HTTP REST API (into default URL, see below).
If login successfull (= REST returns 2xx), library resend again all requests, that returns HTTP 401 in past.

This library expect, that authentication uses cookie with some "Session ID". It means, REST with entered credentials
will return header:

	Cookie: SomeID=SomeToken

This cookie is automatically used by browser for future HTTP requests.


Default URL of backend authentication API
-----------------------------------------

### Login

Request:

	method POST
	path /api/auth/login
	{"username": "--john1--", "password": {"HisSecurePassword"}}
	
Results:

	HTTP/1.1 200 OK
	Cookie: SomeSessionID...
	{"username": "--john1--", "someUserDetail1": "...", ....}

	HTTP/1.1 403 Forbidden
	{"err": "#ERR_WRONG_CREDENTIALS"}

	HTTP/1.1 403 Forbidden
	{"err": "--Any other error text message--"}

	
### Logout

Request

	method POST
	Cookie: SomeSessionID...
	path /api/auth/logout
	
Result

	HTTP/1.1 200 OK

### Get logged user

Request:

	method GET
	path /api/auth/login
	
Results:

	HTTP/1.1 200 OK
	{"username": "--john1--", "someUserDetail1": "...", ....}

	HTTP/1.1 200 OK
	{}
	// Note: If no user logged, you must return empty object {}.

Change default backend API URLs
-------------------------------
	angular.module('myApp').config(function(backendAuthServiceProvider) {
		backendAuthServiceProvider.backendUrl.getLoggedUser = '/my-api/new/who-is-logged';
		backendAuthServiceProvider.backendUrl.login = '/my-api/new/log-me';
		backendAuthServiceProvider.backendUrl.loout = '/my-api/new/logout-me';
	});
	
	
Used Angular events
-------------------

### event:auth-loginConfirmed

Everytime, when new user log-in or log-out, event `event:auth-loginConfirmed` is fired. So u can use:

	$scope.$on('event:auth-loginConfirmed', function(event, loggedUserDetails){
		if (loggedUserDetails.username) {
			// Some user log-in
			// ... do anything
		} else {
			// User log-out
			// Note: If user log-out, loggedUserDetails === {} - object without any properties.
		}
	});


Manual user log-in / log-out / get-user-info
--------------------------------------------
If you want to manually call HTTP API to user login/logout, use:

	module('myApp').controller('MyCtrl', ['backendAuthService', function(backendAuthService) {
	
		/*
		 * Manual login
		 */
		backendAuthService.login('someUsername', 'usersPassword').then(function() {
			// Login successfull
		}).catch(function() {
			// Login failed
		});
		
		/*
		 * Manual logout
		 */
		backendAuthService.logout().then(function() {
			// Logout successfull
		}).catch(function() {
			// Logout failed
		});
		
		/*
		 * Get user details, if you need it
		 */
		backendAuthService.getLoggedUser().then(function(loggedUser) {
			// If user logged, you will se details in loggedUser.
			// Note: This details are same, as object from last successfull API Login call
			//       or from "getLoggedUser" API call.
		})
	}]
