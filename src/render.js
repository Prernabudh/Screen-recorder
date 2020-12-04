const videoElement = document.createElement("video");
const startBtn = document.createElement("button");
startBtn.id = "startBtn";
startBtn.innerText = "Start";
const stopBtn = document.createElement("button");
stopBtn.id = "stopBtn";
stopBtn.innerText = "Stop";
stopBtn.disabled = true;
const videoSelectBtn = document.getElementById("videoSelectBtn");
const videoPLayer = document.querySelector(".video-player");
const beforeVideo = document.querySelector(".before-video");
const buttons = document.querySelector(".buttons");
const functionalButtons = document.querySelector(".functional-buttons");

const { desktopCapturer, remote } = require("electron");

const { Menu, dialog } = remote;
const { writeFile } = require("fs");
let mediaRecorder;
const recordedChunks = [];

startBtn.onclick = (e) => {
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerText = "Recording";
  startBtn.disabled = true;
  stopBtn.disabled = false;
};

stopBtn.onclick = (e) => {
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerText = "Start";
};

const getVideoSources = async () => {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });
  console.log(inputSources);
  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => selectSource(source),
      };
    })
  );

  videoOptionsMenu.popup();
};

videoSelectBtn.onclick = getVideoSources;

const selectSource = async (source) => {
  beforeVideo.remove();
  videoPLayer.appendChild(videoElement);
  functionalButtons.appendChild(startBtn);
  functionalButtons.appendChild(stopBtn);
  videoSelectBtn.innerText = source.name;
  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  videoElement.srcObject = stream;
  videoElement.play();

  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
};

function handleDataAvailable(event) {
  console.log("video available");
  if (event.data.size > 0) {
    recordedChunks.push(event.data);
  } else {
    // ...
  }
}

const handleStop = async () => {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.webm`,
  });

  console.log(filePath);
  if (filePath) {
    writeFile(filePath, buffer, async () => {
      await dialog.showMessageBox({
        message: "Video saved successfully!",
      });
      location.reload();
    });
  } else {
    location.reload();
  }
};
