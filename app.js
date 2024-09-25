// ==UserScript==
// @name         FLUENT风格文本分词大爆炸
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  选中文本后在右侧添加一个按钮，点击后显示分词结果，可以选择单词并复制（FLUENT风格）
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let button = null;
  let popupContainer = null;

  // 创建样式
  function createStyles() {
    const style = document.createElement("style");
    style.textContent = `
            .word-explosion-button {
                position: fixed;
                right: 20px;
                top: 50%;
                transform: translateY(-50%);
                background-color: rgba(255, 255, 255, 0.8);
                color: #333;
                border: none;
                padding: 10px 15px;
                border-radius: 20px;
                cursor: pointer;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                z-index: 9999;
            }
            .word-explosion-button:hover {
                background-color: rgba(255, 255, 255, 1);
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            }
            .word-explosion-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(240, 240, 240, 0.8);
                backdrop-filter: blur(10px);
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                max-width: 80%;
                max-height: 80%;
                overflow: auto;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .word-explosion-word {
                margin: 5px;
                padding: 8px 15px;
                background-color: rgba(255, 255, 255, 0.5);
                border: none;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
            }
            .word-explosion-word.selected {
                background-color: #0078D4;
                color: white;
            }
            .word-explosion-copy {
                display: block;
                margin-top: 15px;
                padding: 10px 20px;
                background-color: #0078D4;
                color: white;
                border: none;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            }
            .word-explosion-copy:hover {
                background-color: #106EBE;
            }
        `;
    document.head.appendChild(style);
  }

  // 创建按钮
  function createButton() {
    button = document.createElement("button");
    button.textContent = "大爆炸";
    button.className = "word-explosion-button";
    button.style.display = "none";
    document.body.appendChild(button);
  }

  // 显示按钮
  function showButton() {
    button.style.display = "block";
  }

  // 隐藏按钮
  function hideButton() {
    button.style.display = "none";
  }

  // 创建弹出窗口
  function createPopup() {
    popupContainer = document.createElement("div");
    popupContainer.className = "word-explosion-popup";
    popupContainer.style.display = "none";
    document.body.appendChild(popupContainer);
  }

  // 显示弹出窗口
  function showPopup(words) {
    popupContainer.innerHTML = "";
    words.forEach((word) => {
      const wordButton = document.createElement("button");
      wordButton.textContent = word;
      wordButton.className = "word-explosion-word";
      wordButton.addEventListener("click", () =>
        wordButton.classList.toggle("selected")
      );
      popupContainer.appendChild(wordButton);
    });

    const copyButton = document.createElement("button");
    copyButton.textContent = "复制选中文本";
    copyButton.className = "word-explosion-copy";
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
      popupContainer.querySelectorAll(".word-explosion-word.selected")
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
      showButton();
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
  createStyles();
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
