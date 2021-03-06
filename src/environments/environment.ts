export const Environment = {
  mode: 'dev',
  debug: true,
  baseUrl: 'http://localhost:8080/dev/',
  endpoint: '/ionic',
  defaultOnly: true,
  cordova: {
    name: 'Developer app.',
    id: 'io.ionic.dev',
    version: '1.0.1'
  },
  metadata: { // this propertie will be removed when build.
    googleMapKeyAndroid: 'dev-google-maps-key-android',
    googleMapKeyIOS: 'dev-google-maps-key-ios'
  }
}
