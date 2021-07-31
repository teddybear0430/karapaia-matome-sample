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

    if (!postTitleAndUrls) return;

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
    const comment = el.querySelector('.clear > a:nth-of-type(1)');

    if (!titleHeading || !date || !comment) return;

    const title = titleHeading.textContent?.trim() as string;
    const url = titleHeading.getAttribute('href') as string;
    const createdAt = replacementDateStr(date.textContent?.trim() as string);
    const commentCount = comment.textContent?.trim() as string;

    const posts = {
      title: title,
      url: url,
      createdAt: createdAt,
      comment: parseInt(pickCommentCount(commentCount) as string),
    };

    return posts;
  });

  return results;
};

// 日付の整形
const replacementDateStr = (date: string) => {
  return date.replace(/[年|月|日]/g, '-').replace(/-$/g, '');
};

// コメントのテキストからコメント数だけ抜き出す
const pickCommentCount = (comment: string) => {
  const find = comment.match(/[0-9]+/);
  
  if (!find) return;
  
  const commentCount = find[0];

  return commentCount;
};

mainFunc();
