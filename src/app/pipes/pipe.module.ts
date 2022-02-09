
import { ModuleWithProviders, NgModule } from '@angular/core';
import { KeysPipe } from './keys.pipe';
import { StartedPipe } from './started.pipe';
import { InArrayPipe}        from './inarray.pipe';
import { SafeHtmlPipe } from './safehtml.pipe';
import { SafeurlPipe } from './safeurl.pipe';
import {HighLightPipe} from './highlight.pipe';
@NgModule({
  imports: [],
  declarations: [
    KeysPipe,
    StartedPipe,
    InArrayPipe,
    SafeHtmlPipe,
    SafeurlPipe,
    HighLightPipe

  ],
  exports: [
    KeysPipe,
    StartedPipe,
    InArrayPipe,
    SafeHtmlPipe,
    SafeurlPipe,
    HighLightPipe
  ], })
export class PipeModule {
  static forRoot(): ModuleWithProviders<PipeModule> {
    return {
        ngModule: PipeModule,
        providers: [],
    };
}
}
