import fetch from 'node-fetch';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import jsdom from 'jsdom';
import { config } from './config';
const { JSDOM } = jsdom;

// メインの処理
export const mainFunc = async () => {
  const { url, pageNum } = config;
  const urls = [...Array(pageNum)].map((_, i) => `${url}?p=${++i}`);

  try {
    // MEMO: Promise.allでawaitする方法
    // https://stackoverflow.com/questions/31710768/how-can-i-fetch-an-array-of-urls-with-promise-all
    const data = await Promise.all(urls.map(async url => {
      const res = await fetch(url);
      const buffer = await res.buffer();
      const encoding = await encodingFunc(buffer);

      const html = iconv.decode(buffer, encoding);

      const dom = new JSDOM(html);
      const document = dom.window.document;
      const nodes = document.querySelectorAll('.widget-header');

      return scrapingFunc(nodes);
    }));

    if (!data) return;

    // 多次元配列になってしまっているので、一次元配列に変換する
    const results = data.reduce((prev, current) => {
      return [...prev, ...current];
    }, []);

    console.log(JSON.stringify(results));
    console.log(results);

    return results;
  } catch(er) {
    console.error(er);
  }
};

// 文字コードの取得・・・UTF8ではなく、euc-jpのため
// そのままHTMLを取得してパースすると文字化けしてしまった
const encodingFunc = async (buffer: Buffer) => {
  const encoding = chardet.detect(Buffer.from(buffer));

  if (!encoding) throw new Error();

  return encoding;
};

// スクレイピングの実行
const scrapingFunc = (nodes: NodeListOf<Element>) => {
  const results = Array.from(nodes).map(el => {
    const titleHeading = el.querySelector('h2 > a');
    const date = el.querySelector('.clear > .date');
    const comment = el.querySelector('.clear > a:nth-of-type(1)');
    const archiveFirst = el.querySelector('.clear > a:nth-of-type(2)');
    const archiveSecond = el.querySelector('.clear > a:nth-of-type(3)');

    if (!titleHeading || !date || !comment || !archiveFirst || !archiveSecond) return;

    const commentCount = getInnerText(comment);

    const posts = {
      title: getInnerText(titleHeading),
      url: getHref(titleHeading),
      createdAt: replacementDateStr(getInnerText(date)),
      comment: parseInt(pickCommentCount(commentCount) as string),
      archives: [
        {
          catName: getInnerText(archiveFirst),
          catUrl: getHref(archiveFirst),
        },
        {
          catName: getInnerText(archiveSecond),
          catUrl: getHref(archiveSecond),
        }
      ],
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

// タグ内部のテキストを取得
const getInnerText = (el: Element) => {
  return el.textContent?.trim() as string;
};

// タグ内部のリンクを取得
const getHref = (el: Element) => {
  return el.getAttribute('href') as string;
};
