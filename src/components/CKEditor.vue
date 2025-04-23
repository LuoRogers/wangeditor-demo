<template>
  <div :class="$attrs.class">
    <Ckeditor v-model="data" :editor="ClassicEditor" :config="config" @ready="onEditorReady" />
    <input type="file" ref="upload" @change="onFileChange" style="display: none" />
    <input
      type="file"
      ref="uploadVideo"
      @change="onVideoUpload"
      accept="video/*"
      style="display: none"
    />
    <input
      type="file"
      ref="uploadAudio"
      @change="onAudioUpload"
      accept="audio/*"
      style="display: none"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRaw } from 'vue'
defineOptions({
  inheritAttrs: false,
})
type EditorConfig = {
  licenseKey?: string
  plugins?: any[]
  toolbar?: {
    items?: string[]
    shouldNotGroupWhenFull?: boolean
  }
  image?: {
    toolbar?: string[]
  }
  table?: {
    contentToolbar?: string[]
  }
  [key: string]: any
}

import {
  ClassicEditor,
  Bold,
  Italic,
  Heading,
  List,
  Link,
  ImageUpload,
  ImageToolbar,
  ImageInsert,
  Table,
  TableToolbar,
  CodeBlock,
  Indent,
  ImageStyle,
  Alignment,
  ButtonView,
  Plugin,
  HtmlEmbed,
  MediaEmbed,
  Clipboard,
  ClipboardPipeline,
  ImageResize,
  FileRepository,
  FindAndReplace,
  Code,
  Autoformat,
  Strikethrough,
  GeneralHtmlSupport,
  PasteFromOffice,
  WordCount,
  ContextualBalloon,
  Widget,
  toWidget,
  ImageBlockEditing,
  ImageTextAlternative,
} from 'ckeditor5'

import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import 'ckeditor5/ckeditor5.css'
// import {
//     ButtonView,
//     BalloonPanelView,
//     ContextualBalloon,
// } from "@ckeditor/ckeditor5-ui";

const props = defineProps({
  toolbar: { type: [Object, Array] },
  value: { default: '' },
  readonly: { default: false },
  uploadConfig: {},
  height: {},
  placeholder: { default: '请输入' },
  autoHeight: { default: false },
  maxlength: {},
  charCount: { default: 0 },
})

const emit = defineEmits([
  'input',
  'onFocus',
  'onBlur',
  'onChange',
  'onPending',
  'onTextChange',
  'onSelectionChange',
  'onEditorChange',
  'update:value',
  'update:modelValue',
])

const data = ref(props.value)
const editor = ref()
const ckeditor = ref<any>()
const currentValue = ref<any>(props.value)
const upload = ref()
const uploadVideo = ref()
const uploadAudio = ref()
const editorPanel = ref()
const previewGenTimer = ref<any>(null)
const preViewGenTimeout = ref<number>(200)
const preViewGenWaitTime = ref<number>(0)

// 新增的编辑器就绪回调
const onEditorReady = (editor: any) => {
  console.log('Editor is ready', editor)
  ckeditor.value = editor // 将编辑器实例赋给 ckeditor.value

  let isProcessing = false
  editor.setData(currentValue.value)
  let oldData = ''
  let charLimitMode = false
  editor.plugins.get('WordCount').on('update', (evt: any, stats: any) => {
    if (props.maxlength && stats.characters >= props.maxlength) {
      charLimitMode = true
    } else {
      charLimitMode = false
      if (editor) {
        oldData = editor.getData()
      }
    }
  })
  editor.model.document.on('change:data', async () => {
    if (charLimitMode) {
      editor.setData(oldData)
      setTimeout(() => {
        editor.model.change((innerWriter: any) => {
          const root = editor.model.document.getRoot()

          // Find the last child and set cursor to the end of it
          const endPosition = innerWriter.createPositionAt(root, 'end')
          innerWriter.setSelection(endPosition) // Move cursor to the end
        })
      }, 0)
      return
    }
    const data = editor.getData()
    currentValue.value = editor.getData()
    emit('update:value', editor.getData())
    emit('onChange')
    if (isProcessing) return // 如果正在处理，直接返回

    const parser = new DOMParser()
    const doc = parser.parseFromString(data, 'text/html')
    const images = Array.from(doc.querySelectorAll('img'))
    // if (images.length > 0) {
    //   // 标记正在处理
    //   isProcessing = true;
    //   const excludedDomain = (await attachmentServiceApi.getMinioConfig())
    //     .stsTokenV2.endPoint;
    //   await new Promise(async (reslove, reject) => {
    //     for (let image of images) {
    //       const imgUrl = image.src;

    //       // 检查是否是外部链接
    //       if (imgUrl.startsWith("http")) {
    //         // 提取主域名
    //         const url = new URL(imgUrl);
    //         const hostname = url.hostname;

    //         if (excludedDomain && hostname.endsWith(excludedDomain)) {
    //           break;
    //         }
    //         // 下载并上传图片到服务器
    //         const blob = await (await fetch(imgUrl)).blob();
    //         const file = new File([blob], "image.jpg", {
    //           type: blob.type,
    //         });
    //         const newImgUrl = await uploadFile(file);
    //         image.src = `${newImgUrl}`;

    //         editor.setData(doc.body.innerHTML);
    //       }
    //     }
    //   });
    //   isProcessing = false;
    // }
  })
  editor.ui.focusTracker.on('change:isFocused', (evt: any, name: any, isFocused: any) => {
    if (isFocused) {
      emit('onFocus')
    } else {
      emit('onBlur')
    }
  })
  //如果有高度设置，则以该高度设置输入框高度
  if (props.height) {
    editor.editing.view.domRoots.get('main').parentElement.style.height = `${props.height}px`
  } else if (props.autoHeight) {
    // 只向上找一级parent
    const { height } = editorPanel.value.parentNode.getBoundingClientRect()
    editor.editing.view.domRoots.get('main').parentElement.style.height = height - 30 + 'px'
  }

  editor.plugins.get('FileRepository').createUploadAdapter = function (loader: any) {
    return new ImageUploadAdapter(loader, editor)
  }
  const toolbarElement = ref<any>()
  toolbarElement.value = editor.ui.view.toolbar.element
  const editableElement = ref<any>()
  editableElement.value = editor.ui.view.editable.element

  editor.on('change:isReadOnly', (evt: any, propertyName: any, isReadOnly: any) => {
    if (isReadOnly) {
      toolbarElement.value.style.display = 'none'
      editableElement.value.style.border = 'none'
    } else {
      toolbarElement.value.style.display = 'flex'
      editableElement.value.style.border = '1px solid'
    }
  })
  // editor.execute( 'codeBlock', { language: 'css' } );

  //启动或关闭编辑器只读模式
  if (props.readonly) {
    editor.enableReadOnlyMode('')
  } else {
    editor.disableReadOnlyMode('')
  }

  //监听剪贴板粘贴事件
  editor.plugins.get('ClipboardPipeline').on('inputTransformation', (event: any, data: any) => {
    let pasteData = data.dataTransfer.getData('text/plain') //获取纯文本内容

    //判断粘贴内容里否有HTML
    if (!data.dataTransfer.getData('text/html')) {
      let viewFragment = editor.data.processor.toView(formatPlainText(pasteData)) //将HTML代码字符串转换为View
      let modelFragment = editor.data.toModel(viewFragment) //将View转为Model
      editor.model.insertContent(modelFragment, editor.model.document.selection) //在光标位置插入内容
      event.stop() //阻止编辑器自身的粘贴事件
    } else {
      const selection = editor.model.document.selection

      if (!isSelectionInCodeBlock(selection)) {
        pasteData = data.dataTransfer.getData('text/html')
        pasteData = pasteData.replace(/<o:p>\s*<\/o:p>/g, '')
        let viewFragment = editor.data.processor.toView(pasteData) //将HTML代码字符串转换为View
        let modelFragment = editor.data.toModel(viewFragment) //将View转为Model
        editor.model.insertContent(modelFragment, editor.model.document.selection) //在光标位置插入内容
        event.stop() //阻止编辑器自身的粘贴事件
      }
    }
  })

  ckeditor.value = editor
}

watch(
  () => props.value,
  (newValue) => {
    if (ckeditor.value) {
      ckeditor.value.setData(newValue)
    }
  },
  {
    immediate: true,
  },
)

// // 当data发生变化时，更新modelValue
// watch(() => props.value, (newValue) => {
//     if (ckeditor.value && ckeditor.value.isReady) {
//         data.value = newValue;
//     }
// })

//自定义附件上传插件
class uloadFilePlugin extends Plugin {
  init() {
    const editor = this.editor
    const icon = `<svg t="1713252800735" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6248" width="200" height="200"><path d="M569.796282 269.412265V0H173.625894C147.29023 0 126.09554 21.19469 126.09554 47.530354v919.13044c0 26.335664 21.19469 47.530354 47.530354 47.530354h665.582653c26.335664 0 47.530354-21.19469 47.530354-47.530354v-649.718175h-269.412265a47.656513 47.656513 0 0 1-47.530354-47.530354z m129.092063 427.867804h-129.123603v158.455539c0 17.504543-14.192873 31.697416-31.697416 31.697416h-63.394831c-17.504543 0-31.697416-14.192873-31.697416-31.697416v-158.455539H313.851477c-28.291126 0-42.42092-34.252133-22.33012-54.185234l191.004527-189.585241a33.779037 33.779037 0 0 1 47.624973 0l191.004528 189.585241c20.0908 19.964641 5.992546 54.185234-22.29858 54.185234z m173.97308-489.275634L678.923704 13.877476a47.498814 47.498814 0 0 0-33.684418-13.877476h-12.079712v253.547787h253.547787v-12.079712c0-12.489728-4.951736-24.56944-13.877476-33.46364z" p-id="6249" fill="#2c2c2c"></path></svg>`
    editor.ui.componentFactory.add('uploadFile', (locale: any) => {
      const button = new ButtonView(locale)
      button.set({
        label: '上传附件',
        tooltip: '上传附件',
        withText: false,
        icon: icon,
      })

      button.on('execute', () => {
        upload.value.click()
      })
      return button
    })
  }
}

//自定义视频上传插件
class uploadVideoPlugin extends Plugin {
  init() {
    const editor = this.editor
    const icon = `<svg t="1713252853146" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8186" width="200" height="200"><path d="M682.7 170.7a42.7 42.7 0 0 1 42.7 42.7v179.2l222.4-155.7a21.3 21.3 0 0 1 33.6 17.5v515.4a21.3 21.3 0 0 1-33.6 17.5L725.3 631.5v179.2a42.7 42.7 0 0 1-42.7 42.7H85.3a42.7 42.7 0 0 1-42.7-42.7V213.3a42.7 42.7 0 0 1 42.7-42.7h597.3zM384 341.3L213.3 512h128v170.7h85.3V512h128L384 341.3z" p-id="8187" fill="#2c2c2c"></path></svg>`
    editor.ui.componentFactory.add('uploadVideo', (locale: any) => {
      const button = new ButtonView(locale)
      button.set({
        label: '上传视频',
        withText: false,
        icon: icon,
        tooltip: '上传视频',
      })
      button.on('execute', () => {
        uploadVideo.value.click()
      })
      return button
    })
  }
}

// 自定义音频上传插件
class uploadAudioPlugin extends Plugin {
  init() {
    const editor = this.editor
    const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M17.47 14.47a.75.75 0 0 1 1.06 0l2.5 2.5a.75.75 0 1 1-1.06 1.06l-1.22-1.22V22a.75.75 0 0 1-1.5 0v-5.19l-1.22 1.22a.75.75 0 1 1-1.06-1.06z" clip-rule="evenodd"/><path fill="currentColor" d="M12.25 15a1.25 1.25 0 1 0-2.5 0a1.25 1.25 0 0 0 2.5 0"/><path fill="currentColor" fill-rule="evenodd" d="M15.75 21.273A10 10 0 0 1 12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10a10 10 0 0 1-.547 3.27l-1.863-1.86a2.25 2.25 0 0 0-3.182 0l-2.5 2.5a2.25 2.25 0 0 0 1.841 3.827zM13 6.25a.75.75 0 0 1 .75.75A2.25 2.25 0 0 0 16 9.25a.75.75 0 0 1 0 1.5a3.73 3.73 0 0 1-2.25-.75v5a2.75 2.75 0 1 1-1.5-2.45V7a.75.75 0 0 1 .75-.75" clip-rule="evenodd"/></svg>`
    editor.ui.componentFactory.add('uploadAudio', (locale: any) => {
      const button = new ButtonView(locale)
      button.set({
        label: '上传音频',
        withText: false,
        icon: icon,
        tooltip: '上传音频',
      })
      button.on('execute', () => {
        uploadAudio.value.click()
      })
      return button
    })
  }
}

class CpImageSwiperPlugin extends Plugin {
  static get requires() {
    return [Widget, ContextualBalloon]
  }

  init() {
    const editor = this.editor

    editor.model.schema.register('cpImageSwiper', {
      isObject: true,
      isBlock: true,
      allowWhere: '$block',
      allowAttributes: ['images', 'style'], // ✅ 允许 `style` 修改高度
    })

    editor.conversion.for('upcast').elementToElement({
      view: 'cp-image-swiper',
      model: (viewElement, { writer }) => {
        return writer.createElement('cpImageSwiper', {
          images: viewElement.getAttribute('images') || '',
          style: viewElement.getAttribute('style') || '',
        })
      },
    })

    editor.conversion.for('dataDowncast').elementToElement({
      model: 'cpImageSwiper',
      view: (modelElement: any, { writer }) => {
        return writer.createEmptyElement('cp-image-swiper', {
          images: modelElement.getAttribute('images'),
          style: modelElement.getAttribute('style'),
        })
      },
    })

    editor.conversion.for('editingDowncast').elementToElement({
      model: 'cpImageSwiper',
      view: (modelElement: any, { writer }) => {
        const container = writer.createContainerElement('cp-image-swiper', {
          images: modelElement.getAttribute('images'),
          style: modelElement.getAttribute('style'),
        })

        // 添加可选中标记
        return toWidget(container, writer, {
          label: '图片轮播组件',
          hasSelectionHandle: true,
        })
      },
    })
  }
}

const config = computed<EditorConfig>(() => {
  return {
    licenseKey: 'GPL',
    plugins: [
      Bold,
      Italic,
      Heading,
      FileRepository,
      List,
      Indent,
      Link,
      ImageBlockEditing,
      ImageTextAlternative,
      Image,
      ImageUpload,
      ImageResize,
      ImageInsert,
      ImageToolbar,
      ImageStyle,
      Alignment,
      uloadFilePlugin,
      uploadVideoPlugin,
      uploadAudioPlugin,
      Clipboard,
      ClipboardPipeline,
      MediaEmbed,
      HtmlEmbed,
      Table,
      TableToolbar,
      FindAndReplace,
      CodeBlock,
      Autoformat,
      Code,
      Strikethrough,
      GeneralHtmlSupport,
      PasteFromOffice,
      WordCount,
    ],
    toolbar: {
      items: [
        'bold',
        'italic',
        'code',
        'strikethrough',
        '|',
        'heading',
        '|',
        'bulletedList',
        'numberedList',
        '|',
        'alignment',
        '|',
        'link',
        'imageUpload',
        // "videoUpload",
        'uploadAudio',
        'uploadVideo',
        'uploadFile',
        '|',
        'insertTable',
        '|',
        'codeBlock',
      ],
      shouldNotGroupWhenFull: true,
    },
    heading: {
      options: [
        {
          model: 'paragraph',
          title: 'Paragraph',
          class: 'ck-heading_paragraph',
        },
        {
          model: 'heading1',
          view: 'h1',
          title: 'Heading 1',
          class: 'ck-heading_heading1',
        },
        {
          model: 'heading2',
          view: 'h2',
          title: 'Heading 2',
          class: 'ck-heading_heading2',
        },
        {
          model: 'heading3',
          view: 'h3',
          title: 'Heading 3',
          class: 'ck-heading_heading3',
        },
      ],
    },
    placeholder: props.placeholder,
    image: {
      toolbar: [
        'imageStyle:alignBlockLeft',
        'imageStyle:alignCenter',
        'imageStyle:alignBlockRight',
        '|',
        'imageStyle:alignLeft',
        'imageStyle:alignRight',
        '|',
        'imageTextAlternative',
      ],
      styles: {
        options: ['alignLeft', 'alignCenter', 'alignRight', 'alignBlockLeft', 'alignBlockRight'],
      },
    },
    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
    },
    mediaEmbed: {
      providers: [
        {
          name: 'video',
          url: [/.(mp4|mov|avi|mkv|wmv)$/],
          html: (match: any) => {
            const input: any = match['input']
            const mineType: any = {
              mp4: 'video/mp4',
              ogg: 'video/ogg',
              webm: 'video/webm',
              mov: 'video/quicktime',
              avi: 'video/x-msvideo',
              wmv: 'video/x-ms-wmv',
              flv: 'video/x-flv',
              mkv: 'video/x-matroska',
              m4v: 'video/x-m4v',
              '3gp': 'video/3gpp',
              '3g2': 'video/3gpp2',
              mpeg: 'video/mpeg',
              mpg: 'video/mpeg',
              mpe: 'video/mpeg',
              m1v: 'video/mpeg',
              m2v: 'video/mpeg',
              ts: 'video/mp2t',
              m3u8: 'application/x-mpegURL',
              f4m: 'application/vnd.adobe.f4m+xml',
              f4f: 'video/mp4',
              f4p: 'video/mp4',
              f4a: 'audio/mp4',
              f4b: 'video/mp4',
              m4a: 'audio/mp4',
              m4b: 'audio/mp4',
              m4p: 'audio/mp4',
              m4r: 'audio/mp4',
            }
            //class="video-js"  style="width:30rem;height:15rem;"
            return `

            <div style="text-align:center;" class='editorVideoStyle'>
                <video  controls data-setup='{}'>
                  <source src="${input.replace(/\.[^/.]+$/, '')}_transcode.mp4" type='video/mp4'></source>
                  <source src="${input}" type='${mineType[input.split('?')[0].split('.').pop().toLowerCase()]}'></source>
                </video>
              </div>`
          },
        },
        {
          name: 'audio',
          url: [/.(mp3|wav|ogg|flac|aac)$/],
          html: (match: any) => {
            const input: any = match['input']
            const mineType: any = {
              mp3: 'audio/mp3',
              wav: 'audio/wav',
              ogg: 'audio/ogg',
              flac: 'audio/flac',
              aac: 'audio/aac',
            }
            return `
            <div style="text-align:center;" class='editorVideoStyle'>
                <audio class="" controls data-setup='{}' class='editorVideoStyle'>
                  <source src="${input}" type='${mineType[input.split('?')[0].split('.').pop().toLowerCase()]}'></source>
                </audio>
              </div>
            `
          },
        },
      ],
    },
    htmlEmbed: {
      showPreviews: true,
      sanitizeHtml: (inputHTML: any) => {
        // const outputHTML=sanitize(inputHTML)
        const outputHTML = inputHTML
        return {
          html: outputHTML,
          // true or false depending on whether the sanitizer stripped anything.
          hasChanged: true,
        }
      },
    },
    codeBlock: {
      languages: [
        { language: 'Plain text', label: 'Plain text' },
        { language: 'Java', label: 'Java' },
        { language: 'CSS', label: 'CSS' },
        { language: 'HTML', label: 'HTML' },
        { language: 'JavaScript', label: 'JavaScript' },
        { language: 'Python', label: 'Python' },
        { language: 'XML', label: 'XML' },
        { language: 'SQL', label: 'SQL' },
        { language: 'Json', label: 'Json' },
        { language: 'Bash', label: 'Bash' },
      ],
    },
    htmlSupport: {
      allow: [
        {
          name: /.*/,
          attributes: true,
          classes: true,
          styles: true,
        },
      ],
    },
    extraPlugins: [CpImageSwiperPlugin],
  }
})

//格式化纯文本
function formatPlainText(data: any) {
  let formattedHtml = ``
  for (const text of data.split(/\n/g)) {
    formattedHtml += `<p>${text.replace(/\s/g, '&nbsp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
  }
  return formattedHtml
}

async function uploadFile(file: any, type?: string) {
  try {
    // const config = await attachmentServiceApi.getMinioConfig();
    // const fileUploader = new FileUploader(config.stsTokenV2);
    // const uploadedFiles = await fileUploader.upload(
    //     [file],
    //     "editorUpload",
    //     "/",
    //     config.bucket,
    // );

    // for (const file in uploadedFiles) {
    //     const objectInfo = uploadedFiles[file];
    //   await addAttachment(objectInfo);
    //   const readyObjectResponse = await getAttachmentByObjectId(
    //     objectInfo.objectId as string,
    //   );

    //   const fileUrl = `${readyObjectResponse.relativeUrl}`;
    const fileUrl = `https://r.bing.com/rp/ln5TQq6AIWfcBlduDk-5bnaJMpY.jpg`
    if (type === 'generatePreView') {
      return {
        url: fileUrl,
        objectId: '114514',
      }
    }
    return fileUrl
    // }
  } catch (e) {
    console.log(e)
  }
}

async function onFileChange(e: any) {
  const pptRegex = /^(.+)\.(ppt|pptx)$/
  const presentationRegex = /^(.+)\.(pps|ppsx|odp|key)$/
  const pdfRegex = /^(.+)\.(pdf|PDF)$/
  const fileName = e.target.files[0].name

  const isPresentation = presentationRegex.test(fileName)
  const isPdf = pdfRegex.test(fileName)
  const isPpt = pptRegex.test(fileName)
  if (isPresentation || isPdf || isPpt) {
    const fileConfig: any = await uploadFile(e.target.files[0], 'generatePreView')
    const identifier = `[-上传中-${new Date().toLocaleDateString()}-${fileName}-${fileConfig.objectId}-]`
    toRaw(ckeditor.value.model).change((writer: any) => {
      const position = toRaw(ckeditor.value.model.document.selection).getFirstPosition()
      const link = writer.createText(identifier)
      toRaw(ckeditor.value.model).insertContent(link, position)
    })
    preViewGenWaitTime.value = 0
    emit('onPending', true)
    //创建定时器
    // previewGenTimer.value = setInterval(() => {
    //     getFileSlide(
    //         previewGenTimer.value,
    //         fileConfig,
    //         identifier,
    //         isPpt ? "swiper" : "img",
    //     );
    // }, 1000);
  } else {
    //创建占位符
    const identifier = `[-附件上传中-${new Date().toLocaleDateString()}-${fileName}-${new Date().getTime()}-]`

    toRaw(ckeditor.value.model).change(async (writer: any) => {
      //获取光标位置
      const position = toRaw(ckeditor.value.model.document.selection).getFirstPosition()
      let link = writer.createText(identifier)
      //插入占位符
      const range = toRaw(ckeditor.value.model).insertContent(link, position)
      // 保存占位符的位置信息
      // const range = writer.createRange(
      //   position,
      //   writer.createPositionAfter(link),
      // );

      //上传文件
      const fileUrl: any = await uploadFile(e.target.files[0], 'uploadfile')

      // 删除占位符
      toRaw(ckeditor.value.model).enqueueChange({ durable: true }, (writer: any) => {
        writer.remove(range)
      })
      //插入链接
      link = writer.createText(fileName, {
        linkHref: fileUrl,
      })
      toRaw(ckeditor.value.model).insertContent(link, position)
    })
  }
  upload.value.value = null
}

async function onVideoUpload(e: any) {
  const editor = toRaw(ckeditor.value)
  const file = e.target.files[0]
  const placeholderUrl = new URL(`../assets/R.gif`, import.meta.url).href
  const imgHtml = `<img src="${placeholderUrl}" alt="">`
  const position = editor.model.document.selection.getFirstPosition()
  // 插入图片占位符

  let viewFragment = editor.data.processor.toView(imgHtml) //将HTML代码字符串转换为View
  let modelFragment = editor.data.toModel(viewFragment) //将View转为Model
  const range = editor.model.insertContent(modelFragment, position)

  try {
    // 上传文件并获取URL
    const fileUrl: any = await uploadFile(file)
    removePlaceholder(editor, range)
    const mineType: any = {
      mp4: 'video/mp4',
      ogg: 'video/ogg',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      wmv: 'video/x-ms-wmv',
      flv: 'video/x-flv',
      mkv: 'video/x-matroska',
      m4v: 'video/x-m4v',
      '3gp': 'video/3gpp',
      '3g2': 'video/3gpp2',
      mpeg: 'video/mpeg',
      mpg: 'video/mpeg',
      mpe: 'video/mpeg',
      m1v: 'video/mpeg',
      m2v: 'video/mpeg',
      ts: 'video/mp2t',
      m3u8: 'application/x-mpegURL',
      f4m: 'application/vnd.adobe.f4m+xml',
      f4f: 'video/mp4',
      f4p: 'video/mp4',
      f4a: 'audio/mp4',
      f4b: 'video/mp4',
      m4a: 'audio/mp4',
      m4b: 'audio/mp4',
      m4p: 'audio/mp4',
      m4r: 'audio/mp4',
    }
    //class="video-js"  style="width:30rem;height:15rem;"
    const html = `
    <div style="text-align:center;" class='editorVideoStyle'>
      <video class="video-js" controls data-setup='{}' class='editorVideoStyle'>
        <source src="${fileUrl.replace(/\.[^/.]+$/, '')}_transcode.mp4" type='video/mp4'></source>
        <source src="${fileUrl}" type='${mineType[fileUrl.split('?')[0].split('.').pop().toLowerCase()]}'></source>
      </video>
    </div>`
    editor.execute('htmlEmbed', html)
  } catch (error) {
    console.error(error)
    removePlaceholder(editor, range)
    console.log(error)
  } finally {
    uploadVideo.value.value = null
  }
}

async function onAudioUpload(e: any) {
  const editor = toRaw(ckeditor.value)
  const file = e.target.files[0]
  const placeholderUrl = new URL(`../assets/R.gif`, import.meta.url).href
  const imgHtml = `<img src="${placeholderUrl}" alt="">`
  const position = editor.model.document.selection.getFirstPosition()
  // 插入图片占位符

  let viewFragment = editor.data.processor.toView(imgHtml) //将HTML代码字符串转换为View
  let modelFragment = editor.data.toModel(viewFragment) //将View转为Model
  const range = editor.model.insertContent(modelFragment, position)

  try {
    // 上传文件并获取URL
    const fileUrl: any = await uploadFile(file)
    removePlaceholder(editor, range)
    const mineType: any = {
      mp3: 'audio/mp3',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      flac: 'audio/flac',
      aac: 'audio/aac',
    }
    //class="video-js"  style="width:30rem;height:15rem;"
    const html = `
    <div style="text-align:center;" class='editorVideoStyle'>
      <audio class="" controls data-setup='{}' class='editorVideoStyle'>
        <source src="${fileUrl}" type='${mineType[fileUrl.split('?')[0].split('.').pop().toLowerCase()]}'></source>
      </audio>
    </div>`
    editor.execute('htmlEmbed', html)
  } catch (error) {
    console.error(error)
    removePlaceholder(editor, range)
    console.error(error)
  } finally {
    uploadAudio.value.value = null
  }
}

function removePlaceholder(editor: any, range: any) {
  // 发生错误时移除图片占位符
  editor.model.enqueueChange({ durable: true }, (writer: any) => {
    writer.remove(range)
  })
}

function isSelectionInCodeBlock(selection: any) {
  const anchor = selection.anchor
  const focus = selection.focus

  return isPositionInCodeBlock(anchor) || isPositionInCodeBlock(focus)
}

function isPositionInCodeBlock(position: any) {
  // 查找位置的祖先元素，检查是否有代码块
  let parent = position.parent
  while (parent) {
    if (parent.is('element', 'codeBlock')) {
      return true
    }
    parent = parent.parent
  }
  return false
}

class ImageUploadAdapter {
  private loader: any
  private editor: any
  private imageElement: any

  constructor(loader: any, editor: any) {
    this.loader = loader
    this.editor = editor
  }

  upload() {
    return this.loader.file.then(
      (file: any) =>
        new Promise(async (resolve, reject) => {
          await this._initPlaceholderImage()
          // this.imageElement = await this._getImageElement();
          uploadFile(file).then((url) => {
            this._replacePlaceholderImage(url)
            resolve({ default: url })
          }, reject)
        }),
    )
  }

  abort() {}

  //插入占位图片
  _initPlaceholderImage() {
    this.editor.model.change((writer: any) => {
      const placeholderImageUrl = new URL(`../assets/R.gif`, import.meta.url).href
      this.imageElement = this._getImageElement()
      writer.setAttribute('src', placeholderImageUrl, this.imageElement)
    })
  }

  //替换图片
  _replacePlaceholderImage(url: any) {
    this.editor.model.change((writer: any) => {
      // this.imageElement = this._getImageElement();
      writer.setAttribute('src', url, this.imageElement)
    })
  }

  //获取图片DOM元素
  _getImageElement() {
    const selection = this.editor.model.document.selection
    const selectedElement = selection.getSelectedElement()
    return selectedElement
  }
}
</script>

<style scoped>
.ck-powered-by {
  display: none;
}
</style>
