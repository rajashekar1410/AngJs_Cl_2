import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { AppRoutingModule } from './app.routing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { TokenInterceptor } from './core/injectables/http.interceptor';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ModalModule, BsModalRef } from 'ngx-bootstrap/modal';
import { MomentModule } from 'ngx-moment';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
import { LongRunningModalModule } from './shared/modules/long-running-modal/long-running-modal.module';
import { ToastrModule } from 'ngx-toastr';
import { CoreModule } from './core/core.module';
import { PipeModule } from './pipes/pipe.module';
import { PrintDataModule } from './shared/modules/print-data/print-data.module';
import { popperVariation, TippyModule, tooltipVariation } from '@ngneat/helipopper';
import { RuntimeConfigLoaderModule } from 'runtime-config-loader';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    AppRoutingModule,
    MomentModule,
    ModalModule.forRoot(),
    PdfJsViewerModule,
    LongRunningModalModule,
    ToastrModule.forRoot(),
    CoreModule,
    PipeModule.forRoot(),
    PrintDataModule,
    TippyModule.forRoot({
      defaultVariation: "popper",
      variations: {
        tooltip: tooltipVariation,
        popper: popperVariation,
      },
      showOnCreate: true,
      allowHTML: true,
      placement: 'auto-end'
    }),
    RuntimeConfigLoaderModule
  ],
  providers: [
    BsModalRef,
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
