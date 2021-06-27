/* eslint-disable no-undef */
const ffmpegPath = require('ffmpeg-static');
const { dialog } = require('@electron/remote');
const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const textInput = document.getElementById('urlinput');
const videoFormat = document.getElementById('videofselect');
const audioFormat = document.getElementById('audiofselect');
const button = document.getElementsByName('button');

/* ==========================================================================
                              FUNCTIONS
========================================================================== */

//filter
function filterVideoAudio(formats) {
    audiof = formats.filter((format) => format.audioBitrate != null);
    videof = formats.filter((format) => format.height != null);
    both = audiof.filter(function (format) {
        return videof.includes(format);
    });
    return [videof, audiof, both];
}

// Merge File
async function mergeVideoAudio(filepaths, name) {
    var downloadpath = '';

    await dialog
        .showOpenDialog({
            properties: ['openDirectory', 'promptToCreate'],
        })
        .then((result) => {
            downloadpath = result.filePaths;
            console.log(`File path chosen: ${result.filePaths}`);
        })
        .catch((err) => {
            console.log(err);
        });

    console.log(`Download complete, processing video audio merge...`);
    document.getElementById('topText').innerText = 'Processing';
    document.getElementById('paraText').innerText =
        'Your video has now been downloaded and is being processed, this may take some time and may be resource intensive. Do not reload or close the program while this is happening.';

    var video = ffmpeg();
    fs.stat(filepaths[0], (err, stats) => {
        if (stats.isFile()) {
            video.input(filepaths[0]);
        }
    });
    fs.stat(filepaths[1], (err, stats) => {
        if (stats.isFile()) {
            video.input(filepaths[1]);
        }
    });
    video.output(`${downloadpath}\\${name}.mp4`);
    video.on('end', () => {
        fs.unlinkSync(filepaths[0]);
        fs.unlinkSync(filepaths[1]);
        document.location.href = 'done.html';
    });
    video.run();
}

// Download File
function videoAudioMerge(downloadpath, name, itagvideo, containerv, itagaudio, containera) {
    if (ytdl.validateURL(textInput.value)) {
        console.log('Validated URL');
        document.getElementById('topText').innerText = 'Downloading';
        document.getElementById('paraText').innerText =
            'Your video is now downloading, please note that this may take a while depending on the quality of the video. Do not reload or close the program while this is happening.';
        document.getElementById('button').remove();
        document.getElementById('urlinput').remove();
        document.getElementById('videofselect').remove();
        document.getElementById('audiofselect').remove();

        //remove chars from name that can`t be in windows filename
        // <>:"/\|?*
        char = String.raw`<>:"/\|?*`; //"- "
        for (let i = 0; i < name.length; i++) {
            for (let j = 0; j < char.length; j++) {
                name = name.replace(char[j], '');
            }
        }

        var videofinish = false;
        var audiofinish = false;
        //vid
        if (itagvideo != null) {
            ytdl(textInput.value, { quality: itagvideo })
                .on('finish', () => {
                    videofinish = true;
                    if (audiofinish && itagvideo != null && itagaudio != null) {
                        //no need to merge if audio XOR video
                        console.log(`Video Download Done. ${downloadpath}/${name}`);
                        mergeVideoAudio([downloadpath + name + 'v' + '.' + containerv, downloadpath + name + 'a' + '.' + containera], name);
                    }
                })
                .pipe(fs.createWriteStream(downloadpath + name + 'v' + '.' + containerv));
        }
        //aud
        if (itagaudio != null) {
            ytdl(textInput.value, { quality: itagaudio })
                .on('finish', () => {
                    audiofinish = true;
                    if (videofinish && itagvideo != null && itagaudio != null) {
                        //merging can take some time, the file can only be opened after fully being merged
                        console.log(`Audio Download Done. ${downloadpath}/${name}`);
                        mergeVideoAudio([downloadpath + name + 'v' + '.' + containerv, downloadpath + name + 'a' + '.' + containera], name);
                    }
                })
                .pipe(fs.createWriteStream(downloadpath + name + 'a' + '.' + containera));
        }
    }
}

// GUI
function makeOption(parent, value) {
    console.log(`Creating options: ${value}`);
    newoption = document.createElement('option');
    newoption.value = value;
    newoption.innerHTML = value;
    parent.add(newoption);
}

// Events Listener
textInput.addEventListener('input', async () => {
    console.log(`Registered Text Input: ${textInput.value}`);
    if (ytdl.validateURL(textInput.value)) {
        // Fetch Video Info
        let info = await ytdl.getInfo(textInput.value);
        // Filter for audio
        let formatsall = filterVideoAudio(info.formats);
        let formats = formatsall.filter((value) => {
            return !(value.hasaudio && value.hasvideo);
        });
        // Filter for video
        let videoquali = formats[0].map((vheight) => vheight.height);
        let vquali_unique = videoquali.filter((value, index, self) => self.indexOf(value) === index);
        vquali_unique.sort((a, b) => {
            return b - a;
        });
        // Audio
        let audioquali = formats[1].map((bitrate) => bitrate.audioBitrate);
        let aquali_unique = audioquali.filter((value, index, self) => self.indexOf(value) === index);
        aquali_unique.sort((a, b) => {
            return b - a;
        });
        // Video
        for (let i = 0; i < vquali_unique.length; i++) {
            makeOption(videoFormat, `${vquali_unique[i]}p`);
        }
        //display audio
        for (let i = 0; i < aquali_unique.length; i++) {
            makeOption(audioFormat, `${aquali_unique[i]}kbps`);
        }
        inputdata = [info, formats, videoquali, vquali_unique, audioquali, aquali_unique];
    } else {
        // Remove all childs of the selects and add the None option back
        for (let i = videoFormat.length; i > -1; i--) {
            videoFormat.remove(i);
        }
        for (let i = audioFormat.length; i > -1; i--) {
            audioFormat.remove(i);
        }
        console.log(`Clearing options.`);
        makeOption(videoFormat, 'Video');
        makeOption(audioFormat, 'Audio');
    }
});

button[0].addEventListener('click', async () => {
    var downloadpath = process.cwd() + '\\';

    // Download audio and video depending on the selections; defaults for None
    // Writes 2 files and merges them together
    if (inputdata != undefined) {
        console.log(`Beginning Download For: ${inputdata[0].videoDetails.title}`);
        if (videoFormat.value == 'None' && audioFormat.value == 'None') {
            videoAudioMerge(downloadpath, inputdata[0].videoDetails.title, 136, 'mp4', 140, 'mp4');
        } else if (videoFormat.value == 'None' && audioFormat.value != 'None') {
            var aformat = inputdata[1][1].filter((value) => value.audioBitrate == audioFormat.value)[0];
            videoAudioMerge(downloadpath, inputdata[0].videoDetails.title, null, null, aformat.itag, aformat.container);
        } else if (videoFormat.value != 'None' && audioFormat.value == 'None') {
            var vformat = inputdata[1][0].filter((value) => value.height == videoFormat.value)[0];
            videoAudioMerge(downloadpath, inputdata[0].videoDetails.title, vformat.itag, vformat.container, null, null);
        } else {
            vformat = inputdata[1][0].filter((value) => value.height == videoFormat.value)[0];
            aformat = inputdata[1][1].filter((value) => value.audioBitrate == audioFormat.value)[0];
            videoAudioMerge(downloadpath, inputdata[0].videoDetails.title, vformat.itag, vformat.container, aformat.itag, aformat.container);
        }
    }
});
