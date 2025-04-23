/**
 * @description attachment module entry
 * @author wangfupeng
 */


import type { IModuleConf } from '@wangeditor/editor'
import withAudio from './plugin'
import { renderAudioConf } from './renderElem'
import { audioToHtmlConf } from './elemToHtml'
import { parseAudioHtmlConf } from './parseElemHtml'
import { uploadAudioMenuConf } from './menu/index'

const audioModule: Partial<IModuleConf> = {
  editorPlugin: withAudio,
  renderElems: [renderAudioConf],
  elemsToHtml: [audioToHtmlConf],
  parseElemsHtml: [parseAudioHtmlConf],
  menus: [uploadAudioMenuConf],
}

export default audioModule
