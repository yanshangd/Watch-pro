<template>
  <div class="watch-body">
    <div class="title">
      <div>WatchPro</div>
      <div>
        <el-button type="primary"
                   class="Btn"
                   @click="Changedialog=true">切换视频</el-button>
      </div>
    </div>
    <artplayer-vue @get-instance="getInstance"
                   :option="option"
                   :style="style"
                   @ready="ready"
                   @play="play"
                   @pause="pause"
                   @seek="seek"
                   @playbackRate="playbackRate"
                   @danmu="danmu" />
    <chat-msg-com class="chatmsg"
                  :chatList="chatList"
                  :userName="from.name" />
    <el-dialog title="切换视频"
               :style="dialogTopL"
               :visible.sync="Changedialog">
      <el-form>
        <el-form-item label="视频地址">
          <el-input v-model="option.url"
                    autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer"
           class="dialog-footer">
        <el-button @click="Changedialog=false">取 消</el-button>
        <el-button type="primary"
                   @click="ChangeVideo()">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import ChatMsgCom from '@/components/ChatMsg.vue'
import ArtplayerVue from '@/components/ArtplayerCom.vue';
export default {
  components: {
    ChatMsgCom,
    ArtplayerVue
  },
  data () {
    return {
      option: {
        url: '',
        type: '',
      },
      style: {
        height: '600px',
      },
      instance: null,
      sendmsg: {
        type: '',
        code: '',
        data: ''
      },
      from: {
        room: '',
        name: ''
      },
      chatList: [],
      chatMsg: '',
      socketMsgStatus: true,
      connectType: '',
      Changedialog: false,
      rules: {
        url: [
          { required: true, message: '请输入播放地址', trigger: 'blur' }
        ]
      },
      isswitchVideo: false,
      dialogTopL: '',
      isMobile: '',
      JoinType: '',
      currentTime: 0,
    }
  },
  created () {
    // 获取参数
    this.from.room = this.$route.query.room;
    this.from.name = this.$route.query.name;
    this.JoinType = this.$route.query.type;

    // 启动链接后端
    this.initWebSocket();
    // 判断是否为手机
    this.isMobile = !!navigator.userAgent.match(/AppleWebKit.*Mobile.*/);
    if (this.isMobile) {
      this.style.height = '240px',
        this.dialogTopL = 'padding-top: 180px'
    }
  },
  beforeDestroy () {
    if (this.instance && this.instance.destroy) {
      this.instance.destroy(false);
    }
  },
  methods: {
    // 统一发送接口
    sendMsgs (type, code, msg, name = this.from.name) {
      this.sendmsg = {
        type: type,
        code: code,
        data: {
          name: name,
          msg: msg
        }
      }
      this.websock.send(JSON.stringify(this.sendmsg));
    },
    //socket连接初始化
    initWebSocket: function () {
      // WebSocket与普通的请求所用协议有所不同，ws等同于http，wss等同于https
      this.websock = new WebSocket("ws://192.168.3.10:8085/online/" + this.from.room + "/" + this.from.name);
      // this.websock = new WebSocket("ws://" + window.location.host + "/online/" + this.from.room + "/" + this.from.name);
      this.websock.onopen = this.websocketonopen;
      this.websock.onclose = this.websocketclose;
      this.websock.onmessage = this.websocketonmessage;
      this.websock.onerror = this.websocketonerror;
    },
    websocketonopen: function () {
      console.log("连接成功");
    },
    websocketclose: function (e) {
      console.log("连接关闭", e);
    },
    websocketonmessage: function (e) {
      let datas = JSON.parse(e.data);
      // console.log("后端消息", datas);
      this.resultMsg(datas);
    },
    // 连接建立失败重连
    websocketOnError () {
      // 如果报错的话，在这里就可以重新初始化websocket，这就是断线重连
      setTimeout(function () {
        this.initWebSocket();
        console.log("重新连接");
      }, 1000);
    },
    // 消息处理
    resultMsg (value) {
      if (value.type == 'msg') {
        this.chatList.unshift(value.data);
        if (value.data.name == null) value.data.name = 'system';
        if (this.from.name != value.data.name) {
          this.instance.plugins.artplayerPluginDanmuku.emit({
            text: value.data.name + ':' + value.data.msg,
            color: '#fff',
            border: false,
          });
        }
        if (value.code == 1002 && this.isswitchVideo == false) {
          this.isswitchVideo = true;
          this.switchVideo(value.data.url);
          // if (this.JoinType != 'join') {
          //   this.sendMsgs('viedo', 2005, value.data.name);
          //   // value.data.name = 'system';
          //   console.log("进度" + this.instance.currentTime);
          // }
        }
        // console.log(value.data);
      } else {
        this.socketMsgStatus = false;
        switch (value.code) {
          case 2001:
            this.instance.play();
            return;
          case 2002:
            this.instance.pause();
            return;
          case 2003:
            this.instance.seek = value.data.msg;
            return;
          case 2004:
            this.switchVideo(value.data.msg);
            return;
          case 2005:
            this.sendMsgs('video', 2006, this.instance.currentTime, value.data);
            return;
          case 2006:
            this.currentTime = value.data.msg;
            return;
          case 2007:
            this.instance.playbackRate = value.data.msg;
            console.log("2");
            return;
        }
      }
    },
    // 更换链接
    ChangeVideo () {
      var isUrl = /^http[s]?:\/\/.*/.test(this.option.url);
      if (isUrl) {
        this.Changedialog = false;
        this.sendMsgs('video', 2004, this.option.url);
        // console.log(this.option.url);
      }
    },
    // 切换视频
    switchVideo (url) {
      // const connectType = url.substring(url.length - 4) === 'm3u8' ? 'customHls' : 'normal';
      this.instance.switchUrl(url, 'new url');
      // if (this.isMobile) {

      // } else {
      //   this.instance.url = url;
      //   this.instance.type = 'm3u8';
      // }

    },
    // 获取播放器参数
    getInstance (art) {
      this.instance = art;
      console.info(art);
    },
    // 准备
    ready () {
      if (this.currentTime != 0) {
        this.instance.seek = this.currentTime;
        this.instance.muted = true;
        var data = {
          msg: '自动静音，请手动调音'
        }
        this.chatList.unshift(data)
      }
      this.instance.play();
    },
    // 播放
    play () {
      if (this.socketMsgStatus) {
        this.sendMsgs('viode', 2001, 'play');
        console.log('播放' + this.instance.currentTime);
      }
      this.socketMsgStatus = true
    },
    // 暂停
    pause () {
      if (this.socketMsgStatus) {
        this.sendMsgs('viode', 2002, 'pause');
      }
      this.socketMsgStatus = true
    },
    // 进度
    seek (e) {
      if (this.socketMsgStatus) {
        this.sendMsgs('viode', 2003, e);
      }
      this.socketMsgStatus = true;
    },
    // 倍速
    playbackRate (e) {
      if (this.socketMsgStatus) {
        this.sendMsgs('viode', 2007, e);
      }
      this.socketMsgStatus = true;
      // console.log(e);
    },
    // 弹幕
    danmu (e) {
      this.sendMsgs('msg', 1001, e.text);
      console.info('新增弹幕', e);
    },
  },
};
</script>
<style lang="less" >
.watch-body {
  height: 100vh;
  overflow: auto;
  background: #b993d6; /* fallback for old browsers */
  background: -webkit-linear-gradient(
    to right,
    #8ca6db,
    #b993d6
  ); /* Chrome 10-25, Safari 5.1-6 */
  background: linear-gradient(
    to right,
    #8ca6db,
    #b993d6
  ); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
  .title {
    height: 50px;
    display: flex;
    margin-top: 30px;
    justify-content: space-around;
    font-size: 20px;
    line-height: 50px;
    font-weight: 500;
    color: #fff;
  }
}
.watch-art {
  padding-top: 50px;
  // width: 100%;
}
.msg-mian {
  width: 80%;
  display: flex;
  margin: 0 auto;
  padding: 20px 20px;
}
.el-dialog {
  width: 80%;
}
.switchVideo {
  margin: 80px 0 30px 0;
  text-align: center;
  .Btn {
    width: 200px;
  }
}
.chatmsg {
  padding-top: 80px;
}
</style>