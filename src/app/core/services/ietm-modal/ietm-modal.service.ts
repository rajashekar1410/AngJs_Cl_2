import { Injectable } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

declare var $: JQueryStatic;

@Injectable({
  providedIn: 'root'
})
export class IetmModalService {

  config: any = {
    backdrop: true,
    ignoreBackdropClick: true,
    class: '' // this is added on runtime at common.service due to circular dep error
  };
  constructor(
    public modalService: BsModalService
  ) {
    // for every modal shown to user, make it draggable.
    this.modalService.onShow.subscribe(_ => {
      this.popdragabale();
    });
  };

  modalRef: BsModalRef = null;

  openmdl(template) {
    this.modalRef = this.modalService.show(template, this.config);
    return this.modalRef;
  }
  closemodal(id?) {
    if (!id) {
      id = this.modalRef?.id;
    }
    // Fix: modals do not close properly (ex: logout modal)
    if (id instanceof BsModalRef) {
      id = id.id;
    }
    this.modalService.hide(id);
  }

  /**
   * @deprecated use `closeModal(modalId)` instead
   */
  closepop() {
    // Hide modal, backdrop if exists
    // TODO: deprecate this and migrate to `closeModal`
    $('.modal, .modal-backdrop').hide();
    this.modalRef?.hide();
    this.modalRef = null;
  }

  popdragabale() {
    setTimeout(() => {
      $('.modal-dialog')['draggable']({
        handle: ".modal-header"
      });
    }, 1000);
  }
}
