import './assets/main.css'
import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/lib/common'
import hljsVuePlugin from '@highlightjs/vue-plugin'
import 'vant/es/toast/style';
import 'vant/lib/index.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
const app = createApp(App)
// 引入代码高亮，并进行全局注册
app.use(hljsVuePlugin)
app.use(createPinia())
app.use(router)

app.mount('#app')
