// @see https://gwdu.ptit.edu.vn/sso/realms/ptit/.well-known/openid-configuration

function getService_() {
  return OAuth2.createService('slink')
    .setClientId('ptit-connect')
    .setParam('access_type', 'offline')
    .setScope('openid profile email offline_access')
    .setCallbackFunction('authCallback')
    .setAuthorizationBaseUrl('https://gwdu.ptit.edu.vn/sso/realms/ptit/protocol/openid-connect/auth')
    .setTokenUrl('https://gwdu.ptit.edu.vn/sso/realms/ptit/protocol/openid-connect/token')
    .setPropertyStore(PropertiesService.getUserProperties());
}

function authCallback(request) {
  const isAuthorized = getService_().handleCallback(request);
  return HtmlService.createHtmlOutput(
    `${isAuthorized ? 'Success' : 'Failed'}! You can close this now.`,
  );
}

function logout() {
  getService_().reset();
}
