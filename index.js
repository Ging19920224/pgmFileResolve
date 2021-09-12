getPgmFile();

function getPgmFile() {
  const url = './image/map_ori.pgm';
  const requestUserOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  };
  fetch(url, requestUserOptions)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(response.status);
      }
      return response.blob(); // 回傳為 blob 格式
    })
    .then((resData) => {
      // 先透過 FileReade 解析 blob
      const fileReader = new FileReader();
      fileReader.readAsBinaryString(resData);

      // 將解析完的 text 轉檔
      fileReader.addEventListener('load', () => {
        // console.log(fileReader.result);
        const mapData = pgmResolve(fileReader);
        // console.log(mapData);
        const canvas = document.querySelector('#canvas');
        drewPgmMap(mapData, canvas);
      }, false);
    })
    .catch((err) => console.log(err));
};

function pgmResolve(fileReader) {
  const data = fileReader.result;
  const splitData = data.split('\n');

  // 判斷 pgm 是否有註解
  if (splitData[1].indexOf('#') !== -1) splitData.splice(1, 1);
  const encode = splitData[3].split(''); // 抓取 pgm 編碼
  const encode10 = [];

  encode.forEach((item) => {
    const spiltNum = encodeURI(item).split('%'); // 編碼轉換後依據 % 切割

    if (spiltNum.length <= 2) { // 陣列長度小於或等於 2 為 rgba(0, 0, 0, 255) (黑色)
      encode10.push(0);
      encode10.push(0);
      encode10.push(0);
      encode10.push(255);
    } else { // 陣列長度大於2則將 rgb 轉為灰階
      spiltNum.forEach((color, index) => { // 將空字串的色碼設為 0
        if (!color) spiltNum[index] = 0;
      });

      // 將 rgb 色碼由16進制轉為10進制
      const color1 = parseInt(spiltNum[0], 16) * 0.299;
      const color2 = parseInt(spiltNum[1], 16) * 0.587;
      const color3 = parseInt(spiltNum[2], 16) * 0.114;

      // 將 rgb 色碼轉為灰階
      let avg = Math.floor(color1 + color2 + color3);
      let color = 217;

      if (avg > 130) {
        avg = 255; // 若灰階色大於 128 則為 白色
        color = 255;
      }

      encode10.push(color);
      encode10.push(color);
      encode10.push(color);
      encode10.push(255);
    }
  });

  const mapData = [
    splitData[0],
    splitData[1],
    encode10,
  ];

  return mapData;
};

function drewPgmMap(mapData, canvas) {
  const width = mapData[1].split(' ')[0];
  const height = mapData[1].split(' ')[1];
  const ctx = canvas.getContext('2d');
  canvas.width = Number(width);
  canvas.height = Number(height);

  const imageData = ctx.createImageData(width, height);

  // 編寫每個 pixel 的色碼
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i + 0] = mapData[2][i + 0]; // R value
    imageData.data[i + 1] = mapData[2][i + 1]; // G value
    imageData.data[i + 2] = mapData[2][i + 2]; // B value
    imageData.data[i + 3] = mapData[2][i + 3]; // A value
  }
  // 將 imageData 用 canvas 畫出來
  ctx.putImageData(imageData, 0, 0);

  return imageData;
};