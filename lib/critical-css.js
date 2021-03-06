const critical = require('critical');
const getShopUrls = require('./getShopUrls');

const dimensions = [{
	height: 640,	// moto G4
	width: 360
},
{
	height: 1024, // ipad
	width: 768
},
{
	height: 750, // macbook pro(ish)
	width: 1200
}];


function generateForPage(shop, shopUrl) {
	console.log(`> Generating critical css for ${shopUrl.url}`);
	return critical.generate({
		src: shopUrl.url,
		dimensions: dimensions,
		extract: true,
		minify: true,
		ignore: {
			atrule: ['@font-face', '@keyframes', '@-moz-keyframes', '@-webkit-keyframes'],
			decl: (node, value) => /url\(/.test(value),
		}
	}).then(({css, html}) => {
		return {
			type: shopUrl.type,
			css: css
		}
	}).catch(e => {
		throw e;
	});
}

function printStyles(css) {
	let elseIf = '';
	let firstIf = '';
	let lastElse = '';
	css.forEach(page => {
		if(page.type === 'index') {
			lastElse = `{% else %}\n  <style id="critical-css-${page.type}">${page.css}</style>\n{% endif %}`;
		}
		else if(page.type === 'list-collections') {
			firstIf = `{% if template contains 'list-collections' %}\n  <style id="critical-css-${page.type}">${page.css}</style>\n`;
		}
		else {
			elseIf += `{% elsif template contains '${page.type}' %}\n  <style id="critical-css-${page.type}">${page.css}</style>\n`;
		}
	})
	return firstIf + elseIf + lastElse;
}

async function generateForShop(shopifyAdmin, cb) {
	console.log(`> Generating Critical css for shop: ${shopifyAdmin.shop}`)
	const shopUrls = await getShopUrls(shopifyAdmin);
	console.log(`> Generated shopify URLs`)
	const promises = shopUrls.map(shopUrl => generateForPage(shopifyAdmin.shop, shopUrl));
	const data = await Promise.all(promises)
	console.log('> Critical css generated for all pages');
	const criticalCss = printStyles(data);
	if(typeof cb === 'function') {
		cb(criticalCss);
	}
	return criticalCss;
}

module.exports = {
	generateForShop
}
