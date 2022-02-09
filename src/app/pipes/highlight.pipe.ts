import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'highlight',
  pure: false,
})
export class HighLightPipe implements PipeTransform {

  constructor() { }

  // Add new words here!
  BLACKLIST_KEYWORDS = [
    'p',
    '<p',
    'td',
    '<td',
    'th',
    '<th',
    'tr',
    '<tr',
    'img',
    '<img',
    'br',
    '<br',
    'span',
    '<span',
    'div',
    '<div',
    '<',
    '>',
  ];

  transform(htmlSnippet: string, searchQuery: string): string {
    if (searchQuery?.length == 0) return htmlSnippet;
    // filter search query
    const searchFilterFailed = this.BLACKLIST_KEYWORDS
      .map(e => e.toLowerCase().includes(searchQuery.toLowerCase()) || e.toLowerCase().includes(`<${searchQuery.toLowerCase()}`))
      .includes(true);
    if (searchFilterFailed) return htmlSnippet;

    // Process request
    const pattern = searchQuery.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\"\\^\$\|]/g, '\\$&');
    const regex = new RegExp(pattern, 'gi');
    const newValue = htmlSnippet.replace(regex, (match) => `<mark>${match}</mark>`);
    return newValue;
  }

}
