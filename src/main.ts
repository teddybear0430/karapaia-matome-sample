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
    const nodes = document.querySelectorAll('.widget-header h2 > a');
    const postTitleAndUrls = getTitleAndPostUrls(nodes);

    // console.log(JSON.stringify(results));
    console.log(postTitleAndUrls);

    return postTitleAndUrls;
  } catch(er) {
    console.error(er);
  }
};

// タイトルと記事タイトルのリンク取得
const getTitleAndPostUrls = (nodes: NodeListOf<Element>) => {
  const results = Array.from(nodes).map(el => {
    const titleText = el.textContent?.trim();
    const postUrl = el.getAttribute('href');

    if (!titleText || !postUrl) return;

    const posts = {
      title: titleText,
      url: postUrl,
    };

    return posts;
  });

  return results;
};

// 文字コードの取得
const encodingFunc = async (buffer: Buffer) => {
  const encoding = chardet.detect(Buffer.from(buffer));

  if (!encoding) throw new Error();

  return encoding;
};

mainFunc();
