<template>
  <!-- 原创Watch-pro
By:Yanshang
github:https://github.com/yanshangd -->
  <div class="create-body">
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
    <div class="text-main">
      <p>WatchPro</p>
      <p>问题反馈:zmoz@qq.com</p>
      <p>Copyright ©2023 Yanshang 1.1.8 </p>
    </div>
    <!-- 弹窗创建or加入房间 -->
    <el-dialog :title="type=='create'?'创建房间':'加入房间'"
               :visible.sync="Createdialog">
      <el-form :model="form"
               :rules="rules"
               ref="ruleForm">
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
                    placeholder="密码可为空"></el-input>
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
        name: [
          { required: true, message: '请输入昵称', trigger: 'blur' }
        ],
        url: [
          { required: true, message: '请输入播放地址', trigger: 'blur' }
        ]
      },
    }
  },
  methods: {
    roomDialog (type) {
      this.type = type;
      this.Createdialog = true;
    },
    Fromdialog () {
      this.$refs.ruleForm.validate((valid) => {
        if (valid) {
          this.Result();
        } else {
          console.log('error submit!!');
          return;
        }
      });
    },
    async Result () {
      var data;
      if (this.type === 'create') {
        data = await this.$http.post('/room/add', this.form);
      } else {
        data = await this.$http.post('/room/join', this.form);
      }
      if (data.data.data) {
        this.$message.success(data.data.type);
        this.$router.push({ path: '/watch', query: { room: this.form.room, name: this.form.name, type: this.type } })
      } else {
        this.$message.error(data.data.type);
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
  padding-top: 10%;
  .room {
    border-radius: 4px;
    padding: 50px;
    margin: 10px;
    // background-color: #e2e2e2;
    color: #33a5fd;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
  }
}
.text-main {
  padding-top: 50px;
  text-align: center;
}
.el-dialog {
  width: 80%;
}
</style>
