/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

//CKEDITOR.plugins.addExternal('ckeditor_wiris', 'https://www.wiris.net/demo/plugins/ckeditor/', 'plugin.js');
CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';

      // Add WIRIS to the plugin list
      //config.extraPlugins = 'ckeditor_wiris';
	 // config.skin = 'moono-dark';
config.autoParagraph = false;
config.removePlugins = 'htmldataprocessor';
	config.allowedContent = true;
	config.height = '250px';
};
