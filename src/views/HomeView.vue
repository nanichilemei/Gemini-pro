<template>
  <div class="container">
    <div class="chatbot">

      <div class="chatbot-header">
        <h3>Gemini-pro</h3>
        <!--        <button @click="closeChat">X</button>-->
      </div>
      <div class="chatbot-body" ref="chatbotBody">
        <div v-for="(message, index) in messages" :key="index" :class="messageClass(message.role)">
          <div :class="'chatbot' + message.role">
            <span v-if="message.role=='user'">{{message.parts}}
            </span>
            <div :class="'chatbot' + message.role" v-if="message.role=='user'" style="background-color: white;margin-top: 20px">
              <img v-if="message.img" :src="message.img" style="width: 100px;height: 100px;" />
            </div>
            <div class="copy" style="width: 100%;background-color: #282c34;color: #abb2bf;display: flex;justify-content: flex-end;padding-right: 10px;" v-if="message.role!=='user'" :data-clipboard-text="message.parts"  @click="copyText(message.parts)">
              复制
            </div>

            <highlightjs  style="width: 100%;"  v-if="message.role!=='user'" autodetect :code="message.parts"  />


          </div>

        </div>

      </div>

      <div class="chatbot-footer">
        <button class="custom-upload-btn" @click="triggerFileInput">上传图片</button>
        <input class="input_file" ref="fileInput" type="file" @input="onFileChange" />
        <div contentEditable="true"  @keyup.enter="sendMessage" ref="content"   style="width: 300px;height: 100%;;border: 1px solid red;overflow-y: auto">
        </div>
<!--        <textarea contenteditable="true" @keyup.enter="sendMessage" v-model="inputMessage" placeholder="有什么想问的呢"></textarea>-->

        <button @click="sendMessage">发送</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted,computed} from 'vue';
import Clipboard from 'clipboard'
import {nextTick} from "vue";
import {showLoadingToast, showDialog,showNotify,showToast  } from "vant";
import {GoogleGenerativeAI} from "@google/generative-ai";
import Prism from 'prismjs';
const messages = ref([]);
const file=ref(null)
const img =ref(null)
const inputMessage = ref("");
let genAI, model, chat;
const fileInput= ref();
const textBoole = ref(false)
const content=ref()
onMounted(async () => {
  Prism.hooks.add('after-highlight', (env) => {
    const element = env.element;
    if (element.style.display === 'block') {
      element.style.height = 'auto';
    }
  });
})
const isCodeBlock = computed(() => {
  return messages.value.some((message) => message.role === 'chatbot');
});
 function onFileChange (e)  {
   file.value = e.target.files[0];
   console.log(file.value)
   readerFile(file.value).then((res) => {
     content.value.innerHTML=`<img src="${res}" style="width: 100px;height: 100px;" />`;
     img.value = res;
   });

}
function  triggerFileInput() {
  // 触发隐藏的文件上传输入框
  fileInput.value.click();
}
function readerFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = (error) => reject(error);
  });
}
async function sendMessage() {
  if (content.value.firstElementChild){
    img.value = content.value.firstElementChild.currentSrc;
    getImageFile(content.value.firstElementChild.currentSrc).then((res) => {
      file.value= res;
    });
  }
  if (/^\s*$/.test(content.value.innerText)) {
    showNotify({ message: '请输入内容' });
  } else {
    showLoadingToast({
      message: '努力加载中...',
      forbidClick: true,
      duration:0,
    });
    const msg = content.value.innerText;

    try {
      if (img.value) {
        created();
        addMessage("user", msg,img.value);
        const imageParts = await Promise.all([file.value].map(fileToGenerativePart));
        const result = await model.generateContent([msg, ...imageParts]);
        // 处理函数响应

        const response = await result.response;
        if (response.functionResponse) {
          // 处理函数响应的逻辑
        } else {
          const text = response.text();
          await typeMessage("chatbot", text);
          content.value.innerText = "";
          img.value=null
          // 处理文本响应的逻辑
        }
      } else {
        addMessage("user", msg,'');
        const result =  await chat.sendMessage(msg);
        console.log(result)
        const response = await result.response;
        const text = response.text();
        await typeMessage("chatbot", text);
          // 处理文本响应的逻辑
          content.value.innerText = "";
      }

      // img.value=''
      // file.value=''
      showLoadingToast({
        message: '加载完成',
        forbidClick: true,
        duration:0.1,
      });
    } catch (error) {
      showLoadingToast({
        message: '加载完成',
        forbidClick: true,
        duration:0.1,
      });
          showDialog({
            title: '提示',
            message: `出错了我也不知道什么错,重新输入或刷新吧报错日志:${error}`,
          })
      throw error; // Rethrow the error to stop the execution of the function.

    }
  }
  // let chatbotBody=ref()
  //   chatbotBody.value.scrollTop = chatbotBody.value.scrollHeight;

}
async function getImageFile(imageUrl) {
  try {
    // 使用fetch获取图像数据
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // 创建File对象
    const fileName = 'filename.jpg';
    const imageFile = new File([blob], fileName, { type: response.headers.get('content-type') });
    // 返回File对象
    return imageFile;
  } catch (error) {
    console.error('获取图像文件时发生错误:', error);
    return null;
  }
}

  function addMessage(role, parts,img) {

  messages.value.push({role, parts,img});
}
function copyText(text) {
 let clipboard= new Clipboard('.copy')
  clipboard.on('success', function(e) {
   showNotify({
     type: 'success',
      message: '复制成功',
   })
    clipboard.destroy()
  });
 clipboard.on('error', function(e) {
      showNotify({
        type: 'danger',
        message: '复制失败',
      })
      clipboard.destroy()
    });
}
async function typeMessage(role, text) {
  const delay = 10; // 调整延迟时间，控制打字速度
  let currentIndex = 0;
  addMessage(role, '',''); // 添加一个空消息，用于逐字符显示

  const intervalId = setInterval(() => {
    if (currentIndex < text.length) {
      const currentText = text.slice(0, currentIndex + 1);
      messages.value[messages.value.length - 1].parts = currentText; // 更新最后一条消息的内容
      currentIndex++;
    } else {
      clearInterval(intervalId); // 清除定时器
      textBoole.value = false; // 设置加载状态为false
    }
  }, delay);
}


function messageClass(role) {
  return `message ${role}`;
}

function closeChat() {
  // Add logic to close the chat if needed
}
async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}
async function run() {
  // Fetch your API_KEY
  const API_KEY = "AIzaSyClPBQMToIBxQ7-GLPA-7fhH7J6r9ojq6Q";

  // Access your API key (see "Set up your API key" above)
  genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash"});
  chat = model.startChat({
    history: messages.value,
    generationConfig: {
      maxOutputTokens: 50000,
    },
  });
}
run();
async function created() {
  // Fetch your API_KEY
  const API_KEY = "AIzaSyClPBQMToIBxQ7-GLPA-7fhH7J6r9ojq6Q";
  const genAI = new GoogleGenerativeAI(API_KEY);
   model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });
}

</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container {

  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #efefef;
}

.chatbot {
  /*margin: 10px;*/
  background-color: #fff;

}

.chatbot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  border-bottom: 1px solid #ccc;
}

pre {
  white-space: pre-wrap; /*css-3*/
  white-space: -moz-pre-wrap; /*Mozilla,since1999*/
  white-space: -pre-wrap; /*Opera4-6*/
  white-space: -o-pre-wrap; /*Opera7*/
  word-wrap: break-word; /*InternetExplorer5.5+*/
  /*padding: 10px;*/
}

.chatbot-header h3 {
  margin: 0;
}
.input_file{
  width: 100px;
  height: 100px;

}
.chatbot-body {
  height: calc(100vh * (700 / 1080));
  width: calc(100vh * (570 / 1080));
  overflow-y: auto;
  padding: 0.1px;
  word-wrap: break-word;

}

.chatbot-body .message {
  margin-bottom: 10px;
  padding: 10px;
  margin-right: 10px;
  border-radius: 5px;
  word-wrap: break-word;
}

.chatbot-body .message.user {
  background-color: #eee;
  width: auto;
  word-wrap: break-word;
  float: right;
  clear: both;
}
.custom-upload-btn {
  display: inline-block;
  padding: 8px 16px;
  background-color: #007bff;
  color: #fff;
  cursor: pointer;
  border: none;
  border-radius: 4px;
}

/* 隐藏默认的文件上传输入框 */
.input_file {
  display: none;
}
.language-javascript {
  width: 100%;
  word-wrap: break-word;
}

.chatbot-body .message.chatbot {

  /*background-color: #0084ff;*/
  color: #fff;
  float: left;
  clear: both;

}
div img{
  width: 100px;
  height: 100px;
  border-radius: 5px;
}
.chatbot-footer {
  display: flex;
  padding: 5px 10px;
  height: calc(300vh * (70 / 1080));
  border-top: 1px solid #ccc;
}

.chatbot-footer textarea {
  width: 83%;
  height: 100%;
  padding: 5px;
  border-radius: 5px;
}

.chatbot-footer button {
  float: right;
  margin-left: 10px;
  padding: 5px 20px;
  border: none;
  border-radius: 5px;
  background-color: #0084ff;
  color: #fff;
}
</style>
