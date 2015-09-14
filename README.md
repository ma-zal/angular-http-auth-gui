Angular HTTP Auth Interceptor module with GUI (Bootstrap login dialog)
======================================================================

__Module is extension to "angular-http-auth", that automatically open Bootstrap Angular-UI modal dialog
when HTTP 401 occures in any HTTP result.__

When credential entered and "Login" button pressed,
modal dialog sends HTTP login request to custom URL and automaticcaly resend previously HTTP-401 failed requests. 

### Vizualization of Login Dialog popup:

![Login dialog GUI](/doc/login-dialog.png)


Installation proccess
=====================

1. Install dependencies
-----------------------
    bower install --save angular
    bower install --save angular-http-auth
    bower install --save angular-bootstrap
    bower install --save bootstrap-css-only
    bower install --save components-font-awesome
    
2. Insert into index.html
-------------------------
Note: This is example. See real URL in your project!

	<script type="text/javascript" src="bower_components/angular/angular.min.js"></script>
	<script type="text/javascript" src="bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js"></script>
	<script type="text/javascript" src="bower_components/angular-http-auth/src/http-auth-interceptor.js"></script>
	<link rel="stylesheet" href="bower_components/bootstrap-css-only/css/bootstrap.min.css"/>
	<link rel="stylesheet" href="bower_components/components-font-awesome/css/font-awesome.css"/>

	<script type="text/javascript" src="bower_components/angular-http-auth-gui/http-auth-gui-interceptor.js"></script>


3. Insert Angular dependency
----------------------------
    angular.module('myApp', ['http-auth-gui-interceptor']);

__Important note when using Angular-loading bar:__

You have to include in right order!
Wrong order will cause, that angular-loading bar will not hide when login dialog popup.

Right order:

	angular.module('myApp', ['http-auth-gui-interceptor', 'angular-loading-bar']

5. Backend API URLs
--------------------
This library expect, that authentication uses cookie with some "Session ID".
If login successfull, HTTP must return cookie with any identificator of session. This cookie is automatically used
by browser for next HTTP requests.

Default URL of backend authentication API are:

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

6. Change backend API URLs
--------------------------
	angular.module('myApp').config(function(backendAuthServiceProvider) {
		backendAuthServiceProvider.backendUrl.getLoggedUser = '/my-api/new/who-is-logged';
		backendAuthServiceProvider.backendUrl.login = '/my-api/new/log-me';
		backendAuthServiceProvider.backendUrl.loout = '/my-api/new/logout-me';
	});
	

7. Insert into Global controller
--------------------------------
	If you want to see logged user in Global controller, use this code inside this controller:

    var self = this;
	self.loggedUser = {};

	// Get loggedUser on page load
	// It fill call event "event:auth-loginConfirmed"
	backendAuthService.getLoggedUser();

    // When user changed, update metadata in variable
	$rootScope.$on('event:auth-loginConfirmed', function(event, loggedUser) {
		self.loggedUser = loggedUser;
	});
