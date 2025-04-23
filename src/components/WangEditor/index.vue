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
import { Boot } from '@wangeditor/editor'
import { renderAudioConf } from './plugin/AudioUpload/renderElem'
import { audioToHtmlConf } from './plugin/AudioUpload/elemHtml'
import withAudio from './plugin/AudioUpload/plugin'
import registerMenu from '.'

const parser = new DOMParser()
const editorRef = shallowRef()
const valueHtml = ref('')
const props = defineProps<{
    modelValue: string
}>()

const toolbarConfig = {

}
const editorConfig = {
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
    }
}

Boot.registerRenderElem(renderAudioConf)
Boot.registerElemToHtml(audioToHtmlConf)
Boot.registerPlugin(withAudio);

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
    registerMenu(editorRef.value, toolbarConfig)
    console.log('editor created', editor)
}




</script>
