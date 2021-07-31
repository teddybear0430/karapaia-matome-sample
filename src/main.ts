import fetch from 'node-fetch';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import jsdom from 'jsdom';
import { config } from './config';

const { JSDOM } = jsdom;

// メインの処理
const mainFunc = async () => {
  try {
    const { url } = config;
    const res = await fetch(url);
    const buffer = await res.buffer();
    const encoding = await encodingFunc(buffer);

    const html = iconv.decode(buffer, encoding);

    const dom = new JSDOM(html);
    const document = dom.window.document;
    const nodes = document.querySelectorAll('.widget-header');

    const postTitleAndUrls = getTitleAndPostUrls(nodes);

    // console.log(JSON.stringify(results));
    console.log(postTitleAndUrls);

    return postTitleAndUrls;
  } catch(er) {
    console.error(er);
  }
};

// 文字コードの取得
const encodingFunc = async (buffer: Buffer) => {
  const encoding = chardet.detect(Buffer.from(buffer));

  if (!encoding) throw new Error();

  return encoding;
};


// タイトルと記事タイトルのリンク取得
const getTitleAndPostUrls = (nodes: NodeListOf<Element>) => {
  const results = Array.from(nodes).map(el => {
    const titleHeading = el.querySelector('h2 > a');
    const date = el.querySelector('.clear > .date');

    if (!titleHeading || !date) return;

    const titleText = titleHeading.textContent?.trim();
    const postUrl = titleHeading.getAttribute('href');
    const createdAt = date.textContent?.trim();

    if (!titleText || !postUrl || !createdAt) return;

    const posts = {
      title: titleText,
      url: postUrl,
      createdAt: replacementDateStr(createdAt),
    };

    return posts;
  });

  return results;
};

// 日付の整形
const replacementDateStr = (date: string) => {
  return date.replace(/[年|月|日]/g, '-').replace(/-$/g, '');
};

mainFunc();
