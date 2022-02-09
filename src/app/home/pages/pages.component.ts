import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonService } from '../../core/services/common/common.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ListingService } from 'src/app/core/services/listing/listing.service';
import { IetmModalService } from '../../core/services/ietm-modal/ietm-modal.service';
import { TreeNode, ITreeOptions, TreeComponent, IActionMapping, TreeModel, TREE_ACTIONS } from '@circlon/angular-tree-component';
import { remove } from 'lodash';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ManageannotationsComponent } from '../manageannotations/manageannotations.component';
import { TOCIndexArrange } from 'src/app/models/toc-index-arrange';
import { LRMService } from 'src/app/shared/modules/long-running-modal/services/l-r-m.service';
import { LogTypes } from 'src/app/shared/modules/logs/models/log-types';

declare var $: JQueryStatic;

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss']
})
export class PagesComponent implements OnInit, OnDestroy {

  @ViewChild('treenode') public treenoded: TreeComponent;
  options: ITreeOptions = {
    allowDrag: _ => this.cs.user_session.user_type == 0 && this.isInRearrangeMode,
    // inform tree to use 0 as top most nodes' parent.id else pages hide because of invalid parent values
    rootId: 0,
    // fix TOC jump when too many items expanded
    scrollContainer: document.body,
    actionMapping: <IActionMapping>{
      mouse: {
        dblClick: (tree: TreeModel, node: TreeNode, $event: Event) => {
          if (node.hasChildren) {
            TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
          }
        },
      }
    }
  };
  public page_tree: TreeNode[] = [];
  public pagetitle = [];
  public disabel_navbtns = 0;
  public print_preview = 0;
  public first_load = 0;
  public minimise_sidenav = 0;
  public minimise_invsidenav = 0;
  public page_breadcrumb = [];
  public glosary_type = 1;
  public invType = 1;
  activemenuid = 0;
  public activelog = 1;
  public log_form_title = 'Add Log';
  public log_form_btntitle = 'SUBMIT';
  public log_validation = "";
  public pdfSrc: string = '';
  bsModalRef: BsModalRef;
  public access_rights = [false, false, false, false];
  public page_categories = []

  // determines TOC re-arrange mode
  isInRearrangeMode = false;

  logsTypes = LogTypes;

  nextBtnDisabled = false;
  prevBtnDisabled = false;

  constructor(
    private modalService: BsModalService,
    public etmdl: IetmModalService,
    public ls: ListingService,
    public _location: Location,
    public cs: CommonService,
    public router: Router,
    private route: ActivatedRoute,
    private lrmS: LRMService
  ) {
    // this.csdataChnage.emit('1');
    /*this.cs.emitGSearchEmitted$.subscribe(
      data => {
        this.opensearchpage(data)
      });*/
    if (this.cs.user_session.access_rights != '') {
      this.access_rights = JSON.parse(this.cs.user_session.access_rights);
    }
    this.cs.active_newlinkEmitted$.subscribe(
      text => {
        this.openpage(text);
      }
    )
    this.cs.AnnotationsEmitted$.subscribe(
      text => {
        //    alert(JSON.stringify(text));
        this.cs.note_anots_count = text.note_anots_count;
        this.cs.feedback_anots_count = text.feedback_anots_count;
      });
  }
  navtoprev() {
    // nav to prev page
    this.treenoded.treeModel.getFocusedNode().toggleExpanded();
    this.treenoded.treeModel.focusPreviousNode();
    this.treenoded.treeModel.getFocusedNode().toggleActivated();
  }
  navtonext() {
    // nav to next page
    this.treenoded.treeModel.getFocusedNode().toggleExpanded();
    this.treenoded.treeModel.focusNextNode();
    this.treenoded.treeModel.getFocusedNode().toggleActivated();
  }
  displayactions(noded: any) {
    //  console.log(noded.node.data.id + ">>>>?????????");
    this.activemenuid = noded.node.data.id;
  }
  updateglosary(id) {
    this.glosary_type = id;
    this.cs.logsEmitchange(id);
  }
  updateInvType(id) {
    this.invType = id;
    this.cs.invEmitchange(id);
  }
  updateLogsType(id: LogTypes) {
    this.cs.selectedLogId = id;
    this.router.navigate(['./logs/' + id], { relativeTo: this.route });
    this.cs.logsEmitchangeCNP({ pageid: id });
  }
  getpagedata() {
    this.cs.postData({ sourceid: 'getpagedata_bycat', info: { moduletype: this.cs.selmodule_id, category_id: this.cs.sel_catid, user_type: this.cs.user_session.user_type } })
      .subscribe(data => {
        // console.log(data);
        if (data['status'] == 1) {
          this.page_categories = data['response'].catdata;
          this.page_tree = data['response'].treedata;
          if (this.cs.selpage_id == 0) {
            // alert("...."+ JSON.stringify(this.page_tree[0]));
            setTimeout(() => {
              if (this.page_tree.length > 0) {
                if (this.cs.sel_catid == 1) {
                  this.updatePageHeader(this.cs.selmodule_name);
                }
                this.cs.dual_load = 1;
                this.treenoded.treeModel.getFirstRoot().toggleActivated();
                this.disabel_navbtns = 0;
                this.cs.selpage_id = this.page_tree[0]['id'];
              }
              //console.log("::::::::::::::////////::::::::::::::::::::::::");
              // console.log(selectedNodes);
              //console.log(":::::::::::::::::://///////////::::::::::::::::::::");
              //this.router.navigate(['./page', this.page_tree[0]['id']], { relativeTo: this.route });
              // this.treenoded.treeModel.getNodeById(Number(this.page_tree[0]['id'])).setActiveAndVisible();
            }, 150);
            //  this.treenoded.treeModel.getNodeById(Number(this.page_tree[0]['id'])).setActiveAndVisible();

          } else {
            this.cs.dual_load = 0;
            this.disabel_navbtns = 1;
            setTimeout(() => {
              this.treenoded.treeModel.getNodeById(Number(this.cs.selpage_id)).setActiveAndVisible();
            }, 150);
          }
        }
      },
        err => {
          console.error(err);
        });
  }

  updatePageHeader(v: string) {
    const pc = this.cs.page_categories.find(e => e.id == this.cs.sel_catid);
    if (pc.id != 1) {
      this.cs.page_header = pc['name']
    } else {
      this.cs.page_header = v;
    }
  }

  openannots(type: number) {
    this.cs.view_annotationid = this.cs.selpage_id;
    this.cs.view_annot_type = type;
    this.bsModalRef = this.modalService.show(ManageannotationsComponent, {
      class: `modal-lg ${this.cs.default_theme}`,
      initialState: {
        updatePageHeader: false
      }
    });
    // annotation_type filter not applied
    // Note: This doesn't update `selectedContentFilter` var inside app-ietm-table
    // however since we're setting contentFilterEnabled to false, it doesn't matter :() 
    const content = this.bsModalRef.content as ManageannotationsComponent;
    content.getdtllistings(type);
    content.modalRef = this.bsModalRef;
  }
  getpagemgr(type, id, name) {
    this.router.navigate(['/home/pagemanager', { id: id, type: type, category: this.cs.sel_catid, moduleid: this.cs.selmodule_id, pagetitle: name }]);
  }
  opencat(module_id, cat_id) {
    //  alert("calt id===>>>>>///"+id);
    this.cs.selpage_id = 0;
    setTimeout(() => {
      // this.router.navigated = false;
      this.router.navigate(['/home/pages/pagecmp/' + module_id + "/" + cat_id]);
    }, 500);
  }
  openpage(id) {
    setTimeout(() => {
      try {
        this.treenoded.treeModel.getNodeById(Number(id)).setActiveAndVisible();
      }
      catch (err) {
        // console.log(this.router.url.includes('pagecmp') + "======" + !this.router.url.includes('page/'));
        if (this.router.url.includes('pagecmp') && !this.router.url.includes('page/')) {
          // console.log("in if open page==========");
          this.router.navigate(['./page', id], { relativeTo: this.route, replaceUrl: true });
        } else {
          // console.log("in else open page==========");
          this.router.navigate(['./page', id], { relativeTo: this.route });
        }
      }
    }, 1000);
  }
  loadpagedata(eventd: any) {
    //console.log("tedf>>>>????????????????????gfdg" + eventd.node.data.name);
    //this.print_preview=1;
    this.updatePageHeader(this.cs.selmodule_name);

    if (this.cs.searchTerm.length > 0) {
      this.cs.searchTerm = '';
      this.cs.searchTermTemp = '';
    } else {
      // reset searchTerm
      this.cs.searchTerm = this.cs.searchTermTemp;
    }
    // console.log("called e navigagetrout");
    // console.log(this.router.url.includes('pagecmp') + "======" + this.router.url.includes('page/'));
    if (this.router.url.includes('pagecmp') && !this.router.url.includes('page/')) {
      // console.log("in iff load page==========");
      this.router.navigate(['./page', eventd.node.data.id], { relativeTo: this.route, replaceUrl: true });
    } else {
      // console.log("in else load page==========");
      this.router.navigate(['./page', eventd.node.data.id], { relativeTo: this.route });
    }
  }
  loadcat(id) {
    //alert(id+"loaded cat");
    this.cs.selpage_id = 0;
    this.cs.annots_count = 0;
    setTimeout(() => {
      // this.router.navigated = false;
      const destinationURL = `/home/pages/pagecmp/${this.cs.selmodule_id}/${id}`;
      /**
       * [Issue] When user clicks on active page_category(like IETM Content),
       * the router navigates user to route but it doesn't trigger `route.params` event
       * such that we cannot call relevant data retrieving functions.
       *
       * [Solution] Do not call URLs that start with destination URL when triggered from here.
       */
      if (!this.router.url.startsWith(destinationURL)) {
        this.router.navigate(['/home/pages/pagecmp/' + this.cs.selmodule_id + "/" + id]);
      }
    }, 500);

  }

  public deletechild(noded: TreeNode) {
    // console.log(noded.data);
    var r = window.confirm('Are you sure you want to delete this page?');
    if (r) {
      const sub$ = this.cs.postData({ sourceid: 'calldbproc', info: { procname: 'delete_page', vals: [noded.data.id] } }).subscribe((data: any) => {
        //console.log(JSON.stringify(data));
        if (data.status == 1) {
          if (noded.parent != null) {
            noded.parent.data.children.splice(noded.parent.data.children.indexOf(noded.data), 1)
            noded.treeModel.update();
            noded.treeModel.focusNextNode();
            noded.treeModel.getFocusedNode().toggleActivated();
          }
          else {
            remove(noded.parent.data.children, noded.data);
            noded.treeModel.update();
            noded.treeModel.focusDrillUp();
            noded.treeModel.getFocusedNode().toggleActivated();
            noded.treeModel.getFocusedNode().toggleExpanded();
          }
          this.cs.openGrowl('', 'Status', 'Page Deleted successfully');
          sub$.unsubscribe();
        } else {
          this.cs.openGrowl('', 'Status', 'Some error Occured');
          sub$.unsubscribe();
        }
      });
    }
  }

  updatetblsize() {
    setTimeout(() => {
      $('#tbllistid').DataTable().columns.adjust();
      this.cs.triggerTableWidthAdjust$.next();
    }, 500);
  }
  ngOnDestroy() {
    this.cs.annots_count = 0;
    this.cs.isbookmarked = 0;
    this.cs.selpage_id = 0;
    this.cs.selmodule_id = 0;
    this.cs.emitPageactions('0');
    // set to empty string so search state isn't forgotten
    this.cs.searchTerm = '';
    this.cs.selmodule_name = "";
  }
  openlog(logdt) {
    //alert(id);
    this.activelog = logdt.id;
    this.updatePageHeader(logdt.name);
    if (this.cs.selmodule_id == 1) {
      this.router.navigate(['./logs' + logdt.id, logdt.id], { relativeTo: this.route });
    }
    else {
      this.router.navigate(['./logs' + logdt.id, Number(logdt.id - 10)], { relativeTo: this.route });
    }
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.cs.sel_catid = params['category'];
      this.cs.sel_catid = params['category'];
      this.cs.selmodule_id = params['moduletype'];
      if (this.cs.sel_catid == 1) {
        this.cs.emitPageactions('1');
        // Update page font size
      } else {
        this.cs.emitPageactions('0');
      }
      this.cs.selmodule_id = params['moduletype'];
      if (params['printview']) {
        this.print_preview = 1;
      } else {
        this.print_preview = 0;
      }
      if (this.cs.sel_catid <= 4) {
        this.getpagedata();
        this.minimise_sidenav = 0;
      }
      else if (this.cs.sel_catid == 5) {
        this.router.navigate(['./glosary', 1], { relativeTo: this.route, replaceUrl: true });
        this.minimise_sidenav = 0;
      }
      else if (this.cs.sel_catid == 6) {
        this.router.navigate(['./inventory', 1], { relativeTo: this.route, replaceUrl: true });
        this.minimise_sidenav = 1;
        this.minimise_invsidenav = 2;
      }
      else if (this.cs.sel_catid == 7) {
        // FIX: log route resets to 1 even when pageid is provided
        const logId = this.route.snapshot?.firstChild?.params?.pageid || 1;
        // Update log id before navigation
        this.cs.selectedLogId = logId;
        this.router.navigate(['./logs', logId], { relativeTo: this.route, replaceUrl: true });
        this.minimise_sidenav = 0;
      }
    });

    this.cs.updateTreeModelSubject.subscribe(data => {
      // Note: this.treenoded can be `undefined` when there are no tree nodes in database
      // for categories (`pagecategories` table in db)
      if (!this.treenoded) return;

      const treeNode: TreeNode = this.treenoded.treeModel.getNodeById(data);
      if (!treeNode) return;

      // alert(node.data.name);
      this.updatePageHeader(this.cs.selmodule_name);
      this.treenoded.treeModel.setFocusedNode(treeNode);
      // de-select any folders selected
      this.treenoded.treeModel.setActiveNode(treeNode, '');
      setTimeout(() => {
        // scroll into view
        document.querySelector('.node-content-wrapper-focused')?.scrollIntoView();

        // upd prev/next disabled status
        this.prevBtnDisabled = this.cs.selpage_id == this.page_tree[0].id;
        // Find lastNodeId
        const lastRootNode: TreeNode = this.treenoded.treeModel.getLastRoot(true);
        let lastNodeId = -1, node = lastRootNode;
        if (lastRootNode.hasChildren) {
          while (node.hasChildren) {
            node = node.children[node.children.length - 1];
            lastNodeId = node.id;
          }
        } else {
          lastNodeId = lastRootNode.id;
        }
        // set next btn disabled status
        this.nextBtnDisabled = lastNodeId == this.cs.selpage_id;
      }, 300);
    });

    // trigger TOC items update when navigating to different page
    // so TOC highlight works
    this.cs.tocChangeItems$.subscribe(_ => {
      this.getpagedata();
    });

  }

  setTOCInRearrangeMode() {
    this.isInRearrangeMode = true;
  }

  saveTOCArrangeChanges() {
    const rootNodes = this.treenoded.treeModel.roots;
    const res = TOCIndexArrange.fixUp(rootNodes);
    // console.log(res)
    this.lrmS.showBackdrop()
    this.cs.postData({ sourceid: 'update_toc', info: { rootNodes: res, module_id: this.cs.selmodule_id, category_id: this.cs.sel_catid } }).subscribe((data: any) => {
      // console.log(data)
      if (data.status == 1) {
        // console.log(JSON.stringify(data));
        // this.triggerDel$.next(data.status);
        this.isInRearrangeMode = false;
        this.lrmS.hideBackdrop()
      }
    }, err => {
      console.error(err);
      this.cs.openGrowl('', 'Status', 'Internal error.');
    });
  }

  discardTOCArrangeChanges() {
    this.isInRearrangeMode = false;
    // reset TOC contents
    this.getpagedata()
  }
}

