$(function(){
  var connectionOptions = new Object(), connectionInfo, devList = [];

  $("#button_connect").click(connections);  // ボタンのトリガ設定(Connetボタン)
  $('#button_send').click(sendData);  // ボタンのトリガ設定(Sendボタン)
  $('#baudrate').val('9600'); // デフォルトのBaudRateはよく使う9600bpsにしておく
  $('#breaktype').val('crlf'); // デフォルトの改行コードはCR+LFにしておく
  $("#button_send, #sendline").prop("disabled", true);  // 送信関連の機能を無効にしておく

  // エンター押したときに送信する
  $('#sendline').keydown(function(e){
      if(e.which == 13){
        sendData();
      }
    });

  deviceSearch(); // 起動時に自動実行

  // 接続されているデバイスを検索し、リストアップする
  function deviceSearch(){
    chrome.serial.getDevices(function(ports){
      devList = ports;
      if(devList.length != 0){
        // デバイスが見つかった場合
        // デバイスをリストに追加していく
        for(i in devList){
          $('#ports').append($('<option>').val(devList[i].path).text(devList[i].path));
        }
        $("#button_connect").prop("disabled", false);  // Connectボタンを有効にする
        console.log(devList.length + ' devices find.');
      }else{
        // 追加できるデバイスが無い場合
        $("#button_connect").prop("disabled", true);  // Connectボタンを無効にする
        $('#ports').append($('<option>').val('nodevice').text('nodevice')); // 代わりにnodeviceを入れておく
        console.log('No devices find.');
      }
    });
  };

  // Connect/Disconnectボタンが押された時の動作
  function connections(){
    if($('#button_connect').val() == 'Connect'){
      $('#button_connect').val('Disconnect');
      startConnection();
    }else{
      $('#button_connect').val('Connect');
      endConnection();
    }
  };

  // 接続開始時の動作
  function startConnection(){
    var path = $('#ports').val(); // ユーザーが選択したデバイス
    var baudrate = $('#baudrate').val(); // ユーザーが選択したBaudRate
    $('#ports, #baudrate').prop("disabled", true); // 接続先設定を無効にする
    connectionOptions.bitrate = parseInt(baudrate); // bitrateはIntで指定する必要があるので変換
    console.log("startConnection: " + path + " "+ baudrate);
    // 接続
    chrome.serial.connect(path, connectionOptions, function(status){
      connectionInfo = status;
      // バッファに残っているデータは破棄する
      chrome.serial.flush(connectionInfo.connectionId, function(result){
        ;
      });
      $("#button_send, #sendline").prop("disabled", false); // 送信関連有効
    });
  };

  // 接続終了時の動作
  function endConnection(){
    $("#button_send, #sendline").prop("disabled", true); // 送信関連無効
    $('#ports, #baudrate').prop("disabled", false); // 接続先設定を有効にする
    // 切断
    chrome.serial.disconnect(connectionInfo.connectionId, function(result){
    	if(result == true){
        console.log("endConnection success.");
    	} else {
        console.log("endConnection failed.");
    	}
    });
  };

  function sendData(){
    var data = $('#sendline').val(); // 入力された文字列を持ってくる
    $('#sendline').val(''); // 送信エリアのクリア

    // 改行コード付加の判断
    switch($('#breaktype').val()){
      case 'crlf':
      data += '\r\n';
      break;
      case 'cr':
      data += '\r';
      break;
      case 'lf':
      data += '\n';
      break;
    }

    // chrome.serial.sendはArrayBufferしか受け付けないので変換を行う
    var buf = new ArrayBuffer(data.length);
    var charData = new Uint8Array(buf);
    for(i in charData){
      charData[i] = data.charCodeAt(i);
    }

    // シリアル送信
    chrome.serial.send(connectionInfo.connectionId, buf, function(result){
      ;
    });
  };

  // シリアル受信時に実行される
  chrome.serial.onReceive.addListener(function(rx){
    var data = String.fromCharCode.apply(null, new Uint8Array(rx.data)).replace(/\r?\n/g,"<br>");
    $('#rxArea').append(data);  // 画面に表示(追加)させる
    if($('#check_autoscroll').is(':checked')){
      $('#rxArea').scrollTop($('#rxArea').get(0).scrollHeight); // Auto scroll
    }
  });
});