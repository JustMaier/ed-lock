module.exports = {
    plugins: {
        'posthtml-expressions': {
            locals: {
                APP_NAME: process.env.APP_NAME
            }
        }
    }
};