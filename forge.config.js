module.exports = {
    packagerConfig: {
        name: 'youdownloader',
        icon: './src/images/logo.ico',
        copyright: 'MIT (c) Blooym 2021',
    },
    makers: [
        {
            name: '@electron-forge/maker-zip',
        },
        {
            name: '@electron-forge/maker-squirrel',
        },
    ],
};
