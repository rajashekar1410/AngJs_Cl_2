import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonService } from '../core/services/common/common.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { BsModalService, ModalDirective } from 'ngx-bootstrap/modal';
import { FormControl } from '@angular/forms';
import { productVersion, version, lastProdBuild } from '../../../package.json';
import * as Slider from 'bootstrap-slider';
import { UserIdleService } from '../shared/modules/user-tracking/services/user-idle/user-idle.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LogoutModalComponent } from './logout-modal/logout-modal.component';
import { RuntimeConfigLoaderService } from 'runtime-config-loader';

declare var $: JQueryStatic;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('aboutietm', { static: true }) public aboutietm: ModalDirective;
  public disabled_buttons = 0;
  public disabled_pactions = 0;
  public searchdata = [{ title: 'Eg:Page 1', id: 0 }];
  public searchval = "";
  text: string;
  results: string[];
  public access_rights = [false, false, false, false];
  public ngxControl: FormControl = new FormControl();

  productVersion = productVersion;
  productBuildVersion = version;
  productBuildDate = lastProdBuild;

  fontSliderInstance = null;

  // auto-logout on multiple login event
  timerInterval = null;

  userIdleSub$: Subscription = null;

  constructor(
    public _location: Location,
    public cs: CommonService,
    public router: Router,
    public activeroute: ActivatedRoute,
    private userIdle: UserIdleService,
    private modalS: BsModalService,
    private runtimeConfigS: RuntimeConfigLoaderService
  ) {
    this.cs.changeEmitted$.subscribe(
      text => {
        //  alert(text);
        if (text == '1') {
          setTimeout(() => {
            this.disabled_buttons = 1;
          }, 100);
        } else {
          setTimeout(() => {
            this.disabled_buttons = 0;
          }, 100);
        }
      });
    this.cs.pageactionsEmitted$.subscribe(data => {
      setTimeout(() => {
        this.disabled_pactions = data;
      }, 100);
    });
  }

  /**
   * Navigates to Global Search page without restoring previous search values
   */
  openGlobalSearchPage() {
    this.router.navigate(['/home/globalsearch'], {
      state: {
        loadPreviousState: false
      }
    })
  }

  search(event) {
    this.cs.postData({ sourceid: 'pagesearch', info: { searchquery: event.query } })
      .subscribe(data => {
        //  console.log(JSON.stringify(data));
        if (data['status'] === "1") {
          if (data['response'].length > 0) {
            this.results = data['response'];
          }

        }
      }, error => console.log(error))

  }

  onFontopen(data: boolean): void {

    //this.text = data ? 'opened' : 'closed';
    $('.font-switcher').click(event => {

      const size = $(event.target).data('size');

      if (size) {
        // update html element's font-size
        $('#full-screenmode').removeClass('font-size--s');
        $('#full-screenmode').removeClass('font-size--m');
        $('#full-screenmode').removeClass('font-size--l');
        $('#full-screenmode').removeClass('font-size--xl');
        $('#full-screenmode').addClass(`font-size--${size}`);

        // update active font in the font-switcher
        // $('.font-switcher__size').removeClass('active');
        //$(`.font-switcher__size--${size}`).addClass('active');
      }
    })
  }
  public doFocus = () => { this.searchval = ""; }
  public inputTyped = (source: string, text: string) => {
    this.searchval = text;
    if (text.length > 1) {
      this.cs.postData({ sourceid: 'pagesearch', info: { searchquery: text } })
        .subscribe(data => {
          // console.log(JSON.stringify(data));
          if (data['status'] === "1") {
            if (data['response'].length > 0) {
              this.searchdata = data['response'];
            }

          }
        }, error => console.log(error))
    } else {
      this.searchdata = [{ title: 'Eg:Page 1', id: 0 }];
    }
  };

  public doSelect = (value: any) => {
    // alert(value);

    this.text = "";
    const selected = this.results.find(b => b['id'] == value);
    // console.log(JSON.stringify(selected));
    if (selected) {
      this.router.navigate(['/home/pages/pagecmp/' + selected['page_module'] + "/" + selected['page_category'] + "/page/" + value]);
    }
  };
  ngOnInit() {
    // Fetch user types from database
    this.cs.postData({
      sourceid: 'listings', info: {
        listing_filters: {
          filtercols: {}, query: 'user_types', selected_colnames: ['id', 'user_type_id', 'user_type', 'allowed_categories'],
          search_keyword: '', search_query: '', limit: '', offset: '0', ordercolumn: 'id', ordertype: 'asc'
        }
      }
    })
      .subscribe((data: any) => {
        if (data.status == 1) {
          this.cs.user_types = data.response
        } else {
          this.cs.openGrowl('', 'Status', 'Internal error');
        }
      }, error => {
        console.error(error);
        this.cs.openGrowl('', 'Status', 'Internal error');
      })

    this.cs.refreshModuleData();
    this.cs.refreshCategoryData();
    this.cs.refreshRelatedContentTypes();


    // Fullscreen stuff
    this.fullScreenHandler();

    // IDLE logout, multiple session logout stuff
    const enableIdleLogout = this.runtimeConfigS.getConfigObjectKey('enableUserIdleLogout');
    if (enableIdleLogout)
      this.initIdleLogout();
    const enableUserMultiLoginDetection = this.runtimeConfigS.getConfigObjectKey('enableUserMultiLoginDetection');
    if (enableUserMultiLoginDetection)
      this.sessionPing();
  }

  fullScreenHandler() {
    $('#fullscreen-trigger').on('click', function () {
      var element = $('.main-content1').get(0);
      $('#full-screenmode .page-warper').addClass('full-wrappper');
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element['mozRequestFullScreen']) {
        element['mozRequestFullScreen']();
      } else if (element['webkitRequestFullscreen']) {
        element['webkitRequestFullscreen']();
      } else if (element['msRequestFullscreen']) {
        element['msRequestFullscreen']();
      }
    });
    // exit handler
    document.addEventListener('fullscreenchange', exitHandler);
    document.addEventListener('webkitfullscreenchange', exitHandler);
    document.addEventListener('mozfullscreenchange', exitHandler);
    document.addEventListener('MSFullscreenChange', exitHandler);
    function exitHandler() {
      if (!document.fullscreenElement && !document['webkitIsFullScreen'] && !document['mozFullScreen'] && !document['msFullscreenElement']) {
        $('#full-screenmode .page-warper').removeClass('full-wrappper');
        // fix: table columns misaligned on fullscreen toggle
        /*setTimeout(() => {
          $("#page_content table").DataTable().columns.adjust();
        }, 700);*/
      }
    }
  }

  openLogoutModal() {
    this.modalS.show(LogoutModalComponent, { ignoreBackdropClick: true, keyboard: false, class: this.cs.default_theme });
  }

  initIdleLogout() {
    this.userIdle.startWatching();
    this.userIdleSub$ = this.userIdle.onTimeout
      .pipe(filter(_ => this.cs.user_session.user_type != 0))
      .subscribe(_ => {
        this.cs.userLogout();
      }, err => {
        console.error(err);
      });
  }

  initFontSlider() {
    setTimeout(() => {
      const fontSliderEl = document.querySelector('#font-slider-input');
      this.fontSliderInstance = new Slider(fontSliderEl, {
        min: this.cs.contentFontMinSize,
        max: this.cs.contentFontMaxSize,
        value: this.cs.contentFontSize,
        tooltip: 'always'
      });
      this.fontSliderInstance.on('slide', this.updateFontSize.bind(this));
      this.fontSliderInstance.on('slideStop', this.updateFontSize.bind(this));
    }, 400);
  }

  destroyFontSlider() {
    this.fontSliderInstance?.destroy();
    this.fontSliderInstance = null;
  }

  public openabout() {
    this.aboutietm.show();
  }
  public openhelp(userId: number) {
    // const qs = require(`query-string`);
   // var newwindow = window.open(this.cs.imageurl + "/pdfjs/web/viewer.html?file=" + this.cs.serverip + `/staticassets/helpdocuments/user-guide-${userId}.pdf`, 'name', 'height=500,width=800');
    var newwindow = window.open(this.cs.serverip + `/staticassets/helpdocuments/user-guide-${userId}.pdf`, 'name', 'height=500,width=800');
    if (window.focus) { newwindow.focus() }

    //videoplayer\player.html

    //  this.router.navigate(['/home/pages/pagecmp/1/100']);
  }
  openVersionHistory() {
    this.router.navigateByUrl('/home/changelog');
  }
  openmdl(id) {
    //  this.cs.selmodule_id=id;
    this.cs.selpage_id = 0;

    this.router.navigate(['/home/pages/pagecmp/' + id + "/" + this.cs.default_category])
  }
  getsearchdata(val) {
    this.searchdata = [];
    this.cs.postData({ sourceid: 'pagesearch', info: { searchquery: val } })
      .subscribe(data => {
        //  console.log(JSON.stringify(data));
        if (data['status'] === "1") {
          this.searchdata = data['response'];
        }
      }, error => console.log(error))
  }
  changeCS(event) {
    // alert(event);
    this.cs.history_back = 0;
    this.cs.history_forward = 0;
  }
  printdata() {
    //alert("nted dapri");
    this.cs.triheredEmitchange('1');
  }
  addbookmark() {
    this.cs.triheredEmitchange('2');
  }
  hmsearchresults() {
    //alert("kdfgdk");
    // this.cs.emitPageactions('5');
    this.cs.triheredEmitchange('5');
  }
  updateFontSize(newSize: number) {
    if (!newSize) {
      return;
    }
    // newSize specifed, clamp it to min, max values
    // Note: https://stackoverflow.com/a/11409978
    const res = Math.max(this.cs.contentFontMinSize, Math.min(newSize, this.cs.contentFontMaxSize));
    this.cs.contentFontSize = res;
    // Update UI
    this.fontSliderInstance.setValue(newSize);
  }
  viewannotations() {
    this.cs.triheredEmitchange('4');
  }
  backClicked() {
    //alert(this.router.url);
    if (!this.router.url.includes('login')) {
      if (this.cs.sel_catid == 2) {
        window.history.go(-1);
      } else {
        this._location.back();

      }
    }
  } forwardClicked() {
    //alert(this.router.url);
    if (!this.router.url.includes('login')) {
      this._location.forward();
    }
  }


  sessionPing() {
    this.timerInterval = setInterval(() => {
      this.cs.postData({
        sourceid: "ping",
        info: {
          user_id: this.cs.user_session.id
        }
      }).subscribe(
        (resp: any) => {
          const { status, response } = resp;
          if (status == 1 && this.cs.user_session.session_id != response.id) {
            this.cs.openGrowl("", "Status", "New Login detected from other system"),
              this.cs.userLogout();
          }
        },
        err => {
          console.error(err);
        }
      );
    }, 10000);
  }

  navigateHome() {
    this.router.navigateByUrl('/home/dashboard');
    /**
     * Fix print request triggers multiple times as
     * we're not un-sub on component destroy.
     *
     * https://dikaseba.blogspot.com/2019/04/subscribe-fires-twice-when-i-revisit.html
     * (Check Solution 3)
     */
    this.cs.triggerPrintUnsub();
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
    this.userIdle.stopWatching();
    this.userIdleSub$?.unsubscribe();
    this.destroyFontSlider();
  }
}
