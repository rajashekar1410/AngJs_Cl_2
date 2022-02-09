import { Component, OnInit } from '@angular/core';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';
import { CommonService } from './core/services/common/common.service';
import { IetmModalService } from './core/services/ietm-modal/ietm-modal.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  logoUrl = "";
  logoMobUrl = "";
  //Theme Switcher
  storedTheme = '';

  themesist = [
    {
      label: 'Dark',
      class: 'theme-dark'
    },
    {
      label: 'Semi Dark',
      class: 'theme-semi-dark'
    },
    {
      label: 'Blue',
      class: 'theme-blue'
    },
    {
      label: 'Green',
      class: 'theme-green'
    },
    {
      label: 'Light',
      class: 'theme-light'
    },
    {
      label: 'Dark Yellow',
      class: 'theme-dark-yellow'
    },
    {
      label: 'Navy Dark',
      class: 'theme-navy'
    },
    {
      label: 'Purple',
      class: 'theme-purple'
    },
  ];

  constructor(
    // needed for logos
    public cs: CommonService,
    private runtimeConfigS: RuntimeConfigLoaderService,
    private mdls: IetmModalService,
  ) { }

  ngOnInit() {
    this.initUserSession();
    this.initURL();
    this.initPrintPageDisabler();
    this.tmSwtcher();
    this.setDefaulttheme();
    // Set IETM logo
    this.logoUrl = 'data:image/jpg;base64,' + this.cs.buildEnv.appLogo;
    this.logoMobUrl = 'data:image/jpg;base64,' + this.cs.buildEnv.appLogoMob;
  }

  //Theme Switcher
  setTheme(theme: string, reload = false) {

    localStorage.setItem('theme-color', theme);
    this.storedTheme = theme;
    setTimeout(() => {
      if (reload) document.location.reload();

    }, 350);

  }
  setDefaulttheme() {
    this.cs.default_theme = localStorage.getItem('theme-color') || this.runtimeConfigS.getConfigObjectKey('themeName');
    this.setTheme(this.cs.default_theme);

    // feat: apply theme pref to IetmModalService
    this.mdls.config.class = this.cs.default_theme;

  }
  tmSwtcher() {
    //appear the colors box
    $('.switcher-container .switcher-icon').on('click', function (event) {
      //$('.switcher-container').toggleClass('appear-it');
      $(".switcher-container").animate({ right: 0, opacity: "show" }, 200);
      $('.switcher-icon').addClass('flip-it');
      $('.switcher-icon').removeClass('flip-back');

    });

    $(".switcher-container .switcher-icon").on("click", function (event) {
      event.stopPropagation();

    });
    $(document).on("click", function () {
      $(".switcher-container").animate({ right: -300, opacity: "show" }, 200);
      $('.switcher-icon').addClass('flip-back');
      $('.switcher-icon').removeClass('flip-it');
    });

  }

  initURL() {
    this.cs.serverip = this.runtimeConfigS.getConfigObjectKey('serverURL');
    //console.log(this.cs.serverip);
    this.cs.title_header = this.runtimeConfigS.getConfigObjectKey('ietmTitle');
    this.cs.title_footer = this.runtimeConfigS.getConfigObjectKey('copyRights');
  }

  initPrintPageDisabler() {
    window.onbeforeprint = function () {
      // hide body contents
      $('body').children().first().hide();
      const warningWrapper = document.createElement('div');
      warningWrapper.id = "warningWrapper";
      $(warningWrapper).css('height', '100%');
      $(warningWrapper).css('display', 'flex');
      $(warningWrapper).css('align-items', 'center');
      $(warningWrapper).css('justify-content', 'center');

      const warningLabel = document.createElement('h1');
      $(warningLabel).css('color', 'red');
      warningLabel.innerHTML = `<b>This action is not allowed.</b>`;

      $(warningWrapper).append(warningLabel);
      $('body').append(warningWrapper);
    }
    window.onafterprint = function () {
      // show body contents
      setTimeout(() => {
        $('body').children().first().show();
        $('#warningWrapper').first().remove();
      }, 400);
    }
  }

  initUserSession() {
    this.cs.refreshUserSession();
  }
}
