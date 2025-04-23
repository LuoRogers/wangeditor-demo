import type { IDomEditor, SlateDescendant, SlateElement } from '@wangeditor/editor'

function parseAudioElementHtml(
  domElem: Element,
  children: SlateDescendant[],
  editor: IDomEditor,
): SlateElement {
  const src = domElem.getAttribute('data-src')
  const height = domElem.getAttribute('data-height')
  const width = domElem.getAttribute('data-width')
  const myAudio = {
    type: 'audio',
    src,
    width,
    height,
    children: [{ text: '' }],
  }
  return myAudio
}
const parseAudioHtmlConf = {
  selector: 'div[data-w-e-type="audio"]',
  parseElemHtml: parseAudioElementHtml,
}

export { parseAudioHtmlConf }
