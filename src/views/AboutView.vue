<template>
  <input v-model="content" placeholder="添加或查询"/>
  <button @click='addListName(0)'>添加</button>
  <button @click='addListName(1)'>查询</button>
  <div v-for="item in list" :key="item">
    <span>{{ item.name }}</span>
    <button @click="removeCurrent(item)">删除</button>
    <button @click="editName(item)">编辑</button>

  </div>
  <div v-if="show">
    编辑框 <input v-model="edit.name"/>
    <button @click="confirmEdit">编辑确定</button>
    <button @click="cancelEdit">取消编辑</button>
  </div>
</template>

<script setup>
import {ref, watch} from "vue";

const content = ref('')
const edit = ref({name: "", id: ''})
const show = ref(false)
const obj = ref({
  name: "json",
  age: 18,
})
const list = ref([
  {
    id: 1,
    name: "测试数据",
  },

])
const searchList = ref([])
searchList.value = list.value
const arr = ref([1, 2, 3, 5, 6])
console.log(obj, 'obj')
const count = ref(1)
console.log(count.value)

function increment() {
  count.value++
}

watch(content, () => {
  if (content) {

  }
})
const addListName = (num) => {
  show.value=false
  if (num == 0) {
    list.value.findIndex(el => el.name == content.value)>-1?alert(`${content.value}"已存在"`): list.value.push({
      id: list.value.length + 1,
      name: content.value
    })
    searchList.value = list.value
    content.value = ''
  } else {
    if (content.value == '') {
      list.value = searchList.value
    } else {
      list.value = list.value.filter(el => el.name == content.value)
    }

  }


}
const removeCurrent = (item) => {
  list.value = list.value.filter(el => el.id !== item.id)
}
const editName = (item) => {
  show.value = true
  edit.value = JSON.parse(JSON.stringify(item))
}
const confirmEdit = () => {
  show.value = false
  list.value.map(el => {
    console.log(el.name)
    console.log(edit.value.name,'edit.value.name')
    console.log(edit.value.name==el.name)
    if(edit.value.name==el.name){
      return alert(`${edit.value.name}"在列表已存在，请勿重复命名"`)
      if(el.id == edit.value.id) {
        return el.name = edit.value.name
      }
    }

  })
}
const cancelEdit=()=>{
  show.value = false
}
</script>


<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
