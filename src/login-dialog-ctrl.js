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
function ($modalInstance, $timeout, backendAuthService, authService) {
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
				ctrl.error = (errResult && errResult.data && errResult.data.err ? errResult.data.err : "#ERR_UNKNOWN_SERVER_RESPONSE");

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

});