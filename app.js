// ==UserScript==
// @name         文本大爆炸
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  仿照锤子的大爆炸，对选中文本进行分词
// @match        *://*/*
// @license      MIT
// @icon         https://s2.loli.net/2024/09/25/6PxlMHA7EZVqwsJ.png
// @require      https://cdn.jsdelivr.net/npm/segmentit@2.0.3/dist/umd/segmentit.js
// ==/UserScript==

(function () {
  "use strict";

  let button = null;
  let popupContainer = null;
  const segmentit = Segmentit.useDefault(new Segmentit.Segment());

  // 拖动选择功能所需的变量
  let isDragging = false;
  let startElement = null;

  /**
   * 创建样式
   */
  function createStyles() {
    const style = document.createElement("style");
    style.textContent = `
              .word-explosion-button {
                  position: absolute;
                  background-color: rgba(255,255,255, 0.4);
                  color: #000;
                  border: none;
                  border-radius: 50%;
                  cursor: pointer;
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  font-size: 16px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
                  transition: all 0.3s ease;
                  z-index: 9999;
                  width: 30px;
                  height: 30px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
              }
              .word-explosion-button:hover {
                  background-color: rgba(255,255,255, 0.75);
                  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
                  transform: scale(1.1);
                  transition: transform 0.3s ease;
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
                  display: flex;
                  flex-wrap: wrap;
                  justify-content: center;
                  align-items: center;
                  opacity: 0;
                  animation: fadeIn 0.5s ease forwards;
              }

              @keyframes fadeIn {
                  from {
                      opacity: 0;
                      transform: translate(-50%, -50%) scale(0.9);
                  }
                  to {
                      opacity: 1;
                      transform: translate(-50%, -50%) scale(1);
                  }
              }
              .word-explosion-word {
                  margin: 2px;
                  padding: 4px 8px;
                  background-color: rgba(255, 255, 255, 0.5);
                  border: none;
                  border-radius: 10px;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  font-size: 14px;
                  display: inline-flex;
                  align-items: center;
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

  /**
   * 创建按钮
   */
  function createButton() {
    button = document.createElement("button");
    button.textContent = "🔨";
    button.className = "word-explosion-button";
    button.style.display = "none";
    document.body.appendChild(button);
  }

  /**
   * 显示按钮并将其定位到选中文本旁边
   */
  function showButtonAtSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      button.style.top = `${rect.bottom + window.scrollY + 5}px`;
      button.style.left = `${rect.left + window.scrollX}px`;
      button.style.display = "block";
    }
  }

  /**
   * 隐藏按钮
   */
  function hideButton() {
    button.style.display = "none";
  }

  /**
   * 创建弹出窗口
   */
  function createPopup() {
    popupContainer = document.createElement("div");
    popupContainer.className = "word-explosion-popup";
    popupContainer.style.display = "none";
    document.body.appendChild(popupContainer);

    // 添加事件监听器，用于实现拖动选择功能
    popupContainer.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    // 添加事件监听器，用于隐藏弹出窗口
    document.addEventListener("click", (event) => {
      if (!popupContainer.contains(event.target)&&!button.contains(event.target)) {
        hidePopup();
      }
    });
  }

  /**
   * 显示弹出窗口
   */
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
    copyButton.style.width = "100%";
    copyButton.addEventListener("click", copySelectedWords);
    popupContainer.appendChild(copyButton);

    popupContainer.style.display = "flex";
  }

  /**
   * 隐藏弹出窗口
   */
  function hidePopup() {
    popupContainer.style.display = "none";
  }

  /**
   * 分词函数
   */
  function wordExplosion(text) {
    let result = segmentit.doSegment(text).map((item) => item.w);
    console.log(`分词结果：\n${result}`);
    return result || [];
  }

  /**
   * 复制选中的单词
   */
  function copySelectedWords() {
    const selectedWords = Array.from(
      popupContainer.querySelectorAll(".word-explosion-word.selected")
    )
      .map((button) => button.textContent)
      .join("");
    navigator.clipboard
      .writeText(selectedWords)
      .then(() => {
        alert(`已复制：${selectedWords}！`);
      })
      .catch((err) => {
        console.error("复制失败: ", err);
      });
  }

  /**
   * 监听选择事件
   */
  document.addEventListener("selectionchange", function () {
    const selection = window.getSelection();
    if (selection.toString().trim() !== "") {
      showButtonAtSelection();
    } else {
      hideButton();
    }
  });

  /**
   * 监听按钮点击事件
   */
  function onButtonClick() {
    const selection = window.getSelection();
    const text = selection.toString();
    const words = wordExplosion(text);
    showPopup(words);
    hideButton();
  }

  let longPressTimer = null;
  const longPressThreshold = 200; // 长按阈值，单位为毫秒

  /**
   * 处理鼠标按下事件
   */
  function onMouseDown(event) {
    if (event.target.classList.contains("word-explosion-word")) {
      longPressTimer = setTimeout(() => {
        isDragging = true;
        startElement = event.target;
        startElement.classList.add("selected");
      }, longPressThreshold);
    }
  }

  /**
   * 处理鼠标移动事件
   */
  function onMouseMove(event) {
    if (isDragging && startElement) {
      const currentElement = document.elementFromPoint(
        event.clientX,
        event.clientY
      );
      if (
        currentElement &&
        currentElement.classList.contains("word-explosion-word") &&
        currentElement !== startElement
      ) {
        currentElement.classList.add("selected");
      }
    }
  }

  /**
   * 处理鼠标松开事件
   */
  function onMouseUp(event) {
    clearTimeout(longPressTimer);
    isDragging = false;
    startElement = null;
  }

  // 初始化脚本
  function init() {
    createStyles();
    createButton();
    createPopup();

    button.addEventListener("click", onButtonClick);
  }

  init();
})();
