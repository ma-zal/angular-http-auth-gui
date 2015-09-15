/**
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
