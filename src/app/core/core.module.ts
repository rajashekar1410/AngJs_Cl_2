import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PipeModule } from '../pipes/pipe.module';
import { CommonService } from './services/common/common.service';
import { IetmModalService } from './services/ietm-modal/ietm-modal.service';
import { ListingService } from './services/listing/listing.service';
import { HighlightDirective } from './directives/highlight.directive'


@NgModule({
  declarations: [
    HighlightDirective
  ],
  imports: [
    CommonModule,
    PipeModule
  ],
  providers: [
    CommonService,
    IetmModalService,
    ListingService,
  ]
})
export class CoreModule { }
