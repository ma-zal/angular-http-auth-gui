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
}); /**
 * @ngdoc service
 * @name backendAuthService
 * @memberOf http-auth-gui-interceptor
 * @description
 *
 * Service for user login/logout and get information details about user
 */

/*global angular */
"use strict";
angular.module('http-auth-gui-interceptor').provider('backendAuthService', function() {
    var provider = this;

    /**
     * Default configuration of URLs. Can be changed in provider config.
     */
    this.backendUrl = {
        getLoggedUser: '/api/auth/login',
        login: '/api/auth/login',
        logout: '/api/auth/logout'
    };


    this.$get = function ($http, $q, authService) {


        /**
         * @name loggedUser
         * @memberOf http-auth-gui-interceptor.backendAuthService
         * @private
         * @type {LoggedUser}
         * @description Internal storage of logged-user-details.
         */
        var loggedUser = {};

        /**
         * @name loggedUser_checkPromise
         * @memberOf http-auth-gui-interceptor.backendAuthService
         * @type {Promise.<LoggedUser>|null}
         * @private
         * @description
         *
         * If getting of user is in progress, there is a promise of this getting, that will be fullfilled with user info.
         * Prevention against multiple parallel HTTP requests.
         */
        var loggedUser_checkPromise;

        return {
            login: login,
            logout: logout,
            getLoggedUser: getLoggedUser
        };

        /* -------- METHODS --------- */

        /**
         * @ngdoc method
         * @name httpLogin
         * @memberOf http-auth-gui-interceptor.backendAuthService
         * @private
         * @param {string} username
         * @param {string} password
         * @returns {Promise}
         * @description
         *
         * Send credentials to server.
         */
        function httpLogin(username, password) {
            return $http({
                method: 'POST',
                url: provider.backendUrl.login,
                data: {username: username, password: password}
            }).then(function (response) { return response.data;});
        }


        /**
         * @ngdoc method
         * @name httpLogout
         * @memberOf http-auth-gui-interceptor.backendAuthService
         * @private
         * @returns {Promise}
         * @description
         *
         * Send logout notification to server.
         */
        function httpLogout() {
            return $http({
                method: 'GET',
                url: provider.backendUrl.logout
            });
        }


        /**
         * @ngdoc method
         * @name httpGetLoggedUser
         * @memberOf http-auth-gui-interceptor.backendAuthService
         * @private
         * @returns {Promise} Logged user details
         * @description
         *
         * - Get information about current logged user. If no user is logged, return {}
         * - NOTE: Everytime it do HTTP request to server (no cache).
         */
        function httpGetLoggedUser() {
            return $http({
                method: 'GET',
                url: provider.backendUrl.getLoggedUser
            }).then(function (response) { return response.data;});
        }


        /**
         * @ngdoc method
         * @name login
         * @memberOf http-auth-gui-interceptor.backendAuthService
         * @return {Promise}
         * @description
         *
         * Send credentials to server, get authToken (cookies),
         *      notify other component about login status change (it will cause retry unfinnished REST queries).
         */
        function login(username, password) {
            return httpLogin(username, password).then(function (data_loggedUserInfo) {
                updateLoggedUserInfo(data_loggedUserInfo); // cache logged user info
                authService.loginConfirmed(loggedUser); // notify other parts of app about user login
            });
        }

        /**
         * @ngdoc method
         * @name logout
         * @memberOf http-auth-gui-interceptor.backendAuthService
         * @returns {Promise}
         * @description
         *
         * Logout of logged user. It causes cookie token invalidate on server and LoggedUserInfo delete on client.
         */
        function logout() {
            return httpLogout().then(function (response) {
                updateLoggedUserInfo({}); // cache logged user info
                authService.loginConfirmed({});  // notify other parts of app about user logout
            });
        }

        /**
         * @ngdoc method
         * @name getLoggedUser
         * @memberOf http-auth-gui-interceptor.backendAuthService
         * @returns {Promise} Logged user details.
         * @description
         *
         * - Get information about current logged user from server.
         * - NOTE: Data are cached, so HTTP request to server is performed only at first call of this method.
         */
        function getLoggedUser() {
            if (loggedUser_checkPromise) {
                // Resolving already in progress
                return loggedUser_checkPromise;

            } else if (loggedUser_checkPromise === null) {
                // Resolving done in past. Send cached data
                return $q.resolve(loggedUser);

            } else if (loggedUser_checkPromise === undefined) {
                // Resolving does not start yet
                loggedUser_checkPromise = httpGetLoggedUser().then(function(_loggedUser) {
                    // Save userinfo to cache
                    updateLoggedUserInfo(_loggedUser);
                    // Notify about user logging
                    authService.loginConfirmed(_loggedUser);
                    // Clear promise, that signalized "library are waiting for already sended response".
                    loggedUser_checkPromise = null;
                    return loggedUser;
                });
                return loggedUser_checkPromise;
            }
        }

        /**
         * @ngdoc method
         * @name updateLoggedUserInfo
         * @memberOf http-auth-gui-interceptor.backendAuthService
         * @private
         * @param {LoggedUser} newLoggedUser
         * @description
         *
         * - Update user object detail from new values.
         * - Note: It is not possible to directly do "loggedUser = newUserInfo;" because:
         *       some other parts of  referrencing to original object
         */
        function updateLoggedUserInfo(newLoggedUser) {
            // Remove all old properties
            var key;
            for (key in loggedUser) {
                //noinspection JSUnresolvedFunction
                if (loggedUser.hasOwnProperty(key)) {
                    delete loggedUser[key];
                }
            }
            // Insert new properties
            angular.extend(loggedUser, newLoggedUser);
        }
    };
});

/**
 * @typedef {Object} LoggedUser
 * @description
 *
 * Currently logged user with properties.
 */
 /*global document,angular */
/**
 * @ngdoc controller
 * @name LoginDialogCtrl
 * @memberOf http-auth-gui-interceptor
 * @description
 *
 * Controller for login dialog with form for username and password.
 * Controller send "login request" to server by [backendAuthService]{@link http-auth-gui-interceptor#backendAuthService}.
 */
"use strict";
angular.module('http-auth-gui-interceptor').controller('LoginDialogCtrl',
function ($modalInstance, $timeout, $filter, backendAuthService, authService) {
	var ctrl = this;

	/** Angular binding into login form fields */
	ctrl.loginFormValues = {
		username: '',
		password: ''
	};

	/** If true, show spinning in login button */
	ctrl.working = false;

	/** Error message, when login failed */
	ctrl.error = null;

	ctrl.login = login;
	ctrl.cancelLogin = cancelLogin;

	// Focus to "username" field
	$timeout(function() {
		var loginInputEl = document.getElementById('login_username');
		if (loginInputEl) { loginInputEl.focus(); }

	}, 200);


	/**
	 * @ngdoc method
	 * @name login
	 * @memberOf http-auth-gui-interceptor.LoginDialogCtrl
	 * @description
	 *
	 * Called by on LoginForm submit
	 */
	function login() {
		ctrl.working = true;
		ctrl.error = null;
		backendAuthService.login(ctrl.loginFormValues.username, ctrl.loginFormValues.password)
			.then(function() {
				//login successfull

				//close dialog
				$modalInstance.dismiss();

			}).catch(function(errResult) {
				//	 login failed
				ctrl.loginFormValues.password = "";
				ctrl.working = false;
				ctrl.error = (errResult && errResult.data && errResult.data.err ? errResult.data.err : "#ERR_UNKNOWN");

				// Try to translate returned error (if $translate is defined)
				try {
					ctrl.error = $filter('translate')(ctrl.error);
				} catch(e) {}

				// Focus to password input
				$timeout(function() {
					var passInputEl = document.getElementById('login_password');
					if (passInputEl) {
						passInputEl.focus();
					}
				});
			});
	}

	/**
	 * @ngdoc method
	 * @name cancelLogin
	 * @memberOf http-auth-gui-interceptor.LoginDialogCtrl
	 * @description
	 *
	 * Close dialog and notify whole application about login cancelling.
	 * Called on CANCEL button press.
	 */
	function cancelLogin() {
		//close login dialog and reject promise
		$modalInstance.dismiss("cancelledByUser"); // message will be send to $routeChangeError, which show corresponding message to user.

		//reject all storedRequests
		authService.loginCancelled(null, 'cancelledByUser');
	}

}); /**
 * @ngdoc service
 * @name popupLoginDialog
 * @memberOf http-auth-gui-interceptor
 * @version 1.0.1
 * @description
 *
 * Provide method for popup modal login-form dialog with ability logging to server.<br/>
 * NOTE: Method has ability to prevent multiple dialog popup.
 * So when dialog is visible, multiple calls of methos is safe == nothing will happend.
 */
angular.module('http-auth-gui-interceptor').factory('popupLoginDialog', function($modal) {

	var openDialogInstance;

	return function () {
		if (!openDialogInstance || openDialogInstance.result.$$state.status > 0) { //promise $$state: 0=pending, 1=resolved, 2=rejected
			openDialogInstance = $modal.open({
				templateUrl: 'bower_components/angular-http-auth-gui/src/login-dialog.html',
				animation: false, // Workaround for Angular 1.4 - (issue: gray background stays visible after modal dialog close)
				size: 'md',
				controller: 'LoginDialogCtrl',
				controllerAs: 'loginDialogCtrl',
				backdrop: 'static',
				keyboard: false
			});
		} /* else Window is already open. Don't do anything. */
	}

});
 angular.module('http-auth-gui-interceptor').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('bower_components/angular-http-auth-gui/src/login-dialog.html',
    "<div class=\"panel panel-primary\"><div class=\"panel-heading\"><h3 class=\"panel-title\">Enter login credentials</h3></div><div class=\"panel-body\"><div data-ng-show=\"loginDialogCtrl.error\" class=\"bs-callout bs-callout-danger\" role=\"alert\"><h4>Error</h4>{{loginDialogCtrl.error}}</div><br class=\"hidden-xs\"><form name=\"loginForm\" class=\"form-horizontal\" data-ng-submit=\"loginDialogCtrl.login()\"><fieldset><div class=\"input-group col-sm-8 col-sm-offset-2\"><span class=\"input-group-addon\"><i class=\"fa fa-fw fa-user\"></i></span> <input id=\"login_username\" name=\"username\" type=\"text\" placeholder=\"Username\" class=\"form-control input-md\" autocomplete=\"on\" data-ng-disabled=\"loginDialogCtrl.working\" data-ng-model=\"loginDialogCtrl.loginFormValues.username\"></div><br><div class=\"input-group col-sm-8 col-sm-offset-2\"><span class=\"input-group-addon\"><i class=\"fa fa-fw fa-lock\"></i></span> <input id=\"login_password\" name=\"password\" type=\"password\" placeholder=\"Password\" class=\"form-control input-md\" autocomplete=\"on\" data-ng-disabled=\"loginDialogCtrl.working\" data-ng-model=\"loginDialogCtrl.loginFormValues.password\"></div><br><div class=\"input-group text-right col-sm-8 col-sm-offset-2\"><button data-ng-disabled=\"loginDialogCtrl.working || !loginDialogCtrl.loginFormValues.username || !loginDialogCtrl.loginFormValues.password\" type=\"submit\" id=\"login_send\" name=\"login_send\" class=\"btn btn-success\"><span data-ng-hide=\"loginDialogCtrl.working\"><i class=\"fa fa-fw fa-check\"></i> Login</span> <span data-ng-show=\"loginDialogCtrl.working\"><i class=\"fa fa-fw fa-circle-o-notch fa-spin\"></i> Loging in ...</span></button> <button type=\"button\" id=\"cancelbutton\" class=\"btn btn-link\" data-ng-disabled=\"working\" data-ng-click=\"loginDialogCtrl.cancelLogin()\"><i class=\"fa fa-times\"></i> Cancel</button></div></fieldset></form></div></div>"
  );

}]);
