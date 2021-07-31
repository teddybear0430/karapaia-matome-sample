import fetch from 'node-fetch';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import jsdom from 'jsdom';

const { JSDOM } = jsdom;

const URL = 'https://karapaia.com/';

// メインの処理
const mainFunc = async () => {
  const res = await fetch(URL);
  const buffer = await res.buffer();
  const encoding = await encodingFunc(buffer);

  const html = iconv.decode(buffer, encoding);
   
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const nodes = document.querySelectorAll('.widget-header > h2');

  const results = Array.from(nodes, el => el.textContent?.trim());
  console.log(results);
};

// 文字コードの取得
const encodingFunc = async (buffer: Buffer) => {
  const encoding = chardet.detect(Buffer.from(buffer));

  if (!encoding) throw new Error();

  return encoding;
};

mainFunc();
