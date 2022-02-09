import { imageIndex, mobileImagesList, imagesList } from './app-logos';

export const environment = {
  production: false,

  // Set product level to operate as.
  // Valid options: 'v4', 'v5'
  productLevel: 'v4',

  appLogo: imagesList[imageIndex],
  appLogoMob: mobileImagesList[imageIndex]
};

/*
 * In development mode, for easier debugging, you can ignore zone related error
 * stack frames such as `zone.run`/`zoneDelegate.invokeTask` by importing the
 * below file. Don't forget to comment it out in production mode
 * because it will have a performance impact when errors are thrown
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
