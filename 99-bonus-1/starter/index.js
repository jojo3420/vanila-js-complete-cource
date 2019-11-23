const fs = require('fs');
const http = require('http');
const url = require('url');
const port = 1337;
const hostname = '127.0.0.1';

// console.log(`${__dirname}`); // 현재 프로젝트의 절대 경로
// 동기적으로 파일을 읽는 이유는 시스템 시작할 때 한번만 파일을 읽기 때문이다.
const rawJson = fs.readFileSync(`${__dirname}/data/data.json`, 'utf-8');
const productList = JSON.parse(rawJson);
// console.log(productList);

/**
  base node.js api 를 이용하여 라우터 구현
  Express 프레임워크 없이 가장 기본 노드의 api로 라우터 기능을 구현한 것임.
 */
const server = http.createServer((req, res) => {
    // console.log("req: ", req);
    const urlParse = url.parse(req.url, true);
    const {pathname, query} = urlParse;
    // console.log("pathname: ", pathname);
    // console.log("query: ", query);

    // product List
    if (pathname === '/' || pathname === '/products') {
        // 비동기적으로 파일을 읽는다.
        // 비동기적으로 읽는 이유는 노드는 싱글 쓰레드 이기때문에 비동기적으로 해야
        // 다른 클라이언트의 요청을 처리 할 수 있다.
        fs.readFile(`/${__dirname}/templates/template-overview.html`,
            'utf-8',
            function(error, template) {
                fs.readFile(`/${__dirname}/templates/template-card.html`,
                    'utf-8',
                    function (error, cardTemplate) {
                        const cardMarkup = productList.map(product => replaceTemplate(cardTemplate, product)).join('');
                        template = template.replace(/{%CARDS%}/g, cardMarkup);
                        res.writeHeader(200, {'content-type': 'text/html'});
                        res.end(template);
                    });
            });
    }

    // product detail page
    else if (pathname === '/product/detail') {
        const { id } = query;
        const products = productList.filter(p => p.id === id);
        const status = products.length > 0 ? 200 : 404;
        let chuck = '';
        if (status === 200) {
            fs.readFile(`/${__dirname}/templates/template-detail.html`,
                'utf-8', (error, template) => {
                    const product = products[0];
                    const html = replaceTemplate(template, product);
                    res.writeHeader(status, {'content-type': 'text/html'});
                    res.end(html);
                });
        } else {
            chuck = 'Not found product.';
            res.writeHeader(status, {'content-type': 'text/html'});
            res.end(chuck);
        }
    }

    // FILE REQUEST
    else if ((/\.(jpg|png|gif|jpeg)$/i).test(pathname)) {
        const filenames = pathname.split('/');
        const filename = filenames[filenames.length - 1];
        fs.readFile(`/${__dirname}/data/img/${filename}`, (error, image) => {
            res.writeHeader(200, {'content-type': 'image/jpg'});
            res.end(image);
        });
    }

    // NOT FOUND PAGE
    else {
        res.writeHeader(404, {'content-type': 'text.html'});
        res.end('Not found resources.');
    }

});


// request listening
server.listen(port, hostname, () => {
    console.log('server is listening for request...');
});

function replaceTemplate(template, product) {
    const {productName, cpu, storage, ram, screen, price, image, description, id} = product;
    let markup = template.replace(/{%PRODUCT-NAME%}/g, productName);
    markup = markup.replace(/{%CPU%}/g, cpu);
    markup = markup.replace(/{%STORAGE%}/g, storage);
    markup = markup.replace(/{%RAM%}/g, ram);
    markup = markup.replace(/{%DISPLAY%}/g, screen);
    markup = markup.replace(/{%PRICE%}/g, price);
    markup = markup.replace(/{%SRC%}/g, image);
    markup = markup.replace(/{%DESCRIPTION%}/g, description);
    markup = markup.replace(/{%ID%}/g, id);
    return markup;
}
