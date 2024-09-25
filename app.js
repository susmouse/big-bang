// ==UserScript==
// @name         锤子风格文本分词大爆炸
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  选中文本后在旁边添加一个按钮，点击后显示分词结果，可以选择单词并复制
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let button = null;
  let popupContainer = null;

  // 创建按钮
  function createButton() {
    button = document.createElement("button");
    button.textContent = "分词大爆炸";
    button.style.position = "absolute";
    button.style.zIndex = "9999";
    button.style.display = "none";
    document.body.appendChild(button);
  }

  // 显示按钮
  function showButton(x, y) {
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
    button.style.display = "block";
  }

  // 隐藏按钮
  function hideButton() {
    button.style.display = "none";
  }

  // 创建弹出窗口
  function createPopup() {
    popupContainer = document.createElement("div");
    popupContainer.style.position = "fixed";
    popupContainer.style.top = "50%";
    popupContainer.style.left = "50%";
    popupContainer.style.transform = "translate(-50%, -50%)";
    popupContainer.style.backgroundColor = "white";
    popupContainer.style.padding = "20px";
    popupContainer.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
    popupContainer.style.zIndex = "10000";
    popupContainer.style.maxWidth = "80%";
    popupContainer.style.maxHeight = "80%";
    popupContainer.style.overflow = "auto";
    popupContainer.style.display = "none";
    document.body.appendChild(popupContainer);
  }

  // 显示弹出窗口
  function showPopup(words) {
    popupContainer.innerHTML = "";
    words.forEach((word) => {
      const wordButton = document.createElement("button");
      wordButton.textContent = word;
      wordButton.style.margin = "5px";
      wordButton.style.padding = "5px 10px";
      wordButton.addEventListener("click", () =>
        wordButton.classList.toggle("selected")
      );
      popupContainer.appendChild(wordButton);
    });

    const copyButton = document.createElement("button");
    copyButton.textContent = "复制选中文本";
    copyButton.style.display = "block";
    copyButton.style.marginTop = "10px";
    copyButton.addEventListener("click", copySelectedWords);
    popupContainer.appendChild(copyButton);

    popupContainer.style.display = "block";
  }

  // 隐藏弹出窗口
  function hidePopup() {
    popupContainer.style.display = "none";
  }

  // 分词函数（简单实现，仅用空格和标点符号分割）
  function wordExplosion(text) {
    return text.split(/[\s\p{P}]+/u).filter((word) => word.length > 0);
  }

  // 复制选中的单词
  function copySelectedWords() {
    const selectedWords = Array.from(
      popupContainer.querySelectorAll("button.selected")
    )
      .map((button) => button.textContent)
      .join(" ");
    navigator.clipboard
      .writeText(selectedWords)
      .then(() => {
        alert("已复制选中的文本！");
      })
      .catch((err) => {
        console.error("复制失败: ", err);
      });
  }

  // 监听选择事件
  document.addEventListener("selectionchange", function () {
    const selection = window.getSelection();
    if (selection.toString().trim() !== "") {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showButton(rect.right + window.scrollX, rect.top + window.scrollY);
    } else {
      hideButton();
    }
  });

  // 监听按钮点击事件
  function onButtonClick() {
    const selection = window.getSelection();
    const text = selection.toString();
    const words = wordExplosion(text);
    showPopup(words);
    hideButton();
  }

  // 初始化
  createButton();
  createPopup();
  button.addEventListener("click", onButtonClick);

  // 点击其他地方时关闭弹窗
  document.addEventListener("click", function (event) {
    if (event.target !== button && !popupContainer.contains(event.target)) {
      hidePopup();
    }
  });
})();
