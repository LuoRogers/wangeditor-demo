<script setup lang="ts">
import WangEditor from '@/components/WangEditor/index.vue'
import CKEditor from '@/components/CKEditor.vue'
import { ref, watch } from 'vue'
import * as XLSX from 'xlsx'
import '@wangeditor/editor/dist/css/style.css' // 引入 css
const teachingModules = ref<any[]>([])
const html1 = ref('')
const html2 = ref('')
const showEditors = ref(true)
const handleFileUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer)
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(firstSheet)

    teachingModules.value = jsonData
  }

  reader.readAsArrayBuffer(file)
}

const handleSelectChange = (e: Event) => {
  showEditors.value = false
  const select = e.target as HTMLSelectElement
  const selectedItem = JSON.parse(select.value)
  console.log(selectedItem)
  html1.value = selectedItem.teachingResource || ''
  html2.value = selectedItem.teachingResource || ''
  showEditors.value = true
}

watch(html1, (newValue) => {
  html2.value = newValue
})
</script>

<template>
  <div>
    <input class="w-30 border" type="file" accept=".xlsx,.xls" @change="handleFileUpload" />
    <select class="w-100 border" @change="handleSelectChange">
      <option v-for="(item, index) in teachingModules" :value="JSON.stringify(item)" :key="index">
        {{ `[${item.id}] ${item.name}` || `项目 ${index + 1}` }}
      </option>
    </select>
    <textarea type="text" v-model="html1" />
  </div>
  <div v-if="showEditors" class="grid grid-cols-2 grid-rows-2 w-full h-[97vh]">
    <WangEditor :model-value="html1" class="border w-full h-full overflow-auto" />
    <div v-html="html1" class="border w-full h-full overflow-auto"></div>
    <CKEditor :value="html2" class="border not-last-of-type:w-full h-full overflow-auto" />
    <div v-html="html2" class="border w-full h-full overflow-auto"></div>
  </div>
</template>

<style lang="scss">
// * {
//   white-space: pre-wrap;
//   word-break: break-all;
//   /* 强制换行 */
//   overflow-wrap: break-word;
//   /* 在单词内部换行 */
// }</style>
