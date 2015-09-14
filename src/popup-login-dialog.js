/**
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
