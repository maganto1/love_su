//  const { clientWidth, clientHeight } = document.documentElement;
// let canvasEl = document.getElementById("canvas");
var clientWidth = $(window).width();
var clientHeight = $(window).height();
var $window = $(window), gardenCtx, gardenCanvas, $garden, garden;


const HEART_COLOR = "#FF69B4"; // 顏色
const ENLARGE = 11; //放大倍數
const RADIAN_INC = Math.PI / 180; //增量
const DEVIATION_W = clientWidth / 2; //偏移W
const DEVIATION_H = clientHeight / 2; //偏移H

let renderFrame = 0; // render

var ctx;

$(function () {
  canvasEl = $("#canvas");
  gardenCanvas = canvasEl[0];
  gardenCanvas.width = $("#loveHeart").width();
  gardenCanvas.height = $("#loveHeart").height()
  ctx = gardenCanvas.getContext("2d");

  // canvas画布的宽 等于 可视区域的宽
  canvasEl.width = gardenCanvas.width;
  // canvas画布的高 等于 可视区域的高
  canvasEl.height = gardenCanvas.height;


  ctx.strokeStyle = HEART_COLOR; // 设置画笔颜色

  // setup garden
  $loveHeart = $("#loveHeart");
  var offsetX = $loveHeart.width() / 2;
  var offsetY = $loveHeart.height() / 2 - 55;


  $("#content").css("width", $loveHeart.width() + $("#code").width());
  $("#content").css("height", Math.max($loveHeart.height(), $("#code").height()));
  $("#content").css("margin-top", Math.max(($window.height() - $("#content").height()) / 2, 10));
  $("#content").css("margin-left", Math.max(($window.width() - $("#content").width()) / 2, 10));

  function getHeart(t, shrinkRatio = ENLARGE) {
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = -(
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)
    );

    x *= shrinkRatio;
    y *= shrinkRatio;

    x += DEVIATION_W;
    y += DEVIATION_H;
    return [x, y];
  }

  function scatterInside(x, y, beta = 0.15) {
    let ratioX = -beta * Math.log(Math.random());
    let ratioY = -beta * Math.log(Math.random());
    let dx = ratioX * (x - DEVIATION_W);
    let dy = ratioY * (y - DEVIATION_H);

    return [x - dx, y - dy];
  }

  function shrink(x, y, ratio) {
    const force =
      -1 / ((x - DEVIATION_W) ** 2 + (y - DEVIATION_H) ** 2) ** 0.6;
    const dx = ratio * force * (x - DEVIATION_W);
    const dy = ratio * force * (y - DEVIATION_H);
    return [x - dx, y - dy];
  }

  function curve(p) {
    return (2 * (2 * Math.sin(4 * p))) / (2 * Math.PI);
  }

  function getRandom(arr) {
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
  }

  function getRandi(min, max) {
    max++;
    return Math.floor(Math.random() * (+max - +min)) + +min;
  }

  function canvasRect(canvasData) {
    const [x, y, size] = canvasData;
    ctx.fillStyle = HEART_COLOR;
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.stroke();
  }

  const canvasSize = Math.min(clientWidth, clientHeight); // 获取正方形的边长
  const heartSize = 0.8 * canvasSize; // 定义爱心的大小为正方形边长的80%

  class Heart {
    constructor(generateFrame = 24) {
      this.points = [];
      this.edgePoints = [];
      this.centerPoints = [];
      this.allPoints = {};
      this.build(2000);
      this.generateFrame = generateFrame;
      for (let i = 0; i < generateFrame; i++) {
        this.calc(i);
      }
    }

    // 计算爱心位置时调整 x 和 y 坐标，使其在正方形内按比例生成
    /*(calcPosition(x, y, ratio) {
      const force =
        1 / ((x - DEVIATION_W) ** 2 + (y - DEVIATION_H) ** 2) ** 0.52;

      const dx = ratio * force * (x - DEVIATION_W) + getRandi(-1, 1);
      const dy = ratio * force * (y - DEVIATION_H) + getRandi(-1, 1);

      return [x - dx / 2 - heartSize / 2, y - dy + $("#loveHeart").height() / 4 - heartSize / 2];
    }*/
    
    calcPosition(x, y, ratio) {
      const force =
        1 / ((x - DEVIATION_W) ** 2 + (y - DEVIATION_H) ** 2) ** 0.52;
    
      const dx = ratio * force * (x - DEVIATION_W) + getRandi(-1, 1);
      const dy = ratio * force * (y - DEVIATION_H) + getRandi(-1, 1);
    
      // 计算中心点，保证居中
      const centerX = clientWidth / 2;
      const centerY = clientHeight / 2;
    
      // 计算爱心的大小，防止下边界溢出
      const adjustedHeartSize = Math.min(clientWidth, clientHeight) * 0.75; // 75% 画布大小
      const yOffset = adjustedHeartSize / 1.5; // 适当上移，避免下溢出
    
      // 调整 X 和 Y 位置
      const adjustedX = centerX + (x - DEVIATION_W - dx / 2) * 0.8;
      const adjustedY = centerY + (y - DEVIATION_H - dy) * 0.8 - yOffset;
    
      return [adjustedX, adjustedY];
    }
    
    /**calcPosition(x, y, ratio) {
          const force =
            1 / ((x - DEVIATION_W) ** 2 + (y - DEVIATION_H) ** 2) ** 0.52;
    
          const dx = ratio * force * (x - DEVIATION_W) + getRandi(-1, 1);
          const dy = ratio * force * (y - DEVIATION_H) + getRandi(-1, 1);
    
          return [x - dx, y - dy];
        }*/

    calc(generateFrame) {
      const ratio = 10 * curve((generateFrame / 10) * Math.PI);

      const haloRadius = Number(
        4 + 6 * (1 + curve((generateFrame / 10) * Math.PI))
      );
      const haloNumber = Number(
        1000 + 2000 * Math.abs(curve((generateFrame / 10) * Math.PI) ** 2)
      );

      const allPoints = [];

      const heartHaloPoint = new Set();

      for (let i = 0; i < haloNumber; i++) {
        let [_x, _y] = getHeart(Math.random() * 4 * Math.PI, 11.5);
        let [x, y] = this.calcPosition(_x, _y, ratio);
        if (!heartHaloPoint.has([x, y])) {
          heartHaloPoint.add([x, y]);
          x += getRandi(-14, 14);
          y += getRandi(-14, 14);
          const size = getRandom([1, 2, 2]);
          allPoints.push([x, y, size]);
        }
      }
      // 轮廓
      for (let i = 0; i < this.points.length; i++) {
        const [_x, _y] = this.points[i];
        const [x, y] = this.calcPosition(_x, _y, ratio);
        const size = getRandi(1, 3);
        allPoints.push([x, y, size]);
      }
      // 外围
      for (let i = 0; i < this.edgePoints.length; i++) {
        const [_x, _y] = this.edgePoints[i];
        const [x, y] = this.calcPosition(_x, _y, ratio);
        const size = getRandi(1, 2);
        allPoints.push([x, y, size]);
      }
      // 内部
      for (let i = 0; i < this.centerPoints.length; i++) {
        const [_x, _y] = this.centerPoints[i];
        const [x, y] = this.calcPosition(_x, _y, ratio);
        const size = getRandi(1, 2);
        allPoints.push([x, y, size]);
      }

      this.allPoints[generateFrame] = allPoints;
    }

    build(quantity) {
      // 构成爱心实体
      for (let i = 0; i < quantity; i++) {
        const [x, y] = getHeart(Math.random() * 2 * Math.PI);
        this.points.push([x, y]);
      }
      for (let i = 0; i < quantity; i++) {
        const [x, y] = this.points[i];
        for (let j = 0; j < 3; j++) {
          this.edgePoints.push(scatterInside(x, y, 0.05));
        }
      }
      for (let i = 0; i < quantity * 3; i++) {
        const [x, y] = getRandom(this.points);
        this.centerPoints.push(scatterInside(x, y, 0.17));
      }
    }

    render() {
      const frame = renderFrame % this.generateFrame;
      for (let i = 0; i < this.allPoints[frame].length; i++) {
        canvasRect(this.allPoints[frame][i]);
      }
    }
  }

  const heart = new Heart();

  function render() {
    ctx.clearRect(0, 0, gardenCanvas.width, gardenCanvas.height);
    heart.render();
    renderFrame++;
  }
  setInterval(() => {
    render();
  },320);

});


