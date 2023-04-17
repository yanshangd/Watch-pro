<template>
  <!-- 原创Watch-pro
By:Yanshang
github:https://github.com/yanshangd -->
  <div>
    <div ref="dplayer"
         class="box"></div>
    <div class="msg-mian">
      <el-input v-model="chatMsg"
                placeholder="请输入内容"></el-input>
      <el-button type="primary"
                 @click="sendMsgs('msg',1001,chatMsg)">发送</el-button>
      <el-button type="primary"
                 @click="Changedialog=true">切换视频</el-button>
    </div>
    <chat-msg-com :chatList="chatList"
                  :userName="from.name" />

    <el-dialog title="切换视频"
               :visible.sync="Changedialog">
      <el-form>
        <el-form-item label="视频地址">
          <el-input v-model="videoUrl"
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
import DPlayer from 'dplayer';
import Hls from 'hls.js';
export default {
  name: 'HelloWorld',
  components: {
    ChatMsgCom
  },
  props: {
  },
  created () {
    this.from.room = this.$route.query.room;
    this.from.name = this.$route.query.name;
    this.initWebSocket()
  },
  data () {
    return {
      dp: {},
      socketStatus: true,
      sendmsg: {
        type: '',
        code: '',
        data: ''
      },
      msg: [],
      from: {
        room: '',
        name: ''
      },
      chatList: [],
      chatMsg: '',
      socketMsgStatus: true,
      videoUrl: '',
      connectType: '',
      Changedialog: false,
      rules: {
        url: [
          { required: true, message: '请输入播放地址', trigger: 'blur' }
        ]
      },
      isswitchVideo: false
    }
  },
  methods: {
    sendMsgs (type, code, msg) {
      this.sendmsg = {
        type: type,
        code: code,
        data: {
          name: this.from.name,
          msg: msg
        }
      }
      this.websock.send(JSON.stringify(this.sendmsg));
    },
    //socket连接初始化
    initWebSocket: function () {
      // WebSocket与普通的请求所用协议有所不同，ws等同于http，wss等同于https
      this.websock = new WebSocket("ws://server.zmox.cn/online/" + this.from.room + "/" + this.from.name);
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
    resultMsg (value) {
      if (value.type == 'msg') {
        this.chatList.unshift(value.data);
        if (value.code == 1002 && this.isswitchVideo == false) {
          this.isswitchVideo = true;
          this.switchVideo(value.data.url);
        }
        // console.log(this.chatList);
      } else {
        switch (value.code) {
          case 2001:
            this.dp.play();
            return;
          case 2002:
            this.dp.pause();
            return;
          case 2003:
            this.dp.seek(value.data.msg);
            this.socketMsgStatus = false;
            return;
          case 2004:
            this.switchVideo(value.data.msg);
            return;
        }
      }
    },
    ChangeVideo () {
      this.Changedialog = false;
      this.sendMsgs('video', 2004, this.videoUrl);
    },
    switchVideo (url) {
      this.videoUrl = url;
      const connectType = url.substring(this.videoUrl.length - 4) === 'm3u8' ? 'customHls' : 'normal';
      this.dp.switchVideo(
        {
          url: this.videoUrl,
          type: connectType
        }
      );
    }
  },
  mounted () {
    this.dp = new DPlayer({
      //播放器的一些参数
      container: this.$refs.dplayer,
      video: {
        url: '', //视频地址
        type: '',
        customType: {
          customHls: function (video) {
            var hls = new Hls({
              debug: false,
              // Other hlsjsConfig options provided by hls.js
            }); //实例化Hls  用于解析m3u8
            hls.loadSource(video.src);
            hls.attachMedia(video);
          }
        }
      },
      autoplay: false, //是否自动播放
      theme: '#FADFA3', //主题色
      loop: false, //视频是否循环播放
      lang: 'zh-cn',
      screenshot: false, //是否开启截图
      hotkey: true, //是否开启热键
      preload: 'auto', //视频是否预加载
      volume: 0.7, //默认音量
      mutex: true, //阻止多个播放器同时播放，当前播放器播放时暂停其他播放器
    });
    document.querySelector(".dplayer-info-panel-item-url").remove();

    // 播放事件
    this.dp.on("play", () => {
      if (this.socketMsgStatus) {
        this.sendMsgs('viode', 2001, 'play');
        console.log('开始播放...');
      }
    });
    // 停止事件
    this.dp.on("pause", () => {
      if (this.socketMsgStatus) {
        this.sendMsgs('viode', 2002, 'pause');
      }
    });
    // 进度事件
    this.dp.on("seeked", () => {
      if (this.socketMsgStatus) {
        setTimeout(() => {
          this.sendMsgs('viode', 2003, this.dp.video.currentTime);
          this.socketMsgStatus = true;
        }, 100);
      } else {
        this.socketMsgStatus = true;
      }
    });
  },
}
</script>

<style>
.msg-mian {
  width: 80%;
  display: flex;
  margin: 0 auto;
  padding: 20px 20px;
}
.el-dialog {
  width: 80%;
}
</style>
