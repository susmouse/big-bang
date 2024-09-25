// ==UserScript==
// @name         文本大爆炸
// @namespace    http://tampermonkey.net/
// @version      1
// @description  仿照锤子的大爆炸，使用本地分词逻辑对选中文本进行分词
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    "use strict";
  
    let button = null;
    let popupContainer = null;
  
    /**
     * 创建样式
     * 该函数用于创建并插入样式表，定义按钮和弹出窗口的样式。
     */
    function createStyles() {
      const style = document.createElement("style");
      style.textContent = `
              .word-explosion-button {
                  position: absolute; /* 修改为 absolute，方便根据选中区域定位 */
                  background-color: rgba(217, 12, 12, 0.8);
                  color: #FFF;
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
                  background-color: rgba(217, 12, 12, 0.5);
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
                  display: flex;
                  flex-wrap: wrap;
                  justify-content: center;
                  align-items: center;
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
     * 该函数用于创建并插入一个按钮，用于触发大爆炸功能。
     */
    function createButton() {
      button = document.createElement("button");
      button.textContent = "大爆炸";
      button.className = "word-explosion-button";
      button.style.display = "none";
      document.body.appendChild(button);
    }
  
    /**
     * 显示按钮并将其定位到选中文本旁边
     * 该函数用于在选中文本时显示按钮，并将其定位到选中文本的旁边。
     */
    function showButtonAtSelection() {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect(); // 获取选中区域的矩形框
        button.style.top = `${rect.bottom + window.scrollY + 5}px`; // 按钮显示在选中区域下方
        button.style.left = `${rect.left + window.scrollX}px`; // 按钮靠左边缘
        button.style.display = "block";
      }
    }
  
    /**
     * 隐藏按钮
     * 该函数用于隐藏按钮。
     */
    function hideButton() {
      button.style.display = "none";
    }
  
    /**
     * 创建弹出窗口
     * 该函数用于创建并插入一个弹出窗口，用于显示分词结果。
     */
    function createPopup() {
      popupContainer = document.createElement("div");
      popupContainer.className = "word-explosion-popup";
      popupContainer.style.display = "none";
      document.body.appendChild(popupContainer);
    }
  
    /**
     * 显示弹出窗口
     * 该函数用于显示弹出窗口，并填充分词结果。
     * @param {Array} words - 分词结果数组
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
     * 该函数用于隐藏弹出窗口。
     */
    function hidePopup() {
      popupContainer.style.display = "none";
    }
  
    /**
     * 改进的分词函数
     * 该函数用于对输入的文本进行分词。
     * @param {string} text - 需要分词的文本
     * @returns {Array} - 分词结果数组
     */
    function wordExplosion(text) {
      const regex =
        /[\u4e00-\u9fa5]|[a-zA-Z]+|[0-9]+|[^\u4e00-\u9fa5a-zA-Z0-9]+/g;
      return text.match(regex) || [];
    }
  
    /**
     * 复制选中的单词
     * 该函数用于将选中的单词复制到剪贴板。
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
     * 该函数用于监听用户的选择事件，当用户选中文本时，显示按钮并定位到选中文本旁边。
     */
    document.addEventListener("selectionchange", function () {
      const selection = window.getSelection();
      if (selection.toString().trim() !== "") {
        showButtonAtSelection(); // 选中文本时显示按钮并定位
      } else {
        hideButton();
      }
    });
  
    /**
     * 监听按钮点击事件
     * 该函数用于监听按钮点击事件，当按钮被点击时，显示弹出窗口并隐藏按钮。
     */
    function onButtonClick() {
      const selection = window.getSelection();
      const text = selection.toString();
      const words = wordExplosion(text);
      showPopup(words);
      hideButton();
    }
  
    /**
     * 初始化
     * 该函数用于初始化样式、按钮和弹出窗口，并添加事件监听器。
     */
    function initialize() {
      createStyles();
      createButton();
      createPopup();
      button.addEventListener("click", onButtonClick);
    }
  
    /**
     * 点击其他地方时关闭弹窗
     * 该函数用于监听点击事件，当点击事件发生在按钮或弹出窗口之外时，隐藏弹出窗口。
     */
    document.addEventListener("click", function (event) {
      if (event.target !== button && !popupContainer.contains(event.target)) {
        hidePopup();
      }
    });
  
    // 启动初始化
    initialize();
  })();
  
