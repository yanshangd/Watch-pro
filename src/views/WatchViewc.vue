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
    <div class="watch-art"
         ref="artRef"
         :style="style"></div>
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
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import artplayerPluginDanmuku from 'artplayer-plugin-danmuku'
export default {
  components: {
    ChatMsgCom
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
    this.from.room = this.$route.query.room;
    this.from.name = this.$route.query.name;
    this.JoinType = this.$route.query.type;

    this.initWebSocket();
    this.isMobile = !!navigator.userAgent.match(/AppleWebKit.*Mobile.*/);
    if (this.isMobile) {
      this.style.height = '250px',
        this.dialogTopL = 'padding-top: 180px'
    }
  },
  mounted () {
    this.instance = new Artplayer({
      container: this.$refs.artRef,
      playbackRate: true,
      pip: true,
      fullscreen: true,
      fullscreenWeb: true,
      miniProgressBar: true,
      lock: true,
      setting: true,
      playsInline: true,
      autoHeight: true,
      autoSize: true,
      mini: true,
      theme: '#409EFF',
      customType: {
        m3u8: playM3u8,
      },
      plugins: [
        artplayerPluginDanmuku({
          // 弹幕数组
          danmuku: [],
          speed: 5, // 弹幕持续时间，单位秒，范围在[1 ~ 10]
          opacity: 1, // 弹幕透明度，范围在[0 ~ 1]
          fontSize: 25, // 字体大小，支持数字和百分比
          color: '#FFFFFF', // 默认字体颜色
          mode: 0, // 默认模式，0-滚动，1-静止
          margin: [10, '25%'], // 弹幕上下边距，支持数字和百分比
          antiOverlap: true, // 是否防重叠
          useWorker: true, // 是否使用 web worker
          synchronousPlayback: false, // 是否同步到播放速度
          filter: (danmu) => danmu.text.length < 50, // 弹幕过滤函数，返回 true 则可以发送
          lockTime: 5, // 输入框锁定时间，单位秒，范围在[1 ~ 60]
          maxLength: 100, // 输入框最大可输入的字数，范围在[0 ~ 500]
          minWidth: 200, // 输入框最小宽度，范围在[0 ~ 500]，填 0 则为无限制
          maxWidth: 400, // 输入框最大宽度，范围在[0 ~ Infinity]，填 0 则为 100% 宽度
          theme: 'dark', // 输入框自定义挂载时的主题色，默认为 dark，可以选填亮色 light
          beforeEmit: (danmu) => !!danmu.text.trim(), // 发送弹幕前的自定义校验，返回 true 则可以发送
        }),
      ],
    });
    function playM3u8 (video, url, art) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);

        // optional
        art.hls = hls;
        art.once('url', () => hls.destroy());
        art.once('destroy', () => hls.destroy());
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else {
        art.notice.show = 'Unsupported playback format: m3u8';
      }
    }
    this.instance.on('artplayerPluginDanmuku:emit', (danmu) => {
      this.sendMsgs('msg', 1001, danmu.text);
      // console.info('新增弹幕', danmu);
    });
    // 准备事件
    this.instance.on('ready', () => {
      if (this.currentTime != 0) {
        this.instance.seek = this.currentTime;
        this.instance.muted = true;
        this.instance.play();
        var data = {
          msg: '自动静音，请手动调音'
        }
        this.chatList.unshift(data)
      }
    });
    // 播放事件
    this.instance.on('play', () => {
      if (this.socketMsgStatus) {
        this.sendMsgs('viode', 2001, 'play');
        console.log('播放' + this.instance.currentTime);
      } this.socketMsgStatus = true
    });
    // 停止事件
    this.instance.on('pause', () => {
      if (this.socketMsgStatus) {
        this.sendMsgs('viode', 2002, 'pause');
        console.log('暂停');
      }
      this.socketMsgStatus = true
    });
    // 进度事件
    this.instance.on('seek', (currentTime) => {
      if (this.socketMsgStatus) {
        this.sendMsgs('viode', 2003, currentTime);
      }
      this.socketMsgStatus = true;
    });

  },
  beforeDestroy () {
    if (this.instance && this.instance.destroy) {
      this.instance.destroy(false);
    }
  },
  methods: {
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
      this.websock = new WebSocket("ws://192.168.124.6:8085/online/" + this.from.room + "/" + this.from.name);
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
        }
      }
    },
    ChangeVideo () {
      this.Changedialog = false;
      this.sendMsgs('video', 2004, this.option.url);
      // console.log(this.option.url);
    },
    switchVideo (url) {
      // const connectType = url.substring(url.length - 4) === 'm3u8' ? 'customHls' : 'normal';
      if (this.isMobile) {
        this.instance.switchUrl(url, 'new url');
      } else {
        this.instance.url = url;
        this.instance.type = 'm3u8';
      }
    },
    getInstance (art) {
      this.instance = art;
      console.info(art);
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
  margin-top: 10px;
}
</style>