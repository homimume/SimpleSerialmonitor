chrome.app.runtime.onLaunched.addListener(function(){
  chrome.app.window.create('window.html', {
    'bounds': {
      'width': 425,
      'height': 390
    }
  });
});
