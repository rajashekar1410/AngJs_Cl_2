import { imageIndex, mobileImagesList, imagesList } from './app-logos';

export const environment = {
  production: true,


  // Set product level to operate as.
  // Valid options: 'v4', 'v5'
  productLevel: 'v4',

  appLogo: imagesList[imageIndex],
  appLogoMob: mobileImagesList[imageIndex]
};
