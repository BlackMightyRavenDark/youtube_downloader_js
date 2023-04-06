"use strict";

const YOUTUBE_URL = "https://www.youtube.com";
const nodeBody = document.querySelector("body");
const btnDownload = document.getElementById("btnDownload");
const inputUrl = document.getElementById("inputUrl");
const nodeVideoInfo = document.querySelector("#video-info");
const nodeFormatList = document.querySelector("#formatlist-container");

async function getVideoInfo(videoId) {
    try {
        const serverIp = "31.135.37.195:5555";
        const url = `http://${serverIp}/videoinfo/${videoId}`;
        const response = await fetch(url);
        return response.status == 200 ? await response.json() : null;
    } catch {
        return null;
    }
}

function extractVideoIdFromUrl(url) {
    const pattern = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(pattern);
    return match ? match[7] : null;
}

btnDownload.onclick = async (e) => {
    btnDownload.disabled = true;
    clearChildNodes(nodeVideoInfo);
    clearChildNodes(nodeFormatList);
    const url = inputUrl.value;
    if (url === null || url === undefined || url === "") {
        alert("Не введена ссылка!");
        btnDownload.disabled = false;
        return;
    }
    localStorage.setItem("videoUrl", url);

    const videoId = extractVideoIdFromUrl(url);
    if (videoId === undefined || videoId == null || videoId === "") {
        alert("Не удалось распознать ID видео!");
        btnDownload.disabled = false;
        return;
    }

    const response = await getVideoInfo(videoId);
    if (response) {
        parseJson(response);
    } else {
        generateServerDown();
    }

    btnDownload.disabled = false;
}

function getImageSet(urls) {
    const imageSet = new Set();
    urls.forEach(element => {
        const n = element.url.indexOf("?");
        const t = n > 0 ? element.url.substring(0, n) : element.url;
        imageSet.add(t);
        if (t.indexOf("webp") > 0) {
            const s = t.replace("vi_webp", "vi").replace(".webp", ".jpg");
            imageSet.add(s);
        }
    });
    return Array.from(imageSet);
}

function parseJson(json) {
    const jVideoDetails = json.videoDetails;
    if (jVideoDetails) {
        const videoId = jVideoDetails.videoId;
        const videoTitle = jVideoDetails.title;
        const channelId = jVideoDetails.channelId;
        const channelTitle = jVideoDetails.author;
        const imageUrls = jVideoDetails?.thumbnail?.thumbnails;
        const imageSet = getImageSet(imageUrls);
        const imageUrl = imageSet[imageSet.length - 1];

        const nodeVideoTitle = document.createElement("p");
        nodeVideoTitle.textContent = videoTitle;
        const nodeVideoTitleAnchor = document.createElement("a");
        nodeVideoTitleAnchor.setAttribute("href", `${YOUTUBE_URL}/watch?v=${videoId}`);
        nodeVideoTitleAnchor.setAttribute("target", "_blank");
        nodeVideoTitleAnchor.appendChild(nodeVideoTitle);

        const nodeChannelTitle = document.createElement("p");
        nodeChannelTitle.textContent = channelTitle;
        const nodeChannelTitleAnchor = document.createElement("a");
        nodeChannelTitleAnchor.setAttribute("href", `${YOUTUBE_URL}/channel/${channelId}/videos`);
        nodeChannelTitleAnchor.setAttribute("target", "_blank");
        nodeChannelTitleAnchor.appendChild(nodeChannelTitle);

        const nodeVideoImageFormatsWrapper = document.createElement("div");
        nodeVideoImageFormatsWrapper.classList.add("image-formats-wrapper");

        imageSet.forEach(element => {
            const nodeVideoImageFormatButton = document.createElement("button");
            nodeVideoImageFormatButton.textContent = element.substring(element.lastIndexOf("/") + 1);
            nodeVideoImageFormatButton.addEventListener("click", (e) => {
                nodeVideoImage.setAttribute("src", element);
                nodeVideoImageAnchor.setAttribute("href", element);
            });

            nodeVideoImageFormatsWrapper.appendChild(nodeVideoImageFormatButton);
        });

        const nodeVideoImage = document.createElement("img");
        nodeVideoImage.setAttribute("src", imageUrl);
        nodeVideoImage.setAttribute("alt", "image");

        const nodeVideoImageAnchor = document.createElement("a");
        nodeVideoImageAnchor.setAttribute("href", imageUrl);
        nodeVideoImageAnchor.setAttribute("target", "_blank");
        nodeVideoImageAnchor.appendChild(nodeVideoImage);

        const nodeVideoImageWrapper = document.createElement("div");
        nodeVideoImageWrapper.classList.add("video-info__image-wrapper");
        nodeVideoImageWrapper.appendChild(nodeVideoImageAnchor);

        const nodeVideoImageContainer = document.createElement("div");
        nodeVideoImageContainer.classList.add("video-info__image-container");
        nodeVideoImageContainer.appendChild(nodeVideoImageFormatsWrapper);
        nodeVideoImageContainer.appendChild(nodeVideoImageWrapper);

        nodeVideoInfo.appendChild(nodeVideoTitleAnchor);
        nodeVideoInfo.appendChild(nodeChannelTitleAnchor);
        nodeVideoInfo.appendChild(nodeVideoImageContainer);

        parseStreamingData(json.streamingData);
    }
}

function parseStreamingData(jStreamingData) {
    const jAdaptiveFormats = jStreamingData.adaptiveFormats;
    if (jAdaptiveFormats) {
        const nodeAdaptiveVideoListContainer = document.createElement("div");
        const nodeAdaptiveVideoListContainerTitle = document.createElement("p");
        nodeAdaptiveVideoListContainerTitle.textContent = "Адаптивные форматы видео:";
        nodeAdaptiveVideoListContainer.appendChild(nodeAdaptiveVideoListContainerTitle);
        const nodeAdaptiveVideoFormatList = document.createElement("div");
        nodeAdaptiveVideoFormatList.classList.add("format-list");
        nodeAdaptiveVideoListContainer.appendChild(nodeAdaptiveVideoFormatList);
        nodeFormatList.appendChild(nodeAdaptiveVideoListContainer);

        const nodeAdaptiveAudioListContainer = document.createElement("div");
        const nodeAdaptiveAudioListContainerTitle = document.createElement("p");
        nodeAdaptiveAudioListContainerTitle.textContent = "Адаптивные форматы аудио:";
        nodeAdaptiveAudioListContainer.appendChild(nodeAdaptiveAudioListContainerTitle);
        const nodeAdaptiveAudioFormatList = document.createElement("div");
        nodeAdaptiveAudioFormatList.classList.add("format-list");
        nodeAdaptiveAudioListContainer.appendChild(nodeAdaptiveAudioFormatList);
        nodeFormatList.appendChild(nodeAdaptiveAudioListContainer);

        jAdaptiveFormats.forEach(element => {
            const mime = element.mimeType;
            const mimeSplitted = mime.split(";");
            const media = mimeSplitted[0].split("/");
            const mediaType = media[0];
            const fileExtension = media[1];
            const codecs = mimeSplitted[1].match('"(.*?)"')[1];

            if (mediaType === "video") {
                const nodeAdaptiveVideoItem = document.createElement("span");
                nodeAdaptiveVideoItem.classList.add("format-list__format-item");
                nodeAdaptiveVideoItem.classList.add("color-video");

                const nodeAdaptiveVideoItemQualityLabel = document.createElement("span");
                nodeAdaptiveVideoItemQualityLabel.textContent = `${element.qualityLabel}, ${element.fps}fps`;
                nodeAdaptiveVideoItem.appendChild(nodeAdaptiveVideoItemQualityLabel);

                const nodeAdaptiveVideoItemFormat = document.createElement("span");
                nodeAdaptiveVideoItemFormat.textContent = fileExtension.toUpperCase();
                nodeAdaptiveVideoItem.appendChild(nodeAdaptiveVideoItemFormat);

                const nodeAdaptiveVideoItemCodecs = document.createElement("span");
                nodeAdaptiveVideoItemCodecs.textContent = codecs;
                nodeAdaptiveVideoItem.appendChild(nodeAdaptiveVideoItemCodecs);

                const averageBitrate = element.averageBitrate;
                if (averageBitrate) {
                    const nodeAdaptiveVideoItemBitrate = document.createElement("span");
                    nodeAdaptiveVideoItemBitrate.textContent = `${(averageBitrate / 1024).toFixed(3)} Kbps`;
                    nodeAdaptiveVideoItem.appendChild(nodeAdaptiveVideoItemBitrate);
                }

                const nodeAdaptiveVideoItemFileSize = document.createElement("span");
                nodeAdaptiveVideoItemFileSize.textContent = formatSize(element.contentLength);
                nodeAdaptiveVideoItem.appendChild(nodeAdaptiveVideoItemFileSize);

                const nodeAdaptiveVideoItemAnchor = document.createElement("a");
                nodeAdaptiveVideoItemAnchor.setAttribute("href", element.url);
                nodeAdaptiveVideoItemAnchor.setAttribute("target", "_blank");
                nodeAdaptiveVideoItemAnchor.appendChild(nodeAdaptiveVideoItem);

                nodeAdaptiveVideoFormatList.appendChild(nodeAdaptiveVideoItemAnchor);
            } else if (mediaType === "audio") {
                const nodeAdaptiveAudioItem = document.createElement("span");
                nodeAdaptiveAudioItem.classList.add("format-list__format-item");
                nodeAdaptiveAudioItem.classList.add("color-audio");

                const averageBitrate = element.averageBitrate;
                if (averageBitrate) {
                    const nodeAdaptiveAudioItemBitrate = document.createElement("span");
                    nodeAdaptiveAudioItemBitrate.textContent = `${(averageBitrate / 1024).toFixed(3)} Kbps`;
                    nodeAdaptiveAudioItem.appendChild(nodeAdaptiveAudioItemBitrate);
                }

                const nodeAdaptiveAudioItemQuality = document.createElement("span");
                nodeAdaptiveAudioItemQuality.textContent = `${element.audioSampleRate} hz, ${element.audioChannels} ch`;
                nodeAdaptiveAudioItem.appendChild(nodeAdaptiveAudioItemQuality);

                const nodeAdaptiveAudioItemFormat = document.createElement("span");
                nodeAdaptiveAudioItemFormat.textContent = fileExtension.toUpperCase();
                nodeAdaptiveAudioItem.appendChild(nodeAdaptiveAudioItemFormat);

                const nodeAdaptiveAudioItemCodecs = document.createElement("span");
                nodeAdaptiveAudioItemCodecs.textContent = codecs;
                nodeAdaptiveAudioItem.appendChild(nodeAdaptiveAudioItemCodecs);

                const nodeAdaptiveAudioItemFileSize = document.createElement("span");
                nodeAdaptiveAudioItemFileSize.textContent = formatSize(element.contentLength);
                nodeAdaptiveAudioItem.appendChild(nodeAdaptiveAudioItemFileSize);

                const nodeAdaptiveAudioItemAnchor = document.createElement("a");
                nodeAdaptiveAudioItemAnchor.setAttribute("href", element.url);
                nodeAdaptiveAudioItemAnchor.setAttribute("target", "_blank");
                nodeAdaptiveAudioItemAnchor.appendChild(nodeAdaptiveAudioItem);

                nodeAdaptiveAudioFormatList.appendChild(nodeAdaptiveAudioItemAnchor);
            }
        });
    }

    const jContainerFormats = jStreamingData.formats;
    if (jContainerFormats) {
        const nodeContainerListContainer = document.createElement("div");

        const nodeContainerListContainerTitle = document.createElement("div");
        nodeContainerListContainerTitle.textContent = "Контейнерные форматы:";

        const nodeContainerFormatList = document.createElement("div");
        nodeContainerFormatList.classList.add("format-list");

        jContainerFormats.forEach(element => {
            const mime = element.mimeType;
            const mimeSplitted = mime.split(";");
            const media = mimeSplitted[0].split("/");
            const fileExtension = media[1];

            const nodeContainerItem = document.createElement("div");
            nodeContainerItem.classList.add("format-list__format-item");
            nodeContainerItem.classList.add("color-container");
            const nodeContainerItemQuality = document.createElement("span");
            nodeContainerItemQuality.textContent = `${element.qualityLabel}, ${element.fps}fps`;
            nodeContainerItem.appendChild(nodeContainerItemQuality);

            const nodeContainerItemFileExtension = document.createElement("span");
            nodeContainerItemFileExtension.textContent = fileExtension.toUpperCase();
            nodeContainerItem.appendChild(nodeContainerItemFileExtension);

            const averageBitrate = element.averageBitrate;
            if (averageBitrate) {
                const nodeContainerItemBitrate = document.createElement("span");
                const averageBitrateString = (averageBitrate / 1024).toFixed(2);
                nodeContainerItemBitrate.textContent = `~${averageBitrateString} Kbps`;
                nodeContainerItem.appendChild(nodeContainerItemBitrate);
            }

            const contentLength = element.contentLength;
            if (contentLength) {
                const nodeContainerItemFileSize = document.createElement("span");
                nodeContainerItemFileSize.textContent = formatSize(contentLength);
                nodeContainerItem.appendChild(nodeContainerItemFileSize);
            }

            const nodeContainerItemAnchor = document.createElement("a");
            nodeContainerItemAnchor.setAttribute("href", element.url);
            nodeContainerItemAnchor.setAttribute("target", "_blank");
            nodeContainerItemAnchor.appendChild(nodeContainerItem);

            nodeContainerFormatList.appendChild(nodeContainerItemAnchor);
        });

        nodeContainerListContainer.appendChild(nodeContainerListContainerTitle);
        nodeContainerListContainer.appendChild(nodeContainerFormatList);
        nodeFormatList.appendChild(nodeContainerListContainer);
    }
}

function formatSize(n) {
    if (n == 0) {
        return "0.00 B";
    }
    const e = Math.floor(Math.log(n) / Math.log(1024));
    return `${(n / Math.pow(1024, e)).toFixed(2)} ${"KMGTP".charAt(e)}B`;
}

function clearChildNodes(node) {
    for (let i = node.childNodes.length - 1; i >= 0; --i) {
        node.removeChild(node.childNodes[i]);
    }
}

function generateServerDown() {
    const images = ["images/server1.webp", "images/server2.jpg"];
    const id = Math.round(Math.random());

    const nodeServerDownMessage = document.createElement("h2");
    nodeServerDownMessage.textContent = "Сервак упал!";
    nodeServerDownMessage.style.textAlign = "center";

    const nodeServerImage = document.createElement("img");
    nodeServerImage.setAttribute("src", images[id]);
    nodeServerImage.setAttribute("alt", "server");

    nodeVideoInfo.appendChild(nodeServerDownMessage);
    nodeVideoInfo.appendChild(nodeServerImage);
}

String.prototype.format = function() {
    const args = arguments;
    return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (curlyBrack, index) {
        return ((curlyBrack == "{{") ? "{" : ((curlyBrack == "}}") ? "}" : args[index]));
    });
};

const url = localStorage.getItem("videoUrl");
if (url !== null) {
    inputUrl.value = url;
}

nodeBody.appendChild(nodeFormatList);
