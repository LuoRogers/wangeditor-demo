<template>
    <div class="b-1 b-elGray b-solid">
        <Toolbar :editor="editorRef" :defaultConfig="toolbarConfig" mode="default" />
        <Editor class="overflow-auto" v-model="valueHtml" :defaultConfig="editorConfig" mode="default"
            @onCreated="handleCreated" @audioUpload="console.log(111)" />
    </div>
</template>
<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
// @ts-ignore
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { Boot, type IEditorConfig, type IToolbarConfig } from '@wangeditor/editor'
import attachmentModule from '@wangeditor/plugin-upload-attachment'
import audioModule from './plugin/AudioUpload'

const parser = new DOMParser()
const editorRef = shallowRef()
const valueHtml = ref('')
const props = defineProps<{
    modelValue: string
}>()

const toolbarConfig: Partial<IToolbarConfig> = {
    insertKeys: {
        index: 23,
        keys: ['uploadAttachment', 'uploadAudio']
    }
}
const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...',
    MENU_CONF: {
        //   uploadImage: {
        //     async customUpload(file: File, insertFn: any) {
        //       const formData = new FormData()
        //       formData.append('file', file)
        //       const url = await uploadApi.upload(formData)
        //       insertFn(url, '', '')
        //     }
        //   }
        uploadAttachment: {
            async customUpload(file: File, insertFn: any) {
                return new Promise(resolve => {
                    // 需要改成自己的上传逻辑
                    setTimeout(() => {
                        const src = `https://www.w3school.com.cn/i/movie.ogg`
                        insertFn(`customUpload-${file.name}`, src)
                        resolve('ok')
                    }, 500)
                })
            }
        }
    },
    hoverbarKeys: {
        attachment: {
            menuKeys: ['downloadAttachment']
        }
    }

}


Boot.registerModule(attachmentModule)
Boot.registerModule(audioModule)


const emits = defineEmits<{
    (e: 'update:modelValue', v: string): void
}>()

onMounted(() => {

})

watch(
    () => props.modelValue,
    (v: string) => {
        const doc = parser.parseFromString(v, 'text/html')

        try {
            // 这里写一些用于兼容CKEditor生成的HTML的代码
            const handlers = [
                { selector: '.table', processor: (table: Element) => table.replaceWith(...table.children) },
                {
                    selector: '.image', processor: (image: Element) => {
                        const p = doc.createElement('p')
                        p.append(...image.cloneNode(true).childNodes)
                        image.replaceWith(p)
                    }
                },
                {
                    selector: '.raw-html-embed', processor: (el: Element) => {
                        const children = el.querySelectorAll('audio,video')
                        el.replaceWith(...children)
                    }
                }
            ]

            handlers.forEach(({ selector, processor }) => {
                doc.querySelectorAll(selector).forEach((el) => {
                    processor(el)
                })
            })

            const html = doc.body.innerHTML
            valueHtml.value = html

        } catch (e) {
            console.error(e)
        }

        const html = doc.body.innerHTML
        valueHtml.value = html
    },
    { immediate: true }
)

watch(valueHtml, (v: string) => {
    let res = ''
    if (!editorRef.value.isEmpty()) {
        res = v
    }
    console.log('valueHtml', v)
    emits('update:modelValue', res)
})


// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})

const handleCreated = (editor: any) => {
    editorRef.value = editor // 记录 editor 实例，重要！
    // registerMenu(editorRef.value, toolbarConfig)
    console.log('editor created', editor)
}




</script>
