export async function uploadFile(file: File) {
  // 这里写上传文件逻辑
  return {
    url: 'https://file-examples.com/wp-content/storage/2017/11/file_example_MP3_1MG.mp3',
    filename: file.name,
  }
}
