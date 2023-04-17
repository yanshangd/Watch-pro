<template>
  <!-- 原创Watch-pro
By:Yanshang
github:https://github.com/yanshangd -->
  <div>
    <div class="create-main">
      <div class="room"
           @click="roomDialog('create')">
        <div>创建房间<i class="el-icon-plus"></i></div>
      </div>
      <div class="room"
           @click="roomDialog('join')">
        <div>加入房间<i class="el-icon-plus"></i></div>
      </div>
    </div>
    <!-- 创建or加入房间 -->
    <el-dialog :title="type=='create'?'创建房间':'加入房间'"
               :visible.sync="Createdialog">
      <el-form :model="form"
               :rules="rules">
        <el-form-item label="房间号"
                      prop="room"
                      :label-width="formLabelWidth">
          <el-input v-model.number="form.room"
                    autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="密码"
                      prop="password"
                      :label-width="formLabelWidth">
          <el-input v-model="form.password"
                    autocomplete="off"
                    show-password></el-input>
        </el-form-item>
        <el-form-item label="昵称"
                      prop="name"
                      :label-width="formLabelWidth">
          <el-input v-model="form.name"
                    autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item v-if="type==='create'"
                      label="播放地址"
                      prop="url"
                      :label-width="formLabelWidth">
          <el-input v-model="form.url"
                    autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item v-if="type==='create'"
                      label="注意"
                      :label-width="formLabelWidth">
          <div>仅支持mp4和m3u8的播放链接</div>
        </el-form-item>
      </el-form>
      <div slot="footer"
           class="dialog-footer">
        <el-button @click="Createdialog=false">取 消</el-button>
        <el-button type="primary"
                   @click="Fromdialog()">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data () {
    return {
      Createdialog: false,
      form: {
        room: '',
        password: '',
        name: '',
        url: ''
      },
      formLabelWidth: '85px',
      type: '', //create or join
      rules: {
        room: [
          { required: true, message: '请输入房间号' },
          { type: 'number', message: '房间号必须为数字值' }
        ],
        password: [
          { required: true, message: '请输入密码' }
        ],
        name: [
          { required: true, message: '请输入昵称', trigger: 'blur' }
        ],
        url: [
          { required: true, message: '请输入播放地址', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    roomDialog (type) {
      this.type = type;
      this.Createdialog = true;
    },
    async Fromdialog () {
      var data;
      var value = '添加';
      if (this.type === 'create') {
        data = await this.$http.post('/room/add', this.form);

      } else {
        value = '加入';
        data = await this.$http.post('/room/join', this.form);
      }
      if (data.data.data === true) {
        this.$message.success(value + '成功');
        this.$router.push({ path: '/watch', query: { room: this.form.room, name: this.form.name } })
      } else {
        this.$message.error(value + '失败');
      }
      this.Createdialog = false;
    }
  }
}
</script>

<style lang="less">
.create-main {
  display: flex;
  justify-content: center;
  margin-top: 10%;
  .room {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 50px;
    margin: 10px;
    background-color: #e2e2e2;
    color: #33a5fd;
    text-align: center;
  }
}
.el-dialog {
  width: 80%;
}
</style>
