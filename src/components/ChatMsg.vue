<template>
  <!-- 原创Watch-pro
By:Yanshang
github:https://github.com/yanshangd -->
  <div>
    <el-row class="row-bg"
            type="flex"
            v-for="item in chatList"
            :key="item.id"
            :justify="item.name==userName?'end':''">
      <el-card class="box-card"
               body-style="padding:0px 10px;height: 60px; margin:0px;">
        <div>
          <p style="font-size: 10px;">{{ item.name!=null?item.name:'system' }}</p>
          <el-divider style="margin:0px" />
          <p style="font-size: 15px;line-height: 10px;">{{ item.msg }}</p>
        </div>
      </el-card>
    </el-row>
  </div>
</template>

<script>
export default {
  name: "ChatMsg",
  components: {

  },
  props: {
    chatList: {
      type: Array
    },
    userName: {
      type: String
    }
  },
  data () {
    return {
      chatType: null
    }
  },
  created () {
  },
  methods: {
  }
}
</script>

<style lang="less" scoped>
.el-divider--horizontal {
  margin: 2px;
}
.row-bg {
  width: 70%;
  margin: 0 auto;
  margin-bottom: 10px;
  padding: 2rpx;
}
</style>