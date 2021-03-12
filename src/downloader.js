//requirements
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { BrowserWindow, dialog } = require('@electron/remote')
const os = require('os')
const fs = require("fs");
const ytdl = require("ytdl-core");
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

//dumb
const textinput = document.getElementById("urlinput");
const videoformat = document.getElementById("videofselect");
const audioformat = document.getElementById("audiofselect");
const button = document.getElementsByName("button");

//var


/* ==========================================================================
                              FUNCTIONS
========================================================================== */


//filter

function filter_vid_aud_both(formats){
  audiof = formats.filter(format => format.audioBitrate != null);
  videof = formats.filter(format => format.height != null);
  both = audiof.filter(function(format){
    return videof.includes(format);
  });
  return [videof, audiof, both];
}


//merge with fluent-ffmpeg
async function mergevidaud(filepaths, name){

  var downloadpath = ''

  await dialog.showOpenDialog({
    properties: ['openDirectory', 'promptToCreate']
  }).then(result => {
    //if(result.cancelled != false) return document.location.href = 'index.html';
    downloadpath = result.filePaths
    console.log(result.filePaths)
  }).catch(err => {
    console.log(err)
  })

  document.getElementById('topText').innerText = 'Processing'
  document.getElementById('paraText').innerText = 'Your video has now been downloaded and is being processed, this may take some time and may be resource intensive. Do not reload or close the program while this is happening.'

  var video = ffmpeg();
  fs.stat(filepaths[0], (err, stats) => {
    if(stats.isFile()){
      video.input(filepaths[0]);
    }
  });
  fs.stat(filepaths[1], (err, stats) => {
    if(stats.isFile()){
      video.input(filepaths[1]);
    }
  });
  video.output(`${downloadpath}\\${name}.mp4`);
  video.on("end", () => {
    fs.unlinkSync(filepaths[0]);
    fs.unlinkSync(filepaths[1]);
    document.location.href = 'done.html';
  });
  video.run();
}


//download
function downloadvidaudandmerge(downloadpath, name, itagvideo, containerv, itagaudio, containera){// "", title, 18, mp4, 18, mp4,
  if(ytdl.validateURL(textinput.value)){

    document.getElementById('topText').innerText = 'Downloading'
    document.getElementById('paraText').innerText = 'Your video is now downloading, please note that this may take a while depending on the quality of the video. Do not reload or close the program while this is happening.'
    document.getElementById('button').remove()
    document.getElementById('urlinput').remove()
    document.getElementById('videofselect').remove()
    document.getElementById('audiofselect').remove()
    
    //remove chars from name that can`t be in windows filename
    // <>:"/\|?*
    char = String.raw`<>:"/\|?*`;//"- "
    for (let i = 0; i < name.length; i++) {
	    for(let j = 0; j < char.length; j++){
        name = name.replace(char[j], "");
	    }
    }
    //download
    //ffmpeg only works with valid files, so the download needs to be finished
    //added to event listeners. if both downloads are finsihed return smth because
    //there is an await for the return value of this function
    var videofinish = false;
    var audiofinish = false;
    var done = false;
    //vid
    if(itagvideo != null){
      ytdl(textinput.value, { quality: itagvideo})
      .on('finish', () => {
        videofinish = true;
        if(audiofinish && itagvideo != null && itagaudio != null){//no need to merge if audio XOR video
          mergevidaud([downloadpath + name + "v" + "." + containerv, downloadpath + name + "a" + "." + containera], name);
        }
      })
      .pipe(fs.createWriteStream(downloadpath + name + "v" + "." + containerv));
    }
    //aud
    if(itagaudio != null){
      ytdl(textinput.value, { quality: itagaudio})
      .on('finish', () => {
        audiofinish = true;
        if(videofinish && itagvideo != null && itagaudio != null){
          //merging can take some time, the file can only be opened after fully beeing merged
          mergevidaud([downloadpath + name + "v" + "." + containerv, downloadpath + name + "a" + "." + containera], name);
        }
      })
      .pipe(fs.createWriteStream(downloadpath + name + "a" + "." + containera));
    }
  }
}


//GUI
function makeoption(parent, value){
  newoption = document.createElement("option");
  newoption.value = value;
  newoption.innerHTML = value;
  parent.add(newoption);
}

/* ==========================================================================
                              MAIN CODE
========================================================================== */


//event listener
textinput.addEventListener("input", async() => {
  if(ytdl.validateURL(textinput.value)){
    //getinfo
    let info = await ytdl.getInfo(textinput.value);
    //filter
    let formatsall = filter_vid_aud_both(info.formats);
    let formats = formatsall.filter((value) => { return !(value.hasaudio && value.hasvideo)});
    //filter for displaying
    //video
    let videoquali = formats[0].map(vheight => vheight.height);
    let vquali_unique = videoquali.filter((value, index, self) => self.indexOf(value) === index);
    vquali_unique.sort((a, b) => {
      return b-a;
    });
    //audio
    let audioquali = formats[1].map(bitrate => bitrate.audioBitrate);
    let aquali_unique = audioquali.filter((value, index, self) => self.indexOf(value) === index);
    aquali_unique.sort((a, b) => {
      return b-a;
    });
    //display video
    for (let i = 0; i < vquali_unique.length; i++) {
      makeoption(videoformat, vquali_unique[i]);
    }
    //display audio
    for (let i = 0; i < aquali_unique.length; i++) {
      makeoption(audioformat, aquali_unique[i]);
    }
    inputdata = [info, formats, videoquali, vquali_unique, audioquali, aquali_unique];
  } else {
    //remove all childs of the selects and add the None option back
    //because its not a YT link anymore
    for (let i = videoformat.length; i > -1; i--) {
      videoformat.remove(i);
    }
    for (let i = audioformat.length; i > -1; i--) {
      audioformat.remove(i);
    }
    makeoption(videoformat, "None");
    makeoption(audioformat, "None");
  }
});


button[0].addEventListener("click", async() => {

  var downloadpath = process.cwd() + '\\'

  //download audio and video depending on the selections; defaults for None
  //writes 2 files
  //merge inside download function
  if(inputdata != undefined){
    if( (videoformat.value == "None") && (audioformat.value == "None")){
      downloadvidaudandmerge(downloadpath, inputdata[0].videoDetails.title, 136, "mp4", 140, "mp4");
    } else if( ((videoformat.value == "None") && (audioformat.value != "None"))){
      var aformat = inputdata[1][1].filter(value => value.audioBitrate == audioformat.value)[0];
      downloadvidaudandmerge(downloadpath, inputdata[0].videoDetails.title, null, null, aformat.itag, aformat.container);
    } else if( ((videoformat.value != "None") && (audioformat.value == "None"))){
      var vformat = inputdata[1][0].filter(value => value.height == videoformat.value)[0]
      downloadvidaudandmerge(downloadpath, inputdata[0].videoDetails.title, vformat.itag, vformat.container, null, null);
    } else {
      var vformat = inputdata[1][0].filter(value => value.height == videoformat.value)[0];
      var aformat = inputdata[1][1].filter(value => value.audioBitrate == audioformat.value)[0];
      downloadvidaudandmerge(downloadpath, inputdata[0].videoDetails.title, vformat.itag, vformat.container, aformat.itag, aformat.container);
    }
  }
});
