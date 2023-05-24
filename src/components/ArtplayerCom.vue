<template>
  <div>
    <div class="artplayer"
         ref="artRef"></div>
    <div class="artplayer-danmuku"></div>
  </div>
</template>

<script>
import Artplayer from "artplayer";
import artplayerPluginDanmuku from 'artplayer-plugin-danmuku'
import Hls from 'hls.js';
export default {
  data () {
    return {
      instance: null,
      isMobile: false,
    };
  },
  props: {
    option: {
      type: Object,
      required: true,
    },
  },
  created () {
    // 判断是否为手机
    this.isMobile = !!navigator.userAgent.match(/AppleWebKit.*Mobile.*/);
    if (this.isMobile) {
      this.isMobile = true;
    }
  },
  mounted () {
    var that = this;
    var art = new Artplayer({
      ...this.option,
      container: this.$refs.artRef,
      playbackRate: false,
      pip: true,
      fullscreen: true,
      fullscreenWeb: true,
      miniProgressBar: true,
      lock: true,
      setting: true,
      playsInline: true,
      autoHeight: false,
      autoSize: false,
      mini: true,
      theme: '#409EFF',
      customType: {
        m3u8: playM3u8,
      },
      settings: [
        {
          html: '播放速度',
          width: 250,
          tooltip: '1',
          selector: [
            {
              html: '<span style="color:while">0.5</span>',
              value: '0.5',
            },
            {
              default: true,
              html: '<span style="color:while">1</span>',
              value: '1',
            },
            {
              html: '<span style="color:while">2</span>',
              value: '2',
            },
            {
              html: '<span style="color:while">3</span>',
              value: '3',
            },
          ],
          onSelect: function (item) {
            that.$emit("playbackRate", item.value);
            // art.playbackRate = item.value;
            return item.html;
          },
        },
      ],
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
          theme: 'light', // 输入框自定义挂载时的主题色，默认为 dark，可以选填亮色 light
          beforeEmit: (danmu) => !!danmu.text.trim(), // 发送弹幕前的自定义校验，返回 true 则可以发送
          // 通过 mount 选项可以自定义输入框挂载的位置，默认挂载于播放器底部，仅在当宽度小于最小值时生效
          // mount: document.querySelector('.artplayer-danmuku'),
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
    this.instance = art;
    // 准备事件
    art.on('ready', () => {
      this.$emit("ready", "ready");
    });
    // 播放事件
    art.on('play', () => {
      this.$emit("play", "play");
    });
    // 停止事件
    art.on('pause', () => {
      this.$emit("pause", "pause");
    });
    // 进度事件
    art.on('seek', (currentTime) => {
      this.$emit("seek", currentTime);
    });
    // 弹幕事件
    art.on('artplayerPluginDanmuku:emit', (danmu) => {
      this.$emit("danmu", danmu);
    });
    this.$nextTick(() => {
      this.$emit("get-instance", this.instance);
    });
  },
  beforeDestroy () {
    if (this.instance && this.instance.destroy) {
      this.instance.destroy(false);
    }
  },
};
</script>
<style lang="less">
.artplayer {
  height: 100%;
  padding: 5px;
}
.artplayer-danmuku {
  padding: 10px;
}
</style>
