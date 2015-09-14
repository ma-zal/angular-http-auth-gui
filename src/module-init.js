/**
 * @ngdoc overview
 * @name http-auth-gui-interceptor
 * @version 1.0.2
 * @description
 *
 * Angular module for login/logout to server and for storing details of logged user.
 * <br/><br/>
 *
 * Functionalities of this module:
 * - When any HTTP result returns HTTP-401, login dialog will pop-up immediatelly.
 * - All request with HTTP-401 are stored and original senders do not know anything (still waiting for responses).
 * - When credentials entered to login dialog, popup will close and all requests (with HTTP-401) will be resend again.
 *   Result of resended requests are sended to the original sender (by resolving it's promises).
 * - When login dialog is cancelled, all stored requests are rejected and deleted.
 * <br/><br/>
 *
 * Module uses Angular events:
 *  - 'event:auth-loginRequired'
 *  -- Some request return HTTP-401, so login is required. Request(s) is (are) stored for future resend.
 *  - 'event:auth-loginConfirmed'
 *  -- Login successfull. User is logged by entered username/password. All stored HTTP requests are resend now.
 *  - 'event:auth-loginCancelled'
 *  -- User cancel the login dialog. All stored HTTP request will be rejected now.
 *
 */
angular.module('http-auth-gui-interceptor', ['http-auth-interceptor', 'ui.bootstrap']);

/*
 * MODULE INIT: Show popup dialog when any HTTP request return HTTP-401
 */
angular.module('http-auth-gui-interceptor').run(function($rootScope, popupLoginDialog) {
	$rootScope.$on('event:auth-loginRequired', function() {
		popupLoginDialog();
	});
});