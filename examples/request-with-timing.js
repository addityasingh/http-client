const {parse} = require('url');
const requestWithTiming = require('../dist/request/index').default;

requestWithTiming(Object.assign({}, 
    parse("https://api.github.com/users"),
    {
        headers: {
            'User-Agent': 'Example'
        },
        timeout: 500
    }), (err, res) => {
        if(err) {
            console.error('>>>>>>>>>>>error',err);
        } else {
            console.log(res.timings);
        }
});