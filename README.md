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
    bower install --save components-font-awesome
    
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

Everytime, when new user log-in or log-out, event `event:auth-loginConfirmed` is fired.

Object in event contains metadata with logged user. If no user logged, parameter contains {} or null in most cases.
Details depend on JSON result from call to REST API `getLoggedUser` or API `login`.


### event:auth-loginCancelled

Everytime, when user click to "Cancel" in login form, event `event:auth-loginCancelled` is fired.

Example: Detect in controller, if user (and who) is logged
----------------------------------------------------------

	$scope.$on('event:auth-loginConfirmed', function(event, loggedUserDetails){
		if (loggedUserDetails.username) {
			// Some user log-in
			// ... do anything
		} else {
			// User log-out
			// Note: If user log-out, loggedUserDetails === {} - object without any properties.
		}
	});


Example: Enforce login in some controller
-----------------------------------------

	// Get current user info
	backendAuthService.getLoggedUser().then(function(loggedUser) {
		if (loggedUser.username) { // 'username' is only example. use own property check for logged user.
			// Some user is logged. All is OK.
			$scope.loggedUser = loggedUser;
		} else {
			// No user logged. So popup login dialog.
			$rootScope.$broadcast('event:auth-loginRequired');
		}
	});

	$rootScope.$on('event:auth-loginConfirmed', function(event, loggedUser) {
		// User logged right now. So update info in your controller.
		$scope.loggedUser = loggedUser;
	});

	$rootScope.$on('event:auth-loginCancelled', function(event, loggedUser) {
		// User 'cancel' the popup login dialog.
		$location.url('/'); // Sorry, no logged user, no funny. :-)	
	}

Example: Manual user log-in / log-out / get-user-info
-----------------------------------------------------
Login manually in controller (without dialog popup):

	module('myApp').controller('MyCtrl', ['backendAuthService', function(backendAuthService) {
	
		backendAuthService.login('someUsername', 'usersPassword').then(function() {
			// Login successfull
		}).catch(function() {
			// Login failed
		});

	}]);
	
Logout manually:

	module('myApp').controller('MyCtrl', ['backendAuthService', function(backendAuthService) {

		backendAuthService.logout().then(function() {
			// Logout successfull
		}).catch(function() {
			// Logout failed
			// Mostly catched only if some network problem (cannot call REST API to logout).
			//    Normally does not make sense to do not accept user logout.
		});

	}]);

Get current logged user in controller:

	module('myApp').controller('MyCtrl', ['backendAuthService', function(backendAuthService) {

		backendAuthService.getLoggedUser().then(function(loggedUser) {
			// If user logged, you will see details in loggedUser.
			// If no user logged, loggedUser is {} or NULL - in most cases.
			// Note: This details are same, as object from last successfull API Login call
			//       or from "getLoggedUser" API call.
		})

	}]);
