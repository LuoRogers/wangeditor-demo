import { DomEditor, SlateElement, type IDomEditor } from '@wangeditor/editor'
import { h, type VNode } from 'snabbdom'

interface EmptyText {
  text: ''
}

// 定义一个Audio节点数据结构
export interface AudioElement {
  type: 'audio'
  src: string
  width?: string
  height?: string
  children: EmptyText[]
}

function renderAudioElement(elemNode: SlateElement, children: VNode[] | null, editor: IDomEditor) {
  const { src = '', width = '300', height = '54' } = elemNode as AudioElement
  const selected = DomEditor.isNodeSelected(editor, elemNode)

  const audioVnode = h(
    'audio', // html标签
    {
      props: {
        src: src,
        contentEditable: false,
        controls: true,
      },
      style: {
        width: width + 'px',
        height: height + 'px',
        'max-width': '100%',
      },
    },
  )
  const vnode = h(
    'div',
    {
      props: {
        className: 'w-e-textarea-video-container', // 这里直接复用video的效果
      },
    },
    audioVnode,
  )
  const containerVnode = h(
    'div',
    {
      props: {
        contentEditable: false,
      },
      on: {
        mousedown: (e) => e.preventDefault(),
      },
    },
    vnode,
  )

  return containerVnode
}

const renderAudioConf = {
  type: 'audio',
  renderElem: renderAudioElement,
}

export { renderAudioConf }
