import { Injectable, Directive } from '@angular/core';
import { saveAs } from 'file-saver';
import { Observable } from 'rxjs';
import { HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { IPageModule } from '../../models/page-module';
import { ToastrService } from 'ngx-toastr';
import { IetmModalService } from '../ietm-modal/ietm-modal.service';
import { LogTypes } from 'src/app/shared/modules/logs/models/log-types';

import jwt_decode from 'jwt-decode';
import { UserSession } from '../../models/user-session';

import { load as fpLoad } from '@fingerprintjs/fingerprintjs';

import { environment } from 'src/environments/environment';

declare var $: JQueryStatic;
@Directive()
@Injectable()
export class CommonService {

  // Build time environment flags
  buildEnv = environment;

  public updateTreeModelSubject = new Subject()
  public security_dashredirect = 0;
  public dual_load = 0;
  private emitChangeSource = new Subject<any>();
  // Observable string streams
  changeEmitted$ = this.emitChangeSource.asObservable();
  // Service message commands
  emitChange(change: any) {
    // Fix: ExpressionChangedAfterItHasBeenCheckedError error
    // due to home.component's `disabled_buttons` var.
    setTimeout(() => {
      this.emitChangeSource.next(change);
    });
  }
  private emitAnnotations = new Subject<any>();
  // Observable string streams
  AnnotationsEmitted$ = this.emitAnnotations.asObservable();
  // Service message commands
  AnnotationsChange(change: any) {
    this.emitAnnotations.next(change);
  }
  private triggerPrint = new Subject<any>();
  // Observable string streams
  triggerPrintEmited$ = this.triggerPrint.asObservable();
  // Service message commands
  triheredEmitchange(change: any) {
    this.triggerPrint.next(change);
  }
  triggerPrintUnsub() {
    this.triggerPrint.observers.every(x => x.complete())
    // Stop multiple print events when nav from main menu and back to IETM.
    this.triggerPrint.unsubscribe();
    // reset stream so we can re-use this in future.
    this.triggerPrint = new Subject();
    this.triggerPrintEmited$ = this.triggerPrint.asObservable()
  }
  private emitPageActions = new Subject<any>();
  // Observable string streams
  pageactionsEmitted$ = this.emitPageActions.asObservable();
  // Service message commands
  emitPageactions(change: any) {
    this.emitPageActions.next(change);
  }
  private triggerLogs = new Subject<any>();
  // Observable string streams
  triggerLogsEmitted$ = this.triggerLogs.asObservable();
  // Service message commands
  logsEmitchange(change: any) {
    this.triggerLogs.next(change);
  }

  //===for inventory page===///////////////
  private triggerInv = new Subject<any>();
  // Observable string streams
  triggerInvEmitted$ = this.triggerInv.asObservable();
  // Service message commands
  invEmitchange(change: any) {
    this.triggerInv.next(change);
  }

  //===for logs page===///////////////
  selectedLogId = LogTypes.TYPE_LOGS_RADAR_OPS;

  private triggerLogsCNP = new Subject<any>();
  // Observable string streams
  triggerLogsEmittedCNP$ = this.triggerLogsCNP.asObservable();
  // Service message commands
  logsEmitchangeCNP(change: any) {
    this.triggerLogsCNP.next(change);
  }

  //===for search page===///////////////
  private emitSearch = new Subject<any>();
  // Observable string streams
  emitGSearchEmitted$ = this.emitSearch.asObservable();
  // Service message commands
  emitGSearch(change: any) {
    this.emitSearch.next(change);
  }
  //===============end of search===================
  private emitChangeCPrint = new Subject<any>();
  // Observable string streams
  changeEmittedCprint$ = this.emitChangeCPrint.asObservable();
  // Service message commands
  emitChangeCprint(change: any) {
    this.emitChangeCPrint.next(change);
  }

  public contentFontMinSize = 10;
  public contentFontMaxSize = 100;
  // Store content font size
  private _contentFontSize = 15;
  public set contentFontSize(v: number) {
    this._contentFontSize = v;
    // hack to update table font size in IETM Content
    if (this.sel_catid == 1) {
      $('#page_content td,#page_content td>p').css('font-size', `${v}px`);
    }

  }
  public get contentFontSize(): number {
    return this._contentFontSize;
  }

  //  table column fix?
  triggerTableWidthAdjust$ = new Subject();


  public modules = [{ id: 1, name: 'Module 1' }, { id: 2, name: 'Module 2' }, { id: 3, name: 'Module 3' }];
  public selmodule_name = "";
  public selcat_name = "";
  public annots_count = 0;
  public isbookmarked = 0;
  public selpage_id = 0;

  // currently selected category stuff
  private _cat_id = 0;
  public set sel_catid(v: number) {
    this._cat_id = v;
    const pc = this.page_categories.find(el => el.id == v);
    if (pc) {
      this.selcat_name = pc.name;
    }
  }
  public get sel_catid(): number {
    return this._cat_id
  }



  // currently selected module stuff
  private _module_id = 0;
  public set selmodule_id(v: number) {
    const self = this;
    this._module_id = v;
    // module name stuff
    function setModuleName() {
      const pm = this.moduledata.find(el => el.id == v);
      if (pm) {
        this.selmodule_name = pm.name;
        clearInterval(interval);
      }
    }
    // FIX: module name not set on page load
    // as `moduledata` is empty
    const interval = setInterval(() => {
      setModuleName.call(self);
    }, 300);
  }
  public get selmodule_id(): number {
    return this._module_id;
  }



  // page header
  private _page_header = "";

  public get page_header(): string {
    return this._page_header;
  }
  public set page_header(s: string) {
    setTimeout(() => {
      this._page_header = s;
    });
  }

  tocChangeItems$ = new Subject();
  navigateToPage(pageId: number) {
    this.postData({
      sourceid: 'listingdetails', info: { query: 'pages', pdata: { id: 'id', value: pageId }, selcolumns: ['id', 'page_module', 'page_category'] }
    })
      .subscribe((data: any) => {
        if (data.status == 1) {
          if (data?.response) {
            const { id, page_module, page_category } = data.response;
            this.router.navigateByUrl(`/home/pages/pagecmp/${page_module}/${page_category}/page/${id}`);
            if (page_category <= 3) this.tocChangeItems$.next();
          }
          this.popdragabale();
        }
      }, err => alert(err))
  }

  // nav from annotation adds `<mark>` to DOM
  // need to remove them before we modify it
  removeMarkTags() {
    $('mark').each(function () {
      const text = $(this).text();
      $(this).replaceWith(`<span>${text}</span>`);
    });
    this.searchTerm = '';
  }

  public page_breadcrumb = [];
  public page_mcbreadcrumb = {};
  public default_category = 1;

  // local search
  public searchTerm = "";
  public searchTermTemp = '';

  public logdata = { version_no: 0, log_date: new Date() };
  public activelog = 0;
  public firsttime_login = 0;
  public enable_sepcialprint = 0;
  public print_date = new Date();
  public view_annotationid = 0;
  public view_annot_type = 0;
  public note_anots_count = 0;
  public feedback_anots_count = 0;
  protected ngUnsubscribe: Subject<void> = new Subject<void>();
  // This data is fetched in pages.component
  public page_categories = []
  //=================ETM Class4 Demo===================//
  public title_header = "";
  public title_footer = "";
  public default_theme = "";
  public appimages = "imagesdemo";
  //public serverip="http://localhost:6595";
  public aboutietm_content = 0;
  //=================ETM Class4 Demo===================//
  //public role={0:'Admin',1:'Operator',2:'maintainer',3:'SuperAdmin'}
  // URL to web api public usersession={id:''};
  public serverip = "";
  private active_newlink = new Subject<any>();
  // Observable string streams
  active_newlinkEmitted$ = this.active_newlink.asObservable();
  // Service message commands
  active_newlinkemitChange(change: any) {
    this.active_newlink.next(change);
  }


  public get printurl(): string {
    return this.serverip + "/exeassets";
  }

  public get staticmageurl(): string {
    return this.serverip + "/staticassets";
  }

  public get imageurl(): string {
    return this.serverip + "/static";
  }


  // nedeed for runtime config to work
  public get apiUrl(): string {
    return this.serverip + "/";
  }
  // This data is fetched dynamically by dashboard.component
  public user_types = [];
  public backup_types = ['', 'Complete Backup', 'Complete Restore', 'Content Update']
  public backupstatuses = ['', 'Inprogress', 'Success', 'Failed'];
  public annotation_type = { '1': 'Notes', '2': 'Feedback to Administrator' };
  public Privacy = { '0': 'Public', '1': 'Private' };
  public explainers = { '1': 'Image Hotspot', '2': 'Video Hotspot', '3': 'Word Hotspot' };
  public seluserdata = {};
  public history_back = 0;
  public history_forward = 0;
  // Module info stored here (used for breadcrumbs and modulemanager)
  public moduledata: IPageModule[] = [];

  /**
   * Fetches page_module data on demand
   */
  public refreshModuleData() {
    this.postData({ sourceid: 'calldbproc', info: { procname: 'module_data', vals: [this.user_session.user_type] } }).subscribe((data: any) => {
      //console.log(JSON.stringify(data));
      if (data.status == 1) {
        // alert("instatus");
        var tempdt = data.response[0] as IPageModule[];
        this.moduledata = tempdt;
        this.default_category = data.response[1][0]['id'];
        //  alert( this.cs.default_category);
      }
    });
  }

  public refreshCategoryData() {
    this.postData({ sourceid: 'listings', info: { listing_filters: { filtercols: {}, query: 'pagecategories', selected_colnames: ['id', 'name', 'admin_rights', 'maintainer_rights', 'operator_rights', 'item_order'], search_keyword: '', search_query: '', limit: '', offset: '0', ordercolumn: 'item_order', ordertype: 'asc' } } })
      .subscribe((data: any) => {
        if (data.status == 1) {
          this.page_categories = data.response
        } else {
          this.openGrowl('', 'Status', 'Internal error');
        }
      }, error => {
        console.error(error);
        this.openGrowl('', 'Status', 'Internal error');
      })
  }


  /**
   * Determines a pagecategory (like 'IETM Content', 'Manuals', etc.) are accessible
   * to logged in user.
   * @param pc pagecategory object
   */
  isPageCategoryAccessible(pc) {
    // Inventory, Logs not accessible if buildLevel is v4.
    if ([6, 7].includes(pc['id'])) {
      if (this.buildEnv.productLevel != 'v5') return;
    }
    try {
      const userType = this.user_session.user_type;
      if (userType == 1) {
        return parseInt(pc['admin_rights']) == 1
      } else if (userType == 2) {
        return parseInt(pc['operator_rights']) == 1
      } else if (userType == 3) {
        return parseInt(pc['maintainer_rights']) == 1
      } else {
        // default allow others, future compatibility with other user types.
        return true;
      }
    } catch (err) {
      return false;
    }

  }

  /**
   * Performs a user logout operation and navigates user to login screen. By default, server request is also triggered.
   * 
   * @param updateServer determines if logout happens in server-end as well (default: true)
   */
  public async userLogout(updateServer = true) {
    // hide modal via service
    this.mdls.closemodal();
    // Hide orphan modals
    this.mdls.closepop();
    // inform server about logout
    let response = {}, canProceed = !updateServer;
    if (updateServer) {
      response = await this.postData({ sourceid: 'auth/logout', info: { session_id: this.user_session['session_id'] } }).toPromise();
      if (response['status'] != 1) {
        this.openGrowl('', 'Status', "Unable to logout user.");
        canProceed = false;
      } else {
        canProceed = true;
      }
    }
    // update UI
    if (canProceed) {
      this.setusersession(null);
      this.router.navigate(['/login']);
    }
  }

  public pdfloaded = 0;
  public pdfoptions = { zoom: 1, page: 1, rotation: 0, totalpages: 0, showall: true, originalsize: true, search_value: '' };
  public bfls_relatedlist = []
  public inventory_actiontypes = { '1': 'Demanded', '2': 'Consumed', '3': 'Received' };
  /*public show_searchResults = false;
  public etmcore_searchresults = [];
  public etmcoresearch = "";*/

  // this data is fetched on home component
  public related_contents = [];
  public related_contents_list = []

  /**
   * Fetches related_content_types data on demand
   */
  public refreshRelatedContentTypes() {
    this.postData({ sourceid: 'listings', info: { listing_filters: { filtercols: {}, query: 'related_content_types', selected_colnames: ['id', 'name'], search_keyword: '', search_query: '', limit: '', offset: '0', ordercolumn: 'id', ordertype: 'asc' } } })
      .subscribe((data: any) => {
        if (data.status == 1) {
          // alert("instatus");
          const tempdt = data.response;
          this.related_contents = tempdt;
          this.related_contents_list = [''];
          tempdt.forEach(e => this.related_contents_list.push(e.name));
        }
      });
  }


  CKEditorConfig = {
    allowedContent: true,
    disableNativeSpellChecker: false,
    toolbarGroups: [
      { name: 'tools', groups: ['tools'] },
      { name: 'document', groups: ['mode', 'document', 'doctools'] },
      //{ name: 'clipboard', groups: ['clipboard', 'undo'] },
      //{ name: 'editing', groups: ['find', 'selection', 'spellchecker', 'editing'] },
      { name: 'forms', groups: ['forms'] },
      { name: 'basicstyles', groups: ['basicstyles'/*, 'cleanup'*/] },
      { name: 'paragraph', groups: ['align', /*'list', 'indent',  'blocks', 'bidi', 'paragraph'*/] },
      //  { name: 'links', groups: ['links'] },
      //  { name: 'insert', groups: ['insert', "imageExplorer"] },
      //  { name: 'styles', groups: ['styles'] },
      { name: 'colors', groups: ['colors'] },

      //  { name: 'others', groups: ['others'] },
      // { name: 'about', groups: ['about'] }
    ],
    removeButtons: 'NewPage,Preview,Print,Templates,Form,Checkbox,Radio,TextField,Textarea,Select,Button,ImageButton,HiddenField,Language,Flash,Image,Iframe,About',
    height: 150
  }

  updatepdfoptions() {
    this.pdfoptions = { zoom: 1, page: 1, rotation: 0, totalpages: 0, showall: true, originalsize: true, search_value: '' };
  }

  constructor(
    private router: Router,
    private toastrService: ToastrService,
    private http: HttpClient,
    private mdls: IetmModalService
  ) { };

  public stopvideo() {
    $("video").each(function () { (this as any).pause() })
  }
  public postData<T>(data): Observable<T> {
    var headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    headers.append('Authorization', 'Basic ' + 'ZW5hMjBwamgxNToyNmJhZjBjZjQ5Y2Q4ZmM4NGE5NGYxMmVhNGJiM2NmZA==');
    return this.http.post<T>(this.apiUrl + data.sourceid, JSON.stringify(data.info), { headers: headers });

  }
  public downloadData<T>(data) {
    // alert("called download===");
    var headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    headers.append('Authorization', 'Basic ' + 'ZW5hMjBwamgxNToyNmJhZjBjZjQ5Y2Q4ZmM4NGE5NGYxMmVhNGJiM2NmZA==');
    this.http
      .post(this.apiUrl + "/download", JSON.stringify({ path: data }), { headers, responseType: "blob" }) //set response Type properly (it is not part of headers)
      .toPromise()
      .then(blob => {
        saveAs(blob, data);
      })
      .catch(err => console.error("download error = ", err))
  }

  uppdatepdfoptions(option) {
    if (option == 'zoomplus' && this.pdfoptions.zoom > 0.5) { this.pdfoptions.zoom = Number(this.pdfoptions.zoom) - 0.5; }
    if (option == 'zoomminus') { this.pdfoptions.zoom = Number(this.pdfoptions.zoom) + 0.5; }
    if (option == 'rotationclock' && this.pdfoptions.rotation < 360) { this.pdfoptions.rotation = Number(this.pdfoptions.rotation) + 90 }
    if (option == 'rotationanticlock' && this.pdfoptions.rotation > 0) { this.pdfoptions.rotation = Number(this.pdfoptions.rotation) - 90 }
    if (option == 'pageminus' && Number(this.pdfoptions.page) > 1) { this.pdfoptions.showall = false; this.pdfoptions.page = Number(this.pdfoptions.page) - Number(1) }
    if (option == 'pageplus' && Number(this.pdfoptions.page) < Number(this.pdfoptions.totalpages)) { this.pdfoptions.showall = false; this.pdfoptions.page = Number(this.pdfoptions.page) + Number(1) }
    if (option == 'showall') { this.pdfoptions.page = 0; this.pdfoptions.search_value = ""; this.pdfoptions.showall = true; }
    if (option == 'zoomminus' && this.pdfoptions.zoom >= 0) { }
  }
  uppdatepdfpage(value) {
    this.pdfoptions.search_value = "";
    this.pdfoptions.showall = false; this.pdfoptions.page = Number(value);
  }
  loadedpdf(event) {
    //alert(event);
    // console.log(event.numPages);
    this.pdfloaded = 1;
    this.pdfoptions.totalpages = event.numPages;
  }
  triggerpdf(id): void {
    /*this.cs.postData({ sourceid: 'listmgr', info: { tdata: { id: '', user_id: this.cs.user_session.id, page_id: this.cs.selpage_id }, query: 'print_history', pdata: { id: 'id', value: '' } } })
      .subscribe((data: any) => {
        console.log(JSON.stringify(data));
        if (data.status == 1) {
          //  console.log("print recordeed======");
         // window.open('', 'printwin');
       //   this.kendopdf.saveAs('print_preview.pdf');
         // this.opengenpdf();
         this.printService.onDataReady();
        } else {
          this.cs.openGrowl('', "Status", "Some error ocured");
        }
      });*/
    let printContents, popupWin;
    printContents = document.getElementById(id).innerHTML;

    popupWin = window.open('', '_blank', 'top=0,left=0,height=100%,width=auto');
    popupWin.document.open();
    popupWin.document.write(`
        <html>
          <head>
           <title>IETM Generated</title>
           <link rel="stylesheet" media="all" href="http://localhost/ietm/styles.e80e53bf2db2c2990bda.css">
            <style>
              .page-header, .page-header-space {  min-height:25px; max-height:50px; }
              .page-footer, .page-footer-space {  height: 50px;}
              .page-footer { position: fixed; bottom: 0;width: 100%; }
              .page-footer :after{counter-increment: page; content:"Page " counter(page); text-align: center; }
              .page-header {position: fixed;top: 0mm;width: 100%;border-bottom: 1px solid black; }
              .page { page-break-after: always; margin:5mm 10mm;}
              @page { margin:10mm 0; }
              @media print {
                thead {display: table-header-group;}
                tfoot {display: table-footer-group;}
                button {display: none;}
                body {margin: 0;}
              }
            </style>` );
    //   alert(JSON.stringify($('head').clone().html()));
    // popupWin.document.write(($('head').clone()).html());
    popupWin.document.write(`</head>
      <body onload="window.print();window.close()">
        <div class="page-header" style="text-align: center">  `+ this.page_header + `</div>
        <table>
          <thead>
            <tr><td><div class="page-header-space"></div> </td> </tr>
          </thead>
          <tbody>
            <tr><td><div class="page">` );
    popupWin.document.write($('<div/>').append($('#' + id).clone()).html());
    popupWin.document.write(`</div></td></tr>
          </tbody>
        </table>
       </body>
      </html>`);

    popupWin.document.close();
  }
  public popdragabale() {
    setTimeout(() => {
      $('.modal-dialog')['draggable']({
        handle: ".modal-header"
      });
    }, 1000);
  }
  public arrayOne(n: number): any[] {
    return Array(n);
  }
  public arrayThree(n: number, startFrom: number): number[] {
    return [Array(n).keys()].map(i => Number(i) + Number(startFrom));
  }

  user_session: UserSession = null;
  public setusersession(token: string | null) {
    if (token != null) {
      sessionStorage.setItem('ietm_usersession', token);
      this.user_session = jwt_decode(this.getSessionToken());
    } else {
      sessionStorage.removeItem('ietm_usersession');
      this.user_session = null;
    }
    // data=data==""? {email_id:"",display_name:'',profile_pic:'',id:''}: data;
  }

  getSessionToken(): string {
    return sessionStorage.getItem('ietm_usersession');
  }

  refreshUserSession() {
    this.setusersession(this.getSessionToken());
  }

  getMachineId() {
    return fpLoad()
      .then(v => v.get())
      .then(v => v.visitorId)
      .catch(err => {
        console.error(err);
        return '';
      });
  }

  /**
   * 
   * @param url URL to upload file(s)
   * @param params any optional parameters to send
   * @param files file(s) to be uploaded
   * @param rootDir if not provided, 'staticassets' is used
   * @returns Promise that resolves when job completes
   * 
   * @deprecated use `processFileUpload`. It supports file upload progress event reports
   */
  makeFileRequest(url: string, params: Array<string>, files: Array<File>, rootDir: string = null) {
    return new Promise((resolve, reject) => {
      var formData = new FormData();
      var xhr = new XMLHttpRequest();
      formData.append("filetype", params['0']);
      if (rootDir)
        formData.append("rootDir", rootDir);
      // console.log(formData);
      for (var i = 0; i < files.length; i++) {
        formData.append("uploads[]", files[i], files[i].name);
      }
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            resolve(JSON.parse(xhr.response));
          } else {
            reject(xhr.response);
          }
        }
      }
      xhr.open("POST", this.apiUrl + url, true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + this.getSessionToken());
      xhr.send(formData);
    });
  }

  processFileUpload(url: string, params: Array<string>, files: Array<File>, rootDir: string = null) {
    return new Observable<any>(observer => {
      var formData = new FormData();
      var xhr = new XMLHttpRequest();
      formData.append("filetype", params['0']);
      if (rootDir)
        formData.append("rootDir", rootDir);
      // console.log(formData);
      for (var i = 0; i < files.length; i++) {
        formData.append("uploads[]", files[i], files[i].name);
      }
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            observer.next(JSON.parse(xhr.response));
          } else {
            observer.error(xhr.response);
          }
        }
      }
      xhr.open("POST", this.apiUrl + url, true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + this.getSessionToken());
      xhr.upload.onprogress = ev => observer.next(ev);
      xhr.send(formData);
    });
  }

  private handleError(error: any) {
    //  console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
  openGrowl(severity, summary, detail) {
    const msg = `${summary}: ${detail}`;
    this.toastrService.show(msg, '', {
      timeOut: 5000,
      messageClass: 'snack',
      toastClass: 'snackbars'
    });
  }

  opengenpdf(filename) {
    // alert(filename)
    setTimeout(() => {
      this.emitChangeCprint(this.printurl + "/" + filename);
    }, 2000);

  }
}
@Injectable()
export class CustomInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.headers.has('Content-Type')) {
      req = req.clone({ headers: req.headers.set('Content-Type', 'application/json').set('Authorization', 'Basic ' + 'ZW5hMjBwamgxNToyNmJhZjBjZjQ5Y2Q4ZmM4NGE5NGYxMmVhNGJiM2NmZA==') });
    }
    // req = req.clone({ headers: req.headers.set('Accept', 'application/json') });
    //  console.log(JSON.stringify(req.headers));
    return next.handle(req);
  }
}

