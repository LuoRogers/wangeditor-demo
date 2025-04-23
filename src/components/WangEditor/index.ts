
import AudioMenu from "./plugin/AudioUpload/audioMenu";
import type {IDomEditor, IToolbarConfig} from "@wangeditor/editor";
import {Boot} from "@wangeditor/editor";
 
const MenusList = [
    {
        key: 'AudioMenu',
        class: AudioMenu,
        index: 23
    }
]
const registerMenu = function (editor: IDomEditor, toolbarConfig: Partial<IToolbarConfig>){
    const allRegisterMenu = editor.getAllMenuKeys(); // 获取所有已注册的菜单
    let keys = [];
    for(let item of MenusList){
        if(allRegisterMenu.indexOf(item.key) < 0){ // 如果未注册，则注册
            const menuObj = {
                key: item.key,
                factory() {
                    return new item.class()
                }
            }
            Boot.registerMenu(menuObj);
        }
        keys.push(item.key)
    }
    toolbarConfig.insertKeys = {
        index: MenusList[0].index,
        keys: keys
    }
}
 
export default registerMenu